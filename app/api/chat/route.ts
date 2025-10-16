import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
import {
  getOrCreateConversation,
  saveMessage,
  buildConversationContext,
  progressConversationStage,
  generateConversationTitle,
  updateConversationTitle,
} from "@/lib/services/conversation"
import { getSystemPromptForStage, shouldTransitionStage, getSuggestedRepliesForStage } from "@/lib/flow"
import { parseCheckInFromText, createCheckIn } from "@/lib/services/check-in"
import { parseJournalFromText, createJournalEntry } from "@/lib/services/journal"
import { checkAndCreateAutoMilestones } from "@/lib/services/milestone"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
})

export async function POST(req: Request) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, conversationId } = await req.json()
    const userId = user.id

    await ensureUserSynced(userId, user)

    const conversation = conversationId
      ? await getExistingConversation(conversationId, userId)
      : await getOrCreateConversation(userId)

    const userMessage = messages[messages.length - 1]
    const userMessageContent = extractMessageContent(userMessage)

    await saveMessage(conversation.id, "user", userMessageContent)

    const context = await buildConversationContext(
      userId,
      conversation.id,
      conversation.stage
    )

    const systemPrompt = getSystemPromptForStage(conversation.stage, context)

    const conversationHistory = (context.recentMessages || [])
      .filter((msg) => msg.content && msg.content.trim())
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    const clientMessages = messages
      .map((msg: { role?: string; content?: string; parts?: Array<{ type: string; text?: string }> }) => {
        const content = extractMessageContent(msg)
        return {
          role: msg.role || 'user',
          content: content,
        }
      })
      .filter((msg: { role: string; content: string }) => msg.content && msg.content.trim())

    const allMessages = [...conversationHistory, ...clientMessages]

    let stageMessageCount = (context.recentMessages || []).filter(
      (m) => m.role === "user"
    ).length

    let nextStage = conversation.stage

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: allMessages,
      async onFinish({ text }) {
        await saveMessage(conversation.id, "assistant", text)

        await handleStageSpecificActions(
          userId,
          conversation.stage,
          userMessageContent
        )

        if (
          shouldTransitionStage(
            conversation.stage,
            stageMessageCount + 1,
            userMessageContent
          )
        ) {
          nextStage = await progressConversationStage(conversation.id, conversation.stage)
        }

        if ((context.recentMessages || []).length <= 2) {
          const title = generateConversationTitle([
            ...(context.recentMessages || []),
            { id: 0, conversation_id: conversation.id, role: "user", content: userMessageContent, created_at: new Date() },
          ])
          await updateConversationTitle(conversation.id, title)
        }

        await checkAndCreateAutoMilestones(userId)
      },
    })

    const suggestedReplies = getSuggestedRepliesForStage(nextStage, context)

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": conversation.id.toString(),
        "X-Current-Stage": nextStage,
        "X-Suggested-Replies": JSON.stringify(suggestedReplies),
      },
    })
  } catch (error) {
    console.error("Error in chat route:", error)
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

async function ensureUserSynced(userId: string, user: { displayName?: string | null; primaryEmail?: string | null }) {
  const userExists = await sql`
    SELECT id FROM neon_auth.users_sync WHERE id = ${userId}
  `

  if (userExists.length === 0) {
    const userJson = JSON.stringify({
      id: userId,
      display_name: user.displayName || null,
      primary_email: user.primaryEmail || null,
      signed_up_at_millis: Date.now(),
    })

    await sql`
      INSERT INTO neon_auth.users_sync (raw_json)
      VALUES (${userJson})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

async function getExistingConversation(conversationId: number, userId: string) {
  const result = await sql`
    SELECT id, user_id, title, stage, created_at, updated_at
    FROM conversations
    WHERE id = ${conversationId} AND user_id = ${userId}
  `

  if (result.length === 0) {
    throw new Error("Conversation not found or unauthorized")
  }

  return result[0]
}

function extractMessageContent(message: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  if (message.content) {
    return message.content
  }

  return (
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ") || ""
  )
}

async function handleStageSpecificActions(
  userId: string,
  stage: string,
  userMessage: string
) {
  try {
    if (stage === "check_in") {
      const checkInData = parseCheckInFromText(userMessage)
      if (checkInData) {
        await createCheckIn(userId, checkInData)
        console.log(`Check-in created for user ${userId}`)
      }
    }

    if (stage === "journal_prompt") {
      const journalData = parseJournalFromText(userMessage)
      if (journalData) {
        await createJournalEntry(userId, journalData)
        console.log(`Journal entry created for user ${userId}`)
      }
    }
  } catch (error) {
    console.error("Error handling stage-specific actions:", error)
  }
}

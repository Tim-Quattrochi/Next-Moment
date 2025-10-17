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
import { getSystemPromptForStage, getSuggestedRepliesForStage } from "@/lib/flow"
import { createCheckIn } from "@/lib/services/check-in"
import { createJournalEntry } from "@/lib/services/journal"
import { checkAndCreateAutoMilestones } from "@/lib/services/milestone"
import { shouldTransitionStageAI, extractCheckInDataAI, extractJournalDataAI } from "@/lib/ai-stage-detection"

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

    let nextStage = conversation.stage

    let updatedContext = context
    let suggestedReplies = getSuggestedRepliesForStage(nextStage, context)

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: allMessages,
      async onFinish({ text }) {
        await saveMessage(conversation.id, "assistant", text)

        // Get fresh context with all messages including the ones just saved
        const freshContext = await buildConversationContext(
          userId,
          conversation.id,
          conversation.stage
        )

        // Handle stage-specific data extraction using AI
        await handleStageSpecificActionsAI(
          userId,
          conversation.stage,
          freshContext.recentMessages || []
        )

        // Use AI to determine if stage should transition
        const userMessageCountInStage = (freshContext.recentMessages || []).filter(
          (m) => m.role === "user"
        ).length

        const transitionResult = await shouldTransitionStageAI(
          conversation.stage,
          freshContext.recentMessages || [],
          userMessageCountInStage
        )

        console.log(`[STAGE TRANSITION CHECK] Stage: ${conversation.stage}, Should Transition: ${transitionResult.shouldTransition}, Reasoning: ${transitionResult.reasoning}`)

        if (transitionResult.shouldTransition) {
          nextStage = await progressConversationStage(conversation.id, conversation.stage)
          console.log(`[STAGE TRANSITIONED] ${conversation.stage} → ${nextStage}`)
        }

        if ((context.recentMessages || []).length <= 2) {
          const title = generateConversationTitle([
            ...(context.recentMessages || []),
            { id: 0, conversation_id: conversation.id, role: "user", content: userMessageContent, created_at: new Date() },
          ])
          await updateConversationTitle(conversation.id, title)
        }

        await checkAndCreateAutoMilestones(userId)

        // Rebuild context with the newly saved messages and updated stage
        updatedContext = await buildConversationContext(
          userId,
          conversation.id,
          nextStage
        )

        // Update suggested replies with fresh context
        suggestedReplies = getSuggestedRepliesForStage(nextStage, updatedContext)
      },
    })

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

/**
 * Handle stage-specific data extraction using AI
 */
async function handleStageSpecificActionsAI(
  userId: string,
  stage: string,
  recentMessages: Array<{ role: string; content: string }>
) {
  try {
    if (stage === "check_in") {
      const checkInData = await extractCheckInDataAI(recentMessages)
      if (checkInData) {
        await createCheckIn(userId, checkInData)
        console.log(`[CHECK-IN CREATED] User: ${userId}, Mood: ${checkInData.mood}, Sleep: ${checkInData.sleepQuality}/5, Energy: ${checkInData.energyLevel}/5`)
      } else {
        console.log(`[CHECK-IN EXTRACTION] Not enough data yet for user ${userId}`)
      }
    }

    if (stage === "journal_prompt") {
      const journalData = await extractJournalDataAI(recentMessages)
      if (journalData) {
        await createJournalEntry(userId, journalData)
        console.log(`[JOURNAL CREATED] User: ${userId}, Title: "${journalData.title}", Length: ${journalData.content.length} chars`)
      } else {
        console.log(`[JOURNAL EXTRACTION] No journal content detected for user ${userId}`)
      }
    }
  } catch (error) {
    console.error("[STAGE-SPECIFIC ACTIONS ERROR]", error)
  }
}

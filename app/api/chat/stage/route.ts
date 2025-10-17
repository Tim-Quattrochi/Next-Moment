import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
import { getSuggestedRepliesForStage } from "@/lib/flow"
import { buildConversationContext } from "@/lib/services/conversation"
import type { RecoveryStage } from "@/lib/types"

/**
 * GET /api/chat/stage
 * Returns the current conversation stage and suggested replies
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Get the user's most recent conversation
    const conversations = await sql<{
      id: number
      stage: RecoveryStage
    }[]>`
      SELECT id, stage
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (conversations.length === 0) {
      // No conversation yet - return greeting stage
      return Response.json({
        conversationId: null,
        stage: "greeting",
        suggestedReplies: [
          { text: "Yes, let's check in", type: "quick" },
          { text: "Tell me more about how this works", type: "detailed" },
          { text: "I'm ready to start", type: "quick" },
        ],
      })
    }

    const conversation = conversations[0]

    // Build context to get contextual suggested replies
    const context = await buildConversationContext(
      userId,
      conversation.id,
      conversation.stage
    )

    const suggestedReplies = getSuggestedRepliesForStage(
      conversation.stage,
      context
    )

    return Response.json({
      conversationId: conversation.id,
      stage: conversation.stage,
      suggestedReplies,
    })
  } catch (error) {
    console.error("Error fetching conversation stage:", error)
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

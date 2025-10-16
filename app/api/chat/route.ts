import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, convertToModelMessages } from "ai"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
})

export async function POST(req: Request) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages } = await req.json()
    const userId = user.id

    // Ensure user exists in users_sync table
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

    // Get or create conversation
    const userMessage = messages[messages.length - 1]
    const conversation = await sql`
      INSERT INTO conversations (user_id, title)
      VALUES (${userId}, 'New Conversation')
      RETURNING id
    `
    const convId = conversation[0].id

    // Extract text content from message parts
    const userMessageContent =
      userMessage.parts
        ?.filter((part: { type: string }) => part.type === "text")
        .map((part: { text: string }) => part.text)
        .join(" ") || ""

    // Save user message to database
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${userMessageContent})
    `

    // Recovery-focused system prompt
    const systemPrompt = `You are a compassionate AI companion for individuals in recovery from addiction. Your role is to:

- Provide empathetic, non-judgmental support
- Encourage healthy coping mechanisms and self-reflection
- Celebrate progress, no matter how small
- Offer gentle guidance without being prescriptive
- Help users identify triggers and develop strategies
- Promote mindfulness, gratitude, and self-compassion
- Recognize signs of crisis and encourage professional help when needed

Guidelines:
- Use warm, supportive language
- Validate feelings and experiences
- Ask thoughtful questions to promote reflection
- Offer encouragement and hope
- Never provide medical advice
- If the user expresses suicidal thoughts or immediate danger, encourage them to contact emergency services or a crisis hotline

Remember: You're here to listen, support, and empower. Every conversation is confidential and judgment-free.`

    // Convert UIMessages to CoreMessages format
    const coreMessages = convertToModelMessages(messages)

    // Use the new AI SDK streamText
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: coreMessages,
      async onFinish({ text }) {
        // Save assistant response to database
        await sql`
          INSERT INTO messages (conversation_id, role, content)
          VALUES (${convId}, 'assistant', ${text})
        `

        // Update conversation timestamp
        await sql`
          UPDATE conversations
          SET updated_at = NOW()
          WHERE id = ${convId}
        `
      },
    })

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": convId.toString(),
      },
    })
  } catch (error) {
    console.error("Error in chat route:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

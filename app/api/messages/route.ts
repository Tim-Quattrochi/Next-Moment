import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversationId")

    const userId = user.id

    // Ensure user exists in users_sync table
    const userExists = await sql`
      SELECT id FROM neon_auth.users_sync WHERE id = ${userId}
    `

    if (userExists.length === 0) {
      // Sync user to users_sync table with raw_json
      const userJson = JSON.stringify({
        id: userId,
        display_name: user.displayName || null,
        primary_email: user.primaryEmail || null,
        signed_up_at_millis: Date.now()
      })

      await sql`
        INSERT INTO neon_auth.users_sync (raw_json)
        VALUES (${userJson})
        ON CONFLICT (id) DO NOTHING
      `
      console.log("[DEBUG] Synced user to users_sync table:", userId)
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await sql`
        SELECT * FROM conversations 
        WHERE id = ${conversationId} AND user_id = ${userId}
      `
    } else {
      const existing = await sql`
        SELECT * FROM conversations 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT 1
      `

      if (existing.length > 0) {
        conversation = existing
      } else {
        conversation = await sql`
          INSERT INTO conversations (user_id, title)
          VALUES (${userId}, 'New Conversation')
          RETURNING *
        `
      }
    }

    const convId = conversationId || conversation[0].id

    // Get messages for conversation
    const messages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${convId}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      conversationId: convId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, role, content } = await request.json()

    if (!role || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    // Ensure user exists in users_sync table before creating conversation
    const userExists = await sql`
      SELECT id FROM neon_auth.users_sync WHERE id = ${userId}
    `

    if (userExists.length === 0) {
      // Sync user to users_sync table with raw_json
      const userJson = JSON.stringify({
        id: userId,
        display_name: user.displayName || null,
        primary_email: user.primaryEmail || null,
        signed_up_at_millis: Date.now()
      })

      await sql`
        INSERT INTO neon_auth.users_sync (raw_json)
        VALUES (${userJson})
        ON CONFLICT (id) DO NOTHING
      `
      console.log("[DEBUG] Synced user to users_sync table:", userId)
    }

    // Create conversation if needed
    let convId = conversationId
    if (!convId) {
      const conversation = await sql`
        INSERT INTO conversations (user_id, title)
        VALUES (${userId}, 'New Conversation')
        RETURNING id
      `
      convId = conversation[0].id
    }

    // Insert message
    const message = await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, ${role}, ${content})
      RETURNING *
    `

    // Update conversation timestamp
    await sql`
      UPDATE conversations 
      SET updated_at = NOW()
      WHERE id = ${convId}
    `

    return NextResponse.json({
      conversationId: convId,
      message: {
        id: message[0].id,
        role: message[0].role,
        content: message[0].content,
        timestamp: message[0].created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}

import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const entries = await sql`
      SELECT * FROM journal_entries 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        wordCount: e.word_count,
        aiInsights: e.ai_insights,
        date: e.created_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching journal entries:", error)
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, wordCount, aiInsights } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    const entry = await sql`
      INSERT INTO journal_entries (user_id, title, content, word_count, ai_insights)
      VALUES (${userId}, ${title}, ${content}, ${wordCount || 0}, ${aiInsights ? JSON.stringify(aiInsights) : null})
      RETURNING *
    `

    return NextResponse.json({
      entry: {
        id: entry[0].id,
        title: entry[0].title,
        content: entry[0].content,
        wordCount: entry[0].word_count,
        aiInsights: entry[0].ai_insights,
        date: entry[0].created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating journal entry:", error)
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, title, content, wordCount, aiInsights } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    const entry = await sql`
      UPDATE journal_entries 
      SET title = COALESCE(${title}, title),
          content = COALESCE(${content}, content),
          word_count = COALESCE(${wordCount}, word_count),
          ai_insights = COALESCE(${aiInsights ? JSON.stringify(aiInsights) : null}, ai_insights),
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    return NextResponse.json({
      entry: {
        id: entry[0].id,
        title: entry[0].title,
        content: entry[0].content,
        wordCount: entry[0].word_count,
        aiInsights: entry[0].ai_insights,
        date: entry[0].updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating journal entry:", error)
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 })
  }
}

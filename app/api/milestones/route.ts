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

    const milestones = await sql`
      SELECT * FROM milestones 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      milestones: milestones.map((m) => ({
        id: m.id,
        type: m.type,
        name: m.name,
        description: m.description,
        progress: m.progress,
        unlocked: m.unlocked,
        unlockedAt: m.unlocked_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching milestones:", error)
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, name, description, progress } = await request.json()

    if (!type || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    const milestone = await sql`
      INSERT INTO milestones (user_id, type, name, description, progress)
      VALUES (${userId}, ${type}, ${name}, ${description}, ${progress || 0})
      RETURNING *
    `

    return NextResponse.json({
      milestone: {
        id: milestone[0].id,
        type: milestone[0].type,
        name: milestone[0].name,
        description: milestone[0].description,
        progress: milestone[0].progress,
        unlocked: milestone[0].unlocked,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating milestone:", error)
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, progress, unlocked } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    const milestone = await sql`
      UPDATE milestones 
      SET progress = ${progress}, 
          unlocked = ${unlocked},
          unlocked_at = ${unlocked ? sql`NOW()` : sql`unlocked_at`}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    return NextResponse.json({
      milestone: {
        id: milestone[0].id,
        progress: milestone[0].progress,
        unlocked: milestone[0].unlocked,
        unlockedAt: milestone[0].unlocked_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating milestone:", error)
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 })
  }
}

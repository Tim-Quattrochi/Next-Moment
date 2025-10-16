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

    const checkIns = await sql`
      SELECT * FROM check_ins 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 30
    `

    return NextResponse.json({
      checkIns: checkIns.map((c) => ({
        id: c.id,
        mood: c.mood,
        sleepQuality: c.sleep_quality,
        energyLevel: c.energy_level,
        intentions: c.intentions,
        date: c.created_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching check-ins:", error)
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mood, sleepQuality, energyLevel, intentions } = await request.json()

    if (!mood) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = user.id

    const checkIn = await sql`
      INSERT INTO check_ins (user_id, mood, sleep_quality, energy_level, intentions)
      VALUES (${userId}, ${mood}, ${sleepQuality}, ${energyLevel}, ${intentions})
      RETURNING *
    `

    return NextResponse.json({
      checkIn: {
        id: checkIn[0].id,
        mood: checkIn[0].mood,
        sleepQuality: checkIn[0].sleep_quality,
        energyLevel: checkIn[0].energy_level,
        intentions: checkIn[0].intentions,
        date: checkIn[0].created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating check-in:", error)
    return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 })
  }
}

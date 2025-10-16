/**
 * Check-In Service
 * Handles daily wellness check-in operations and streak tracking
 */

import { sql } from "../db";
import type { CheckIn, CheckInData } from "../types";

export async function createCheckIn(
  userId: string,
  data: CheckInData
): Promise<CheckIn> {
  const { mood, sleepQuality, energyLevel, intentions } = data;

  if (!mood || sleepQuality < 1 || sleepQuality > 5 || energyLevel < 1 || energyLevel > 5) {
    throw new Error("Invalid check-in data. Mood, sleep quality (1-5), and energy level (1-5) are required.");
  }

  try {
    const result = await sql`
      INSERT INTO check_ins (user_id, mood, sleep_quality, energy_level, intentions, created_at)
      VALUES (${userId}, ${mood}, ${sleepQuality}, ${energyLevel}, ${intentions}, NOW())
      RETURNING id, user_id, mood, sleep_quality, energy_level, intentions, created_at
    `;

    return result[0] as CheckIn;
  } catch (error) {
    console.error("Error creating check-in:", error);
    throw new Error("Failed to create check-in");
  }
}

export async function getRecentCheckIns(
  userId: string,
  limit: number = 7
): Promise<CheckIn[]> {
  try {
    const result = await sql`
      SELECT id, user_id, mood, sleep_quality, energy_level, intentions, created_at
      FROM check_ins
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result as CheckIn[];
  } catch (error) {
    console.error("Error getting recent check-ins:", error);
    throw new Error("Failed to fetch check-ins");
  }
}

export async function getCheckInById(
  checkInId: number,
  userId: string
): Promise<CheckIn | null> {
  try {
    const result = await sql`
      SELECT id, user_id, mood, sleep_quality, energy_level, intentions, created_at
      FROM check_ins
      WHERE id = ${checkInId} AND user_id = ${userId}
    `;

    return (result[0] as CheckIn) || null;
  } catch (error) {
    console.error("Error getting check-in:", error);
    throw new Error("Failed to fetch check-in");
  }
}

export async function getCheckInsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CheckIn[]> {
  try {
    const result = await sql`
      SELECT id, user_id, mood, sleep_quality, energy_level, intentions, created_at
      FROM check_ins
      WHERE user_id = ${userId}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      ORDER BY created_at DESC
    `;

    return result as CheckIn[];
  } catch (error) {
    console.error("Error getting check-ins by date range:", error);
    throw new Error("Failed to fetch check-ins");
  }
}

export async function hasCheckInToday(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE user_id = ${userId}
        AND DATE(created_at) = CURRENT_DATE
    `;

    const count = parseInt((result[0] as any).count as string, 10);
    return count > 0;
  } catch (error) {
    console.error("Error checking today's check-in:", error);
    return false;
  }
}

export async function getCheckInStreak(userId: string): Promise<number> {
  try {
    const result = await sql`
      WITH daily_checkins AS (
        SELECT DISTINCT DATE(created_at) as check_date
        FROM check_ins
        WHERE user_id = ${userId}
        ORDER BY check_date DESC
      ),
      streak AS (
        SELECT
          check_date,
          ROW_NUMBER() OVER (ORDER BY check_date DESC) as rn,
          check_date - (ROW_NUMBER() OVER (ORDER BY check_date DESC) * INTERVAL '1 day') as grp
        FROM daily_checkins
      )
      SELECT COUNT(*) as streak_length
      FROM streak
      WHERE grp = (SELECT grp FROM streak ORDER BY check_date DESC LIMIT 1)
    `;

    return parseInt(((result[0] as any)?.streak_length as string) || "0", 10);
  } catch (error) {
    console.error("Error calculating check-in streak:", error);
    return 0;
  }
}

export async function getCheckInStats(userId: string): Promise<{
  total: number;
  averageMood: string;
  averageSleep: number;
  averageEnergy: number;
  currentStreak: number;
}> {
  try {
    const [totalResult, avgResult, streak] = await Promise.all([
      sql`
        SELECT COUNT(*) as total
        FROM check_ins
        WHERE user_id = ${userId}
      `,
      sql`
        SELECT
          AVG(sleep_quality) as avg_sleep,
          AVG(energy_level) as avg_energy,
          MODE() WITHIN GROUP (ORDER BY mood) as most_common_mood
        FROM check_ins
        WHERE user_id = ${userId}
      `,
      getCheckInStreak(userId),
    ]);

    const total = parseInt((totalResult[0] as any).total as string, 10);
    const avgSleep = parseFloat(((avgResult[0] as any)?.avg_sleep as string) || "0");
    const avgEnergy = parseFloat(((avgResult[0] as any)?.avg_energy as string) || "0");
    const mostCommonMood = ((avgResult[0] as any)?.most_common_mood as string) || "N/A";

    return {
      total,
      averageMood: mostCommonMood,
      averageSleep: Math.round(avgSleep * 10) / 10,
      averageEnergy: Math.round(avgEnergy * 10) / 10,
      currentStreak: streak,
    };
  } catch (error) {
    console.error("Error getting check-in stats:", error);
    return {
      total: 0,
      averageMood: "N/A",
      averageSleep: 0,
      averageEnergy: 0,
      currentStreak: 0,
    };
  }
}

export function parseCheckInFromText(text: string): CheckInData | null {
  const lowerText = text.toLowerCase();

  const moodMatch = lowerText.match(
    /mood[:\s]+([a-z]+)|feeling[:\s]+([a-z]+)|feel[:\s]+([a-z]+)/i
  );
  const sleepMatch = lowerText.match(/sleep[:\s]+(\d)/i);
  const energyMatch = lowerText.match(/energy[:\s]+(\d)/i);
  const intentionsMatch = lowerText.match(
    /(?:intention|goal|plan)[:\s]+(.+?)(?:\.|$)/i
  );

  const mood = moodMatch?.[1] || moodMatch?.[2] || moodMatch?.[3];
  const sleepQuality = sleepMatch ? parseInt(sleepMatch[1], 10) : null;
  const energyLevel = energyMatch ? parseInt(energyMatch[1], 10) : null;
  const intentions = intentionsMatch?.[1]?.trim() || "";

  if (mood && sleepQuality && energyLevel) {
    return {
      mood,
      sleepQuality,
      energyLevel,
      intentions: intentions || "No specific intentions set",
    };
  }

  return null;
}

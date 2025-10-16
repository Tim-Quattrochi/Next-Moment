/**
 * Milestone Service
 * Handles milestone creation, progress tracking, and automatic unlocking
 */

import { sql } from "../db";
import type { Milestone, MilestoneData } from "../types";

/**
 * Create a new milestone
 */
export async function createMilestone(
  userId: string,
  data: MilestoneData
): Promise<Milestone> {
  const { type, name, description, progress = 0 } = data;

  if (!type || !name) {
    throw new Error("Milestone type and name are required.");
  }

  if (progress < 0 || progress > 100) {
    throw new Error("Milestone progress must be between 0 and 100.");
  }

  try {
    const result = await sql`
      INSERT INTO milestones (user_id, type, name, description, progress, created_at)
      VALUES (${userId}, ${type}, ${name}, ${description || null}, ${progress}, NOW())
      RETURNING id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
    `;

    return result[0] as any;
  } catch (error) {
    console.error("Error creating milestone:", error);
    throw new Error("Failed to create milestone");
  }
}

/**
 * Update milestone progress
 */
export async function updateMilestoneProgress(
  milestoneId: number,
  userId: string,
  progress: number
): Promise<Milestone> {
  if (progress < 0 || progress > 100) {
    throw new Error("Progress must be between 0 and 100.");
  }

  try {
    const shouldUnlock = progress >= 100;
    const unlockedAt = shouldUnlock ? new Date().toISOString() : null;

    const result = await sql`
      UPDATE milestones
      SET
        progress = ${progress},
        unlocked = ${shouldUnlock},
        unlocked_at = ${shouldUnlock && unlockedAt ? unlockedAt : sql`unlocked_at`}
      WHERE id = ${milestoneId} AND user_id = ${userId}
      RETURNING id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
    `;

    if (result.length === 0) {
      throw new Error("Milestone not found or unauthorized");
    }

    return result[0] as any;
  } catch (error) {
    console.error("Error updating milestone progress:", error);
    throw new Error("Failed to update milestone progress");
  }
}

/**
 * Unlock a milestone
 */
export async function unlockMilestone(
  milestoneId: number,
  userId: string
): Promise<Milestone> {
  try {
    const result = await sql`
      UPDATE milestones
      SET unlocked = true, unlocked_at = NOW(), progress = 100
      WHERE id = ${milestoneId} AND user_id = ${userId}
      RETURNING id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
    `;

    if (result.length === 0) {
      throw new Error("Milestone not found or unauthorized");
    }

    return result[0] as any;
  } catch (error) {
    console.error("Error unlocking milestone:", error);
    throw new Error("Failed to unlock milestone");
  }
}

/**
 * Get all milestones for a user
 */
export async function getUserMilestones(
  userId: string,
  includeUnlocked: boolean = true
): Promise<Milestone[]> {
  try {
    const query = includeUnlocked
      ? sql<Milestone>`
          SELECT id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
          FROM milestones
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `
      : sql<Milestone>`
          SELECT id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
          FROM milestones
          WHERE user_id = ${userId} AND unlocked = false
          ORDER BY created_at DESC
        `;

    const result = await query;
    return result;
  } catch (error) {
    console.error("Error getting user milestones:", error);
    throw new Error("Failed to fetch milestones");
  }
}

/**
 * Get milestone by ID
 */
export async function getMilestoneById(
  milestoneId: number,
  userId: string
): Promise<Milestone | null> {
  try {
    const result = await sql`
      SELECT id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
      FROM milestones
      WHERE id = ${milestoneId} AND user_id = ${userId}
    `;

    return result[0] as any || null;
  } catch (error) {
    console.error("Error getting milestone:", error);
    throw new Error("Failed to fetch milestone");
  }
}

/**
 * Get milestones by type
 */
export async function getMilestonesByType(
  userId: string,
  type: string
): Promise<Milestone[]> {
  try {
    const result = await sql`
      SELECT id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
      FROM milestones
      WHERE user_id = ${userId} AND type = ${type}
      ORDER BY created_at DESC
    `;

    return result;
  } catch (error) {
    console.error("Error getting milestones by type:", error);
    throw new Error("Failed to fetch milestones");
  }
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(
  milestoneId: number,
  userId: string
): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM milestones
      WHERE id = ${milestoneId} AND user_id = ${userId}
    `;

    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting milestone:", error);
    throw new Error("Failed to delete milestone");
  }
}

/**
 * Get milestone statistics for a user
 */
export async function getMilestoneStats(userId: string): Promise<{
  total: number;
  unlocked: number;
  inProgress: number;
  percentageComplete: number;
}> {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE unlocked = true) as unlocked,
        COUNT(*) FILTER (WHERE unlocked = false) as in_progress,
        AVG(progress) as avg_progress
      FROM milestones
      WHERE user_id = ${userId}
    `;

    const total = parseInt((result[0] as any).total as string, 10);
    const unlocked = parseInt((result[0] as any).unlocked as string || "0", 10);
    const inProgress = parseInt((result[0] as any).in_progress as string || "0", 10);
    const avgProgress = parseFloat((result[0] as any).avg_progress as string || "0");

    return {
      total,
      unlocked,
      inProgress,
      percentageComplete: Math.round(avgProgress),
    };
  } catch (error) {
    console.error("Error getting milestone stats:", error);
    return {
      total: 0,
      unlocked: 0,
      inProgress: 0,
      percentageComplete: 0,
    };
  }
}

/**
 * Check and create automatic milestones based on user activity
 */
export async function checkAndCreateAutoMilestones(
  userId: string
): Promise<Milestone[]> {
  const newMilestones: Milestone[] = [];

  try {
    const [checkInStreak, journalCount, existingMilestones] = await Promise.all([
      getCheckInStreakForMilestones(userId),
      getJournalCountForMilestones(userId),
      getUserMilestones(userId),
    ]);

    const milestoneTypes = new Set(existingMilestones.map((m) => m.type));

    if (checkInStreak >= 7 && !milestoneTypes.has("check_in_streak_7")) {
      const milestone = await createMilestone(userId, {
        type: "check_in_streak_7",
        name: "Week of Consistency",
        description: "Complete check-ins for 7 consecutive days",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    if (checkInStreak >= 30 && !milestoneTypes.has("check_in_streak_30")) {
      const milestone = await createMilestone(userId, {
        type: "check_in_streak_30",
        name: "Month of Dedication",
        description: "Complete check-ins for 30 consecutive days",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    if (journalCount >= 5 && !milestoneTypes.has("journal_entries_5")) {
      const milestone = await createMilestone(userId, {
        type: "journal_entries_5",
        name: "Reflection Beginner",
        description: "Write 5 journal entries",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    if (journalCount >= 25 && !milestoneTypes.has("journal_entries_25")) {
      const milestone = await createMilestone(userId, {
        type: "journal_entries_25",
        name: "Journaling Enthusiast",
        description: "Write 25 journal entries",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    if (checkInStreak >= 1 && !milestoneTypes.has("first_check_in")) {
      const milestone = await createMilestone(userId, {
        type: "first_check_in",
        name: "First Steps",
        description: "Complete your first check-in",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    if (journalCount >= 1 && !milestoneTypes.has("first_journal")) {
      const milestone = await createMilestone(userId, {
        type: "first_journal",
        name: "Beginning to Reflect",
        description: "Write your first journal entry",
        progress: 100,
      });
      await unlockMilestone(milestone.id, userId);
      newMilestones.push(milestone);
    }

    return newMilestones;
  } catch (error) {
    console.error("Error checking and creating auto milestones:", error);
    return newMilestones;
  }
}

/**
 * Helper: Get check-in streak for milestone logic
 */
async function getCheckInStreakForMilestones(userId: string): Promise<number> {
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
    console.error("Error getting check-in streak for milestones:", error);
    return 0;
  }
}

/**
 * Helper: Get journal count for milestone logic
 */
async function getJournalCountForMilestones(userId: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE user_id = ${userId}
    `;

    return parseInt((result[0] as any).count as string, 10);
  } catch (error) {
    console.error("Error getting journal count for milestones:", error);
    return 0;
  }
}

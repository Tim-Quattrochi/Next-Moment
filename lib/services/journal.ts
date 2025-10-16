/**
 * Journal Service
 * Handles journal entry operations, insights, and streak tracking
 */

import { sql } from "../db";
import type { JournalEntry, JournalData } from "../types";

/**
 * Create a new journal entry
 */
export async function createJournalEntry(
  userId: string,
  data: JournalData
): Promise<JournalEntry> {
  const { title, content } = data;

  if (!content || content.trim().length < 10) {
    throw new Error("Journal content must be at least 10 characters long.");
  }

  const wordCount = content.trim().split(/\s+/).length;
  const entryTitle = title || generateTitleFromContent(content);

  try {
    const result = await sql`
      INSERT INTO journal_entries (user_id, title, content, word_count, created_at, updated_at)
      VALUES (${userId}, ${entryTitle}, ${content}, ${wordCount}, NOW(), NOW())
      RETURNING id, user_id, title, content, word_count, ai_insights, created_at, updated_at
    `;

    return result[0] as any;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw new Error("Failed to create journal entry");
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  journalId: number,
  userId: string,
  data: Partial<JournalData>
): Promise<JournalEntry> {
  const { title, content } = data;

  if (content && content.trim().length < 10) {
    throw new Error("Journal content must be at least 10 characters long.");
  }

  const wordCount = content ? content.trim().split(/\s+/).length : undefined;

  try {
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (title !== undefined) {
      updateFields.push(`title = $${updateFields.length + 1}`);
      updateValues.push(title);
    }

    if (content !== undefined) {
      updateFields.push(`content = $${updateFields.length + 1}`);
      updateValues.push(content);
      updateFields.push(`word_count = $${updateFields.length + 1}`);
      updateValues.push(wordCount);
    }

    updateFields.push(`updated_at = NOW()`);

    const result = await sql`
      UPDATE journal_entries
      SET ${sql.raw(updateFields.join(", "))}
      WHERE id = ${journalId} AND user_id = ${userId}
      RETURNING id, user_id, title, content, word_count, ai_insights, created_at, updated_at
    `;

    if (result.length === 0) {
      throw new Error("Journal entry not found or unauthorized");
    }

    return result[0] as any;
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw new Error("Failed to update journal entry");
  }
}

/**
 * Get recent journal entries for a user
 */
export async function getRecentJournalEntries(
  userId: string,
  limit: number = 10
): Promise<JournalEntry[]> {
  try {
    const result = await sql`
      SELECT id, user_id, title, content, word_count, ai_insights, created_at, updated_at
      FROM journal_entries
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error("Error getting recent journal entries:", error);
    throw new Error("Failed to fetch journal entries");
  }
}

/**
 * Get journal entry by ID
 */
export async function getJournalEntryById(
  journalId: number,
  userId: string
): Promise<JournalEntry | null> {
  try {
    const result = await sql`
      SELECT id, user_id, title, content, word_count, ai_insights, created_at, updated_at
      FROM journal_entries
      WHERE id = ${journalId} AND user_id = ${userId}
    `;

    return result[0] as any || null;
  } catch (error) {
    console.error("Error getting journal entry:", error);
    throw new Error("Failed to fetch journal entry");
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(
  journalId: number,
  userId: string
): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM journal_entries
      WHERE id = ${journalId} AND user_id = ${userId}
    `;

    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw new Error("Failed to delete journal entry");
  }
}

/**
 * Get journal entries for a date range
 */
export async function getJournalEntriesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<JournalEntry[]> {
  try {
    const result = await sql`
      SELECT id, user_id, title, content, word_count, ai_insights, created_at, updated_at
      FROM journal_entries
      WHERE user_id = ${userId}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      ORDER BY created_at DESC
    `;

    return result;
  } catch (error) {
    console.error("Error getting journal entries by date range:", error);
    throw new Error("Failed to fetch journal entries");
  }
}

/**
 * Calculate journal streak (consecutive days with entries)
 */
export async function getJournalStreak(userId: string): Promise<number> {
  try {
    const result = await sql`
      WITH daily_journals AS (
        SELECT DISTINCT DATE(created_at) as journal_date
        FROM journal_entries
        WHERE user_id = ${userId}
        ORDER BY journal_date DESC
      ),
      streak AS (
        SELECT
          journal_date,
          ROW_NUMBER() OVER (ORDER BY journal_date DESC) as rn,
          journal_date - (ROW_NUMBER() OVER (ORDER BY journal_date DESC) * INTERVAL '1 day') as grp
        FROM daily_journals
      )
      SELECT COUNT(*) as streak_length
      FROM streak
      WHERE grp = (SELECT grp FROM streak ORDER BY journal_date DESC LIMIT 1)
    `;

    return parseInt(((result[0] as any)?.streak_length as string) || "0", 10);
  } catch (error) {
    console.error("Error calculating journal streak:", error);
    return 0;
  }
}

/**
 * Get journal statistics for a user
 */
export async function getJournalStats(userId: string): Promise<{
  total: number;
  totalWords: number;
  averageWords: number;
  currentStreak: number;
  longestEntry: number;
}> {
  try {
    const [countResult, streak] = await Promise.all([
      sql`
        SELECT
          COUNT(*) as total,
          SUM(word_count) as total_words,
          AVG(word_count) as avg_words,
          MAX(word_count) as longest_entry
        FROM journal_entries
        WHERE user_id = ${userId}
      `,
      getJournalStreak(userId),
    ]);

    const total = parseInt(countResult.rows[0].total as string, 10);
    const totalWords = parseInt(countResult.rows[0].total_words as string || "0", 10);
    const avgWords = parseFloat(countResult.rows[0].avg_words as string || "0");
    const longestEntry = parseInt(countResult.rows[0].longest_entry as string || "0", 10);

    return {
      total,
      totalWords,
      averageWords: Math.round(avgWords),
      currentStreak: streak,
      longestEntry,
    };
  } catch (error) {
    console.error("Error getting journal stats:", error);
    return {
      total: 0,
      totalWords: 0,
      averageWords: 0,
      currentStreak: 0,
      longestEntry: 0,
    };
  }
}

/**
 * Update AI insights for a journal entry
 */
export async function updateJournalInsights(
  journalId: number,
  userId: string,
  insights: Record<string, unknown>
): Promise<void> {
  try {
    await sql`
      UPDATE journal_entries
      SET ai_insights = ${JSON.stringify(insights)}, updated_at = NOW()
      WHERE id = ${journalId} AND user_id = ${userId}
    `;
  } catch (error) {
    console.error("Error updating journal insights:", error);
    throw new Error("Failed to update journal insights");
  }
}

/**
 * Search journal entries by content
 */
export async function searchJournalEntries(
  userId: string,
  searchTerm: string,
  limit: number = 20
): Promise<JournalEntry[]> {
  try {
    const result = await sql`
      SELECT id, user_id, title, content, word_count, ai_insights, created_at, updated_at
      FROM journal_entries
      WHERE user_id = ${userId}
        AND (
          title ILIKE ${`%${searchTerm}%`}
          OR content ILIKE ${`%${searchTerm}%`}
        )
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error("Error searching journal entries:", error);
    throw new Error("Failed to search journal entries");
  }
}

/**
 * Parse journal entry from natural language text
 */
export function parseJournalFromText(text: string): JournalData | null {
  if (text.trim().length < 50) {
    return null;
  }

  const lines = text.split("\n").filter((l) => l.trim());
  const title = lines[0]?.substring(0, 100) || generateTitleFromContent(text);

  return {
    title,
    content: text.trim(),
  };
}

/**
 * Generate a title from journal content
 */
function generateTitleFromContent(content: string): string {
  const firstLine = content.trim().split("\n")[0];
  const truncated = firstLine.substring(0, 60);
  return truncated.length < firstLine.length ? `${truncated}...` : truncated;
}

/**
 * Check if user has journaled today
 */
export async function hasJournaledToday(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE user_id = ${userId}
        AND DATE(created_at) = CURRENT_DATE
    `;

    const count = parseInt((result[0] as any).count as string, 10);
    return count > 0;
  } catch (error) {
    console.error("Error checking today's journal:", error);
    return false;
  }
}

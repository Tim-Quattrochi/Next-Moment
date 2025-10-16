/**
 * Conversation Management Service
 * Handles conversation lifecycle, message persistence, and context building
 */

import { sql } from "../db";
import type {
  Conversation,
  Message,
  RecoveryStage,
  ConversationContext,
} from "../types";
import { getNextStage } from "../flow";

/**
 * Get or create a conversation for a user
 * Returns the most recent active conversation or creates a new one
 */
export async function getOrCreateConversation(
  userId: string
): Promise<Conversation> {
  try {
    const result = await sql`
      SELECT id, user_id, title, stage, created_at, updated_at
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      return result[0] as Conversation;
    }

    return await createConversation(userId, "New Recovery Session");
  } catch (error) {
    console.error("Error getting or creating conversation:", error);
    throw new Error("Failed to initialize conversation");
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title: string = "New Conversation",
  initialStage: RecoveryStage = "greeting"
): Promise<Conversation> {
  try {
    const result = await sql`
      INSERT INTO conversations (user_id, title, stage, created_at, updated_at)
      VALUES (${userId}, ${title}, ${initialStage}, NOW(), NOW())
      RETURNING id, user_id, title, stage, created_at, updated_at
    `;

    return result[0] as Conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
}

/**
 * Get a conversation by ID
 */
export async function getConversationById(
  conversationId: number,
  userId: string
): Promise<Conversation | null> {
  try {
    const result = await sql`
      SELECT id, user_id, title, stage, created_at, updated_at
      FROM conversations
      WHERE id = ${conversationId} AND user_id = ${userId}
    `;

    return (result[0] as Conversation) || null;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw new Error("Failed to fetch conversation");
  }
}

/**
 * List conversations for a user
 */
export async function listConversations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Conversation[]> {
  try {
    const result = await sql`
      SELECT id, user_id, title, stage, created_at, updated_at
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return result as Conversation[];
  } catch (error) {
    console.error("Error listing conversations:", error);
    throw new Error("Failed to list conversations");
  }
}

/**
 * Update conversation stage
 */
export async function updateConversationStage(
  conversationId: number,
  stage: RecoveryStage
): Promise<void> {
  try {
    await sql`
      UPDATE conversations
      SET stage = ${stage}, updated_at = NOW()
      WHERE id = ${conversationId}
    `;
  } catch (error) {
    console.error("Error updating conversation stage:", error);
    throw new Error("Failed to update conversation stage");
  }
}

/**
 * Progress conversation to next stage
 */
export async function progressConversationStage(
  conversationId: number,
  currentStage: RecoveryStage
): Promise<RecoveryStage> {
  const nextStage = getNextStage(currentStage);
  await updateConversationStage(conversationId, nextStage);
  return nextStage;
}

/**
 * Get recent messages for a conversation
 */
export async function getRecentMessages(
  conversationId: number,
  limit: number = 10
): Promise<Message[]> {
  try {
    const result = await sql`
      SELECT id, conversation_id, role, content, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return (result as Message[]).reverse();
  } catch (error) {
    console.error("Error getting recent messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  try {
    const result = await sql`
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (${conversationId}, ${role}, ${content}, NOW())
      RETURNING id, conversation_id, role, content, created_at
    `;

    await sql`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}
    `;

    return result[0] as Message;
  } catch (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
}

/**
 * Build conversation context for AI
 * Aggregates recent messages, check-ins, and milestones
 */
export async function buildConversationContext(
  userId: string,
  conversationId: number,
  currentStage: RecoveryStage
): Promise<ConversationContext> {
  try {
    const [messages, checkIns, milestones, journalCountResult] =
      await Promise.all([
        getRecentMessages(conversationId, 10),
        getRecentCheckIns(userId, 3),
        getActiveMilestones(userId),
        getJournalCount(userId),
      ]);

    return {
      stage: currentStage,
      recentMessages: messages,
      recentCheckIns: checkIns as any,
      activeMilestones: milestones as any,
      journalCount: journalCountResult,
    };
  } catch (error) {
    console.error("Error building conversation context:", error);
    throw new Error("Failed to build conversation context");
  }
}

/**
 * Get recent check-ins for context
 */
async function getRecentCheckIns(userId: string, limit: number = 3) {
  try {
    const result = await sql`
      SELECT id, user_id, mood, sleep_quality, energy_level, intentions, created_at
      FROM check_ins
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error("Error getting recent check-ins:", error);
    return [];
  }
}

/**
 * Get active milestones for context
 */
async function getActiveMilestones(userId: string) {
  try {
    const result = await sql`
      SELECT id, user_id, type, name, description, progress, unlocked, unlocked_at, created_at
      FROM milestones
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return result;
  } catch (error) {
    console.error("Error getting active milestones:", error);
    return [];
  }
}

/**
 * Get journal entry count
 */
async function getJournalCount(userId: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE user_id = ${userId}
    `;

    return parseInt((result[0] as any).count as string, 10);
  } catch (error) {
    console.error("Error getting journal count:", error);
    return 0;
  }
}

/**
 * Update conversation title based on content
 */
export async function updateConversationTitle(
  conversationId: number,
  title: string
): Promise<void> {
  try {
    await sql`
      UPDATE conversations
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${conversationId}
    `;
  } catch (error) {
    console.error("Error updating conversation title:", error);
  }
}

/**
 * Generate a conversation title from recent messages
 */
export function generateConversationTitle(messages: Message[]): string {
  if (messages.length === 0) return "New Conversation";

  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "New Conversation";

  const content = firstUserMessage.content.substring(0, 50);
  return content.length === 50 ? `${content}...` : content;
}

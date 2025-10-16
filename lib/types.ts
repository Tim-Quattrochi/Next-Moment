/**
 * Core type definitions for Recovery Companion application
 */

export type RecoveryStage =
  | "greeting"
  | "check_in"
  | "journal_prompt"
  | "affirmation"
  | "reflection"
  | "milestone_review";

export interface Conversation {
  id: number;
  user_id: string;
  title: string;
  stage: RecoveryStage;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

export interface CheckIn {
  id: number;
  user_id: string;
  mood: string;
  sleep_quality: number;
  energy_level: number;
  intentions: string;
  created_at: Date;
}

export interface JournalEntry {
  id: number;
  user_id: string;
  title: string | null;
  content: string;
  word_count: number;
  ai_insights: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface Milestone {
  id: number;
  user_id: string;
  type: string;
  name: string;
  description: string | null;
  progress: number;
  unlocked: boolean;
  unlocked_at: Date | null;
  created_at: Date;
}

export interface CheckInData {
  mood: string;
  sleepQuality: number;
  energyLevel: number;
  intentions: string;
}

export interface JournalData {
  title?: string;
  content: string;
}

export interface MilestoneData {
  type: string;
  name: string;
  description?: string;
  progress?: number;
}

export interface ConversationContext {
  stage: RecoveryStage;
  recentMessages: Message[];
  recentCheckIns: CheckIn[];
  activeMilestones: Milestone[];
  journalCount: number;
}

export interface SuggestedReply {
  text: string;
  type?: "quick" | "detailed";
}

export interface StageTransition {
  from: RecoveryStage;
  to: RecoveryStage;
  trigger: "completed" | "user_request" | "automatic";
  metadata?: Record<string, unknown>;
}

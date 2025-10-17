/**
 * Stage UI Configuration
 * Centralized mapping of conversation stages to UI elements
 */

import type { RecoveryStage } from "./types"
import { Calendar, BookOpen, Sprout, Sparkles, Heart, TrendingUp } from "lucide-react"

export interface StageConfig {
  name: string
  color: string
  subtitle: string
  icon: typeof Sparkles
  gradient: string
  description: string
}

export const STAGE_CONFIG: Record<RecoveryStage, StageConfig> = {
  greeting: {
    name: "Welcome",
    color: "#3B82F6",
    subtitle: "Let's start your day together",
    icon: Sparkles,
    gradient: "from-blue-500 to-blue-600",
    description: "Starting your recovery journey for today",
  },
  check_in: {
    name: "Check-In",
    color: "#14B8A6",
    subtitle: "How are you feeling today?",
    icon: Calendar,
    gradient: "from-teal-500 to-teal-600",
    description: "Gathering your daily wellness insights",
  },
  journal_prompt: {
    name: "Journal",
    color: "#F59E0B",
    subtitle: "Time to reflect on your journey",
    icon: BookOpen,
    gradient: "from-amber-500 to-amber-600",
    description: "Reflecting on your experiences",
  },
  affirmation: {
    name: "Affirmation",
    color: "#10B981",
    subtitle: "Celebrating your progress",
    icon: Heart,
    gradient: "from-emerald-500 to-emerald-600",
    description: "Recognizing your strength",
  },
  reflection: {
    name: "Reflection",
    color: "#8B5CF6",
    subtitle: "Looking at how far you've come",
    icon: TrendingUp,
    gradient: "from-violet-500 to-violet-600",
    description: "Exploring your growth",
  },
  milestone_review: {
    name: "Milestones",
    color: "#F43F5E",
    subtitle: "Your achievements matter",
    icon: Sprout,
    gradient: "from-rose-500 to-rose-600",
    description: "Celebrating your accomplishments",
  },
}

/**
 * Get stage configuration by stage key
 */
export function getStageConfig(stage: RecoveryStage): StageConfig {
  return STAGE_CONFIG[stage]
}

/**
 * Get all stages in order
 */
export const STAGE_ORDER: RecoveryStage[] = [
  "greeting",
  "check_in",
  "journal_prompt",
  "affirmation",
  "reflection",
  "milestone_review",
]

/**
 * Get stage index (0-based)
 */
export function getStageIndex(stage: RecoveryStage): number {
  return STAGE_ORDER.indexOf(stage)
}

/**
 * Get stage progress percentage
 */
export function getStageProgress(stage: RecoveryStage): number {
  const index = getStageIndex(stage)
  return Math.round(((index + 1) / STAGE_ORDER.length) * 100)
}

/**
 * Check if a navigation icon should be active for the current stage
 */
export function isIconActiveForStage(
  iconType: "check-in" | "journal" | "garden",
  currentStage: RecoveryStage
): boolean {
  switch (iconType) {
    case "check-in":
      return currentStage === "check_in"
    case "journal":
      return currentStage === "journal_prompt"
    case "garden":
      return currentStage === "milestone_review"
    default:
      return false
  }
}

/**
 * Get suggested reply icon based on text content
 */
export function getSuggestedReplyIcon(text: string): string {
  const lowerText = text.toLowerCase()

  if (lowerText.includes("feeling") || lowerText.includes("mood")) return "😌"
  if (lowerText.includes("sleep")) return "💤"
  if (lowerText.includes("energy")) return "⚡"
  if (lowerText.includes("intention") || lowerText.includes("goal") || lowerText.includes("focus")) return "🎯"
  if (lowerText.includes("journal") || lowerText.includes("reflect")) return "✍️"
  if (lowerText.includes("grateful") || lowerText.includes("appreciate")) return "🙏"
  if (lowerText.includes("progress") || lowerText.includes("milestone")) return "🌱"
  if (lowerText.includes("thank")) return "💚"

  return ""
}

/**
 * Get suggested reply color based on type and content
 */
export function getSuggestedReplyColor(
  text: string,
  type: "quick" | "detailed" = "quick"
): string {
  const lowerText = text.toLowerCase()

  if (lowerText.includes("yes") || lowerText.includes("ready") || lowerText.includes("let's")) {
    return "border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-500"
  }

  if (lowerText.includes("tell me more") || lowerText.includes("learn") || lowerText.includes("how")) {
    return "border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500"
  }

  if (lowerText.includes("grateful") || lowerText.includes("thank") || lowerText.includes("appreciate")) {
    return "border-violet-500/50 hover:bg-violet-500/10 hover:border-violet-500"
  }

  if (lowerText.includes("skip") || lowerText.includes("not now") || lowerText.includes("later")) {
    return "border-gray-500/50 hover:bg-gray-500/10 hover:border-gray-500"
  }

  return "border-border/50 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]"
}

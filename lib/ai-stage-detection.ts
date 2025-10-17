/**
 * AI-Powered Stage Detection and Data Extraction
 * Uses AI structured outputs to determine stage completion and extract data
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import type { RecoveryStage, Message } from "./types"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
})

/**
 * Stage completion criteria definitions
 */
const STAGE_CRITERIA = {
  greeting: {
    description: "User has been welcomed and is ready to proceed",
    minMessages: 1,
    criteria: ["User acknowledged the greeting or expressed readiness to start"],
  },
  check_in: {
    description: "Daily wellness check-in data has been gathered",
    minMessages: 2,
    criteria: [
      "User shared their current mood/emotional state",
      "User mentioned their sleep quality (can be numeric or descriptive)",
      "User mentioned their energy level (can be numeric or descriptive)",
      "User shared their intentions/goals for the day",
    ],
  },
  journal_prompt: {
    description: "User has been prompted to journal and responded",
    minMessages: 2,
    criteria: [
      "User explicitly agreed to journal",
      "User shared a reflective thought or declined journaling",
    ],
  },
  affirmation: {
    description: "Affirmation has been delivered and acknowledged",
    minMessages: 1,
    criteria: [
      "User acknowledged the affirmation (directly or implicitly)",
      "User engaged with the affirmation message",
    ],
  },
  reflection: {
    description: "User has reflected on their growth and progress",
    minMessages: 2,
    criteria: [
      "User shared thoughts about positive changes or growth",
      "User discussed habits, perspective shifts, or self-awareness",
      "User expressed readiness to move forward",
    ],
  },
  milestone_review: {
    description: "User has reviewed progress and milestones",
    minMessages: 2,
    criteria: [
      "User discussed their achievements or milestones",
      "User expressed interest in setting new goals or continuing",
      "User is ready for the next check-in",
    ],
  },
} as const

/**
 * Schema for stage completion detection
 */
const StageCompletionSchema = z.object({
  currentStage: z.string(),
  criteriaMetList: z.array(z.string()).describe("List of criteria that were met from the conversation"),
  requiredCriteria: z.number().describe("Number of criteria required for this stage"),
  criteriaMet: z.number().describe("Number of criteria actually met"),
  shouldTransition: z.boolean().describe("Whether the stage should transition to the next one"),
  reasoning: z.string().describe("Brief explanation of why transition should or should not occur"),
})

/**
 * Schema for check-in data extraction
 */
const CheckInDataSchema = z.object({
  mood: z.string().nullable().describe("User's emotional state (e.g., calm, anxious, happy, motivated)"),
  sleepQuality: z.number().min(1).max(5).nullable().describe("Sleep quality on a scale of 1-5"),
  energyLevel: z.number().min(1).max(5).nullable().describe("Energy level on a scale of 1-5"),
  intentions: z.string().nullable().describe("User's intentions or goals for the day"),
  hasAllRequiredData: z.boolean().describe("Whether all required check-in data was provided"),
  confidence: z.number().min(0).max(100).describe("Confidence level in the extraction (0-100)"),
})

/**
 * Schema for journal data extraction
 */
const JournalDataSchema = z.object({
  hasJournalContent: z.boolean().describe("Whether the user shared journal-worthy content"),
  title: z.string().nullable().describe("Generated title for the journal entry"),
  content: z.string().nullable().describe("The journal content from the user"),
  wordCount: z.number().describe("Approximate word count of the journal content"),
  isReflective: z.boolean().describe("Whether the content is reflective/introspective"),
  confidence: z.number().min(0).max(100).describe("Confidence level in the extraction (0-100)"),
})

/**
 * Determine if a stage should transition using AI
 */
export async function shouldTransitionStageAI(
  stage: RecoveryStage,
  recentMessages: Message[],
  messageCount: number
): Promise<{ shouldTransition: boolean; reasoning: string }> {
  try {
    const stageCriteria = STAGE_CRITERIA[stage]

    // Check minimum message count first
    if (messageCount < stageCriteria.minMessages) {
      return {
        shouldTransition: false,
        reasoning: `Need at least ${stageCriteria.minMessages} messages in this stage (currently ${messageCount})`,
      }
    }

    // Build conversation context
    const conversationText = recentMessages
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n")

    const prompt = `You are analyzing a recovery companion conversation to determine if the current stage is complete.

Current Stage: ${stage}
Stage Description: ${stageCriteria.description}

Criteria for completion (at least 2 out of ${stageCriteria.criteria.length} should be met for check_in, otherwise most criteria should be met):
${stageCriteria.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Recent Conversation:
${conversationText}

Analyze the conversation and determine:
1. Which criteria have been met (be flexible with natural language variations)
2. Whether enough criteria are met to transition to the next stage
3. Provide reasoning for your decision

For check_in stage: Require at least 2 out of 4 criteria (mood, sleep, energy, intentions)
For other stages: Require most criteria to be met, but be flexible with natural conversation flow
`

    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: StageCompletionSchema,
      prompt,
      temperature: 0.1, // Low temperature for consistent decisions
    })

    console.log(`[AI STAGE DETECTION] Stage: ${stage}, Should Transition: ${result.object.shouldTransition}, Reasoning: ${result.object.reasoning}`)

    return {
      shouldTransition: result.object.shouldTransition,
      reasoning: result.object.reasoning,
    }
  } catch (error) {
    console.error("[AI STAGE DETECTION ERROR]", error)
    // Fallback: don't transition on error
    return {
      shouldTransition: false,
      reasoning: "Error during AI stage detection, keeping current stage",
    }
  }
}

/**
 * Extract check-in data from conversation using AI
 */
export async function extractCheckInDataAI(
  recentMessages: Message[]
): Promise<{
  mood: string
  sleepQuality: number
  energyLevel: number
  intentions: string
} | null> {
  try {
    const conversationText = recentMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n")

    const prompt = `Extract daily check-in data from this conversation. Be flexible with natural language and infer values when reasonable.

For sleep quality and energy level, if the user provides descriptive text (e.g., "slept well", "feeling energized"), convert to a 1-5 scale:
- Very poor/terrible/awful: 1
- Poor/bad/not great: 2
- Okay/fine/decent/alright: 3
- Good/well/pretty good: 4
- Great/excellent/amazing/perfect: 5

Conversation:
${conversationText}

Extract:
- mood: emotional state (e.g., calm, happy, anxious, motivated, tired)
- sleepQuality: 1-5 scale
- energyLevel: 1-5 scale
- intentions: goals/intentions for the day

Return null for any field that is not clearly mentioned. Only set hasAllRequiredData to true if at least mood, sleepQuality, and energyLevel are present.`

    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: CheckInDataSchema,
      prompt,
      temperature: 0.1,
    })

    console.log(`[AI CHECK-IN EXTRACTION] Confidence: ${result.object.confidence}%, Has All Data: ${result.object.hasAllRequiredData}`)

    // Only return data if we have high confidence and all required fields
    if (
      result.object.hasAllRequiredData &&
      result.object.confidence >= 70 &&
      result.object.mood &&
      result.object.sleepQuality &&
      result.object.energyLevel
    ) {
      return {
        mood: result.object.mood,
        sleepQuality: result.object.sleepQuality,
        energyLevel: result.object.energyLevel,
        intentions: result.object.intentions || "No specific intentions set",
      }
    }

    return null
  } catch (error) {
    console.error("[AI CHECK-IN EXTRACTION ERROR]", error)
    return null
  }
}

/**
 * Extract journal data from conversation using AI
 */
export async function extractJournalDataAI(
  recentMessages: Message[]
): Promise<{ title: string; content: string } | null> {
  try {
    const userMessages = recentMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n\n")

    const prompt = `Analyze this conversation to extract journal-worthy content.

Conversation:
${userMessages}

Determine:
1. Whether the user shared reflective, journal-worthy content (at least 50 characters)
2. If yes, extract the journal content and generate a concise title (max 60 characters)
3. Count the approximate words in the journal content
4. Assess if the content is reflective/introspective

Journal content should be:
- Personal reflections, thoughts, or feelings
- Gratitude expressions
- Progress observations
- Challenges or learnings
- At least 50 characters long

Do NOT extract if:
- User declined to journal
- Content is too short or not reflective
- Content is just casual conversation`

    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: JournalDataSchema,
      prompt,
      temperature: 0.2,
    })

    console.log(`[AI JOURNAL EXTRACTION] Has Content: ${result.object.hasJournalContent}, Confidence: ${result.object.confidence}%`)

    // Only return journal data if we have high confidence and reflective content
    if (
      result.object.hasJournalContent &&
      result.object.isReflective &&
      result.object.confidence >= 70 &&
      result.object.content &&
      result.object.wordCount >= 10 &&
      result.object.content.length >= 50
    ) {
      return {
        title: result.object.title || "Journal Entry",
        content: result.object.content,
      }
    }

    return null
  } catch (error) {
    console.error("[AI JOURNAL EXTRACTION ERROR]", error)
    return null
  }
}

/**
 * Get stage completion criteria description for display
 */
export function getStageCompletionCriteria(stage: RecoveryStage): string[] {
  return STAGE_CRITERIA[stage].criteria
}

/**
 * Get minimum message count required for a stage
 */
export function getStageMinMessages(stage: RecoveryStage): number {
  return STAGE_CRITERIA[stage].minMessages
}

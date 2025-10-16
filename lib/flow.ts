/**
 * Recovery Conversation Flow Orchestration
 * Manages the guided conversation stages and system prompts
 */

import type { RecoveryStage, ConversationContext, SuggestedReply } from "./types";

export type { RecoveryStage };

const STAGE_PROGRESSION: Record<RecoveryStage, RecoveryStage> = {
  greeting: "check_in",
  check_in: "journal_prompt",
  journal_prompt: "affirmation",
  affirmation: "reflection",
  reflection: "milestone_review",
  milestone_review: "check_in",
};

const BASE_SYSTEM_PROMPT = `You are a warm, empathetic recovery companion AI. Your role is to support users on their recovery journey with compassion, encouragement, and practical guidance.

Core Principles:
- Be supportive, non-judgmental, and empathetic
- Focus on progress, not perfection
- Celebrate small wins and acknowledge challenges
- Never provide medical advice or clinical diagnoses
- If the user expresses crisis or self-harm thoughts, encourage them to reach out to professional help (988 Suicide & Crisis Lifeline)
- Use a conversational, friend-like tone while maintaining professionalism
- Ask open-ended questions to encourage reflection
- Validate feelings and experiences

Remember: You are a supportive companion, not a therapist. Your goal is to help users reflect, track progress, and stay motivated in their recovery journey.`;

/**
 * Get the system prompt for a specific conversation stage
 */
export function getSystemPromptForStage(
  stage: RecoveryStage,
  context: ConversationContext
): string {
  const stagePrompt = getStageSpecificPrompt(stage, context);
  return `${BASE_SYSTEM_PROMPT}

---

Current Stage: ${stage.toUpperCase().replace("_", " ")}

${stagePrompt}

${getContextualInformation(context)}`;
}

/**
 * Get stage-specific instructions
 */
function getStageSpecificPrompt(
  stage: RecoveryStage,
  context: ConversationContext
): string {
  switch (stage) {
    case "greeting":
      return `Stage Objective: Welcome & Introduction

Welcome the user warmly to their recovery companion. This is the start of their conversation.

Focus on:
- Introducing yourself as their recovery companion
- Creating a safe, non-judgmental space
- Expressing genuine interest in supporting them
- Setting a positive, hopeful tone

Keep the greeting brief but warm. Let them know you're here to support their recovery journey through check-ins, journaling, reflections, and celebrating their progress.

${
  context.recentCheckIns.length > 0 || context.journalCount > 0
    ? "Note: This user has used the app before—acknowledge their return!"
    : "This appears to be a new user. Welcome them and briefly explain how you can help."
}

After the greeting, naturally ask if they'd like to do a quick check-in to see how they're doing today.`;

    case "check_in":
      return `Stage Objective: Daily Check-In

Ask the user how they're doing today. Gather information about:
- Their current mood (e.g., happy, anxious, calm, frustrated)
- Sleep quality (scale 1-5)
- Energy level (scale 1-5)
- Daily intentions or goals

Be conversational and natural. Don't ask all questions at once—let the conversation flow organically.

When you have gathered clear responses for mood, sleep, energy, and intentions, naturally wrap up the check-in and transition to encouraging them to reflect more deeply through journaling.

${
  context.recentCheckIns.length > 0
    ? `Note: The user completed their last check-in on ${new Date(
        context.recentCheckIns[0].created_at
      ).toLocaleDateString()}.`
    : "This appears to be a new check-in session."
}`;

    case "journal_prompt":
      return `Stage Objective: Encourage Journaling

Encourage the user to journal about their recovery experience. Suggest prompts such as:
- What are you grateful for today?
- What progress have you made recently, no matter how small?
- What challenges are you facing, and how might you approach them?
- What have you learned about yourself lately?

Be encouraging and supportive. Let them know that journaling helps process emotions and track growth.

${
  context.journalCount > 0
    ? `The user has written ${context.journalCount} journal entries so far. Acknowledge their consistency!`
    : "This might be their first journal entry. Encourage them to start!"
}

Once they express interest in journaling or share a reflection, guide them to use the journal feature in the app.`;

    case "affirmation":
      return `Stage Objective: Provide Affirmation

Offer a personalized, meaningful affirmation based on the conversation and the user's recent progress.

Focus on:
- Their resilience and strength
- Progress they've made (even small steps)
- Their commitment to recovery
- Hope and possibility

Keep it genuine, specific, and uplifting. Avoid generic platitudes—make it personal to their journey.

After delivering the affirmation, gently transition to encouraging them to reflect on their growth.`;

    case "reflection":
      return `Stage Objective: Guide Reflection

Help the user reflect on their recovery journey. Ask thoughtful questions like:
- What positive changes have you noticed in yourself?
- What habits or practices have been most helpful?
- How has your perspective shifted over time?
- What are you learning to appreciate about yourself?

Listen actively and validate their reflections. Help them recognize patterns of growth and resilience.

${
  context.recentCheckIns.length > 2
    ? "Note: They've been consistent with check-ins—acknowledge this positive habit!"
    : ""
}

After meaningful reflection, transition toward reviewing their milestones and celebrating progress.`;

    case "milestone_review":
      return `Stage Objective: Review Milestones and Celebrate Progress

Review the user's milestones and celebrate their achievements.

${
  context.activeMilestones.length > 0
    ? `Current Milestones:
${context.activeMilestones
  .map(
    (m) =>
      `- ${m.name}: ${m.progress}% complete${m.unlocked ? " ✓ UNLOCKED" : ""}`
  )
  .join("\n")}

Celebrate unlocked milestones and encourage progress on active ones.`
    : "The user doesn't have active milestones yet. Encourage them to set recovery goals they can track."
}

Discuss:
- What milestones they're proud of
- What new goals they might want to set
- How tracking progress helps them stay motivated

After celebrating achievements, naturally transition back to asking how they're doing, completing the cycle.`;

    default:
      return "Engage in open, supportive conversation about their recovery journey.";
  }
}

/**
 * Build contextual information from conversation history
 */
function getContextualInformation(context: ConversationContext): string {
  const parts: string[] = [];

  if (context.recentMessages.length > 0) {
    parts.push(`Recent conversation context is available (${context.recentMessages.length} recent messages).`);
  }

  if (context.recentCheckIns.length > 0) {
    const lastCheckIn = context.recentCheckIns[0];
    parts.push(
      `Last check-in: Mood was "${lastCheckIn.mood}", sleep ${lastCheckIn.sleep_quality}/5, energy ${lastCheckIn.energy_level}/5.`
    );
  }

  if (context.journalCount > 0) {
    parts.push(`The user has ${context.journalCount} journal entries.`);
  }

  if (context.activeMilestones.filter((m) => m.unlocked).length > 0) {
    parts.push(
      `Unlocked milestones: ${context.activeMilestones
        .filter((m) => m.unlocked)
        .map((m) => m.name)
        .join(", ")}`
    );
  }

  return parts.length > 0
    ? `\n---\n\nContextual Information:\n${parts.join("\n")}`
    : "";
}

/**
 * Determine the next stage in the conversation flow
 */
export function getNextStage(currentStage: RecoveryStage): RecoveryStage {
  return STAGE_PROGRESSION[currentStage];
}

/**
 * Check if a stage transition should occur based on conversation analysis
 * This is a simple heuristic-based approach. In production, you might use
 * AI function calling or structured output to detect stage completion.
 */
export function shouldTransitionStage(
  stage: RecoveryStage,
  messageCount: number,
  lastMessage: string
): boolean {
  const lowerMessage = lastMessage.toLowerCase();

  switch (stage) {
    case "greeting":
      return messageCount >= 1;

    case "check_in":
      return (
        messageCount >= 3 &&
        (lowerMessage.includes("feeling") ||
          lowerMessage.includes("sleep") ||
          lowerMessage.includes("energy") ||
          lowerMessage.includes("intention"))
      );

    case "journal_prompt":
      return (
        messageCount >= 2 &&
        (lowerMessage.includes("journal") ||
          lowerMessage.includes("write") ||
          lowerMessage.includes("grateful") ||
          lowerMessage.includes("reflect"))
      );

    case "affirmation":
      return messageCount >= 1;

    case "reflection":
      return (
        messageCount >= 2 &&
        (lowerMessage.includes("growth") ||
          lowerMessage.includes("change") ||
          lowerMessage.includes("learn") ||
          lowerMessage.includes("progress"))
      );

    case "milestone_review":
      return (
        messageCount >= 2 &&
        (lowerMessage.includes("milestone") ||
          lowerMessage.includes("goal") ||
          lowerMessage.includes("achievement"))
      );

    default:
      return false;
  }
}

/**
 * Parse check-in data from conversation
 * Returns null if insufficient data is present
 */
export function parseCheckInFromMessage(
  message: string
): { mood: string; sleepQuality: number; energyLevel: number; intentions: string } | null {
  const lowerMessage = message.toLowerCase();

  const moodMatch = lowerMessage.match(
    /(?:mood|feeling|feel)[\s:]+([a-z]+)/i
  );
  const sleepMatch = lowerMessage.match(/sleep[\s:]+(\d)/);
  const energyMatch = lowerMessage.match(/energy[\s:]+(\d)/);
  const intentionsMatch = lowerMessage.match(
    /(?:intention|goal|plan)[\s:]+(.+?)(?:\.|$)/i
  );

  if (moodMatch && sleepMatch && energyMatch) {
    return {
      mood: moodMatch[1],
      sleepQuality: parseInt(sleepMatch[1], 10),
      energyLevel: parseInt(energyMatch[1], 10),
      intentions: intentionsMatch?.[1] || "No specific intentions set",
    };
  }

  return null;
}

/**
 * Parse journal content from conversation
 */
export function parseJournalFromMessage(message: string): {
  title: string;
  content: string;
} | null {
  if (message.length < 50) {
    return null;
  }

  const lines = message.split("\n").filter((l) => l.trim());
  const title = lines[0]?.substring(0, 100) || "Journal Entry";
  const content = message;

  return { title, content };
}

/**
 * Get suggested replies for the current stage
 * Provides contextual quick responses to guide the user
 */
export function getSuggestedRepliesForStage(
  stage: RecoveryStage,
  context: ConversationContext
): SuggestedReply[] {
  switch (stage) {
    case "greeting":
      return [
        { text: "Yes, let's check in", type: "quick" },
        { text: "Tell me more about how this works", type: "detailed" },
        { text: "I'm ready to start", type: "quick" },
      ];

    case "check_in":
      return [
        { text: "I'm feeling calm today", type: "quick" },
        { text: "I slept well, about 4/5", type: "quick" },
        { text: "My energy level is 3/5", type: "quick" },
        { text: "I want to stay focused and positive today", type: "detailed" },
      ];

    case "journal_prompt":
      return [
        { text: "I'd like to journal about today", type: "quick" },
        { text: "I'm grateful for my progress", type: "detailed" },
        { text: "Let me reflect on my challenges", type: "detailed" },
        { text: "Skip journaling for now", type: "quick" },
      ];

    case "affirmation":
      return [
        { text: "Thank you, that means a lot", type: "quick" },
        { text: "I needed to hear that", type: "quick" },
        { text: "Tell me more", type: "detailed" },
      ];

    case "reflection":
      return [
        { text: "I've noticed positive changes", type: "detailed" },
        { text: "My habits are improving", type: "quick" },
        { text: "I'm learning to appreciate myself more", type: "detailed" },
        { text: "Let's move on", type: "quick" },
      ];

    case "milestone_review":
      if (context.activeMilestones.length > 0) {
        return [
          { text: "Show me my progress", type: "quick" },
          { text: "I'm proud of what I've achieved", type: "detailed" },
          { text: "What should I work on next?", type: "detailed" },
          { text: "Let's set a new goal", type: "quick" },
        ];
      }
      return [
        { text: "Help me set my first goal", type: "quick" },
        { text: "What milestones can I track?", type: "detailed" },
        { text: "I'm ready to start tracking progress", type: "detailed" },
      ];

    default:
      return [
        { text: "Continue", type: "quick" },
        { text: "Tell me more", type: "detailed" },
      ];
  }
}

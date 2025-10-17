# AI-Powered Stage Detection and Data Extraction

## Overview

The Recovery Companion now uses **AI-powered stage detection** instead of regex-based keyword matching to determine when conversations should progress through stages. This provides a more natural, flexible conversation flow that understands user intent rather than requiring exact keyword matches.

## Why AI-Based Detection?

### Problems with Regex-Based Approach

The previous regex-based system had several critical issues:

1. **Too Strict**: Required exact keyword matches that users rarely provided naturally
2. **Inflexible**: Couldn't understand variations in natural language
3. **Data Inconsistency**: Parsing logic didn't match transition logic
4. **User Frustration**: Users got stuck in stages indefinitely

### Benefits of AI-Based Approach

1. **Natural Language Understanding**: Understands intent, not just keywords
2. **Flexible Matching**: Recognizes variations like "I feel good" vs "feeling good" vs "I'm good"
3. **Unified Logic**: Same AI model handles both transition detection AND data extraction
4. **Better UX**: Users progress naturally through stages without getting stuck

## Architecture

### Core Components

#### 1. Stage Completion Detection (`shouldTransitionStageAI`)

Uses AI structured output to analyze the conversation and determine if stage criteria are met:

```typescript
const result = await generateObject({
  model: google("gemini-2.0-flash-exp"),
  schema: StageCompletionSchema,
  prompt: `Analyze if stage completion criteria are met...`,
  temperature: 0.1, // Low temperature for consistent decisions
})
```

**Returns:**
- `shouldTransition: boolean` - Whether to move to next stage
- `reasoning: string` - Explanation of the decision

#### 2. Check-In Data Extraction (`extractCheckInDataAI`)

Extracts wellness data from natural conversation:

```typescript
const result = await generateObject({
  model: google("gemini-2.0-flash-exp"),
  schema: CheckInDataSchema,
  prompt: `Extract check-in data (mood, sleep, energy, intentions)...`,
  temperature: 0.1,
})
```

**Extracts:**
- `mood`: Emotional state (e.g., "calm", "anxious", "motivated")
- `sleepQuality`: 1-5 scale (converts descriptive text to numbers)
- `energyLevel`: 1-5 scale (converts descriptive text to numbers)
- `intentions`: Daily goals/intentions

**Conversion Examples:**
- "slept well" → `sleepQuality: 4`
- "didn't sleep great" → `sleepQuality: 2`
- "feeling energized" → `energyLevel: 5`
- "pretty tired" → `energyLevel: 2`

#### 3. Journal Data Extraction (`extractJournalDataAI`)

Identifies and extracts reflective journal content:

```typescript
const result = await generateObject({
  model: google("gemini-2.0-flash-exp"),
  schema: JournalDataSchema,
  prompt: `Extract journal-worthy reflective content...`,
  temperature: 0.2,
})
```

**Extracts:**
- `title`: Auto-generated title (max 60 chars)
- `content`: The reflective journal text
- `isReflective`: Whether content is introspective
- `wordCount`: Approximate word count

## Stage Completion Criteria

### Greeting Stage
- **Min Messages**: 1
- **Criteria**: User acknowledged greeting or expressed readiness
- **Example**: User says "Yes, let's start" or "I'm ready"

### Check-In Stage
- **Min Messages**: 2
- **Criteria** (need 2+ out of 4):
  1. User shared their mood/emotional state
  2. User mentioned sleep quality
  3. User mentioned energy level
  4. User shared intentions/goals

**Example Conversation:**
```
AI: How are you feeling today?
User: I'm feeling pretty calm, had a decent night
AI: That's great! How would you rate your sleep and energy?
User: Sleep was about a 3, but energy is good, maybe a 4
✅ TRANSITION: Has mood, sleep, energy (3/4 criteria met)
```

### Journal Prompt Stage
- **Min Messages**: 2
- **Criteria**:
  - User explicitly agreed to journal, OR
  - User shared reflective thought, OR
  - User declined journaling

**Example Conversation:**
```
AI: Would you like to journal about your progress?
User: Yes, I'd like to reflect on how far I've come
✅ TRANSITION: User agreed to journal
```

### Affirmation Stage
- **Min Messages**: 1
- **Criteria**: User acknowledged the affirmation
- **Note**: Can be implicit acknowledgment

**Example Conversation:**
```
AI: You're making incredible progress. Your consistency is inspiring.
User: Thank you, that means a lot
✅ TRANSITION: User acknowledged affirmation
```

### Reflection Stage
- **Min Messages**: 2
- **Criteria** (need 1+ of):
  - User shared thoughts about positive changes
  - User discussed habits/perspective shifts
  - User expressed readiness to move forward

**Example Conversation:**
```
AI: What positive changes have you noticed?
User: I've noticed I'm more patient with myself now
AI: That's wonderful growth. Anything else?
User: Yes, I appreciate the small wins more. What's next?
✅ TRANSITION: Shared reflection + ready signal
```

### Milestone Review Stage
- **Min Messages**: 2
- **Criteria** (need 1+ of):
  - User discussed achievements/milestones
  - User wants to set new goals
  - User ready for next check-in

**Example Conversation:**
```
AI: Let's review your progress!
User: I'm proud of my 7-day streak
AI: That's amazing! Ready for another check-in?
User: Yes, let's do it
✅ TRANSITION: Loop back to check_in stage
```

## Implementation Details

### File Structure

```
lib/
├── ai-stage-detection.ts       # AI-based detection & extraction
├── flow.ts                      # Stage prompts & suggested replies
└── services/
    ├── conversation.ts          # Context building
    ├── check-in.ts              # Check-in persistence
    └── journal.ts               # Journal persistence

app/api/chat/
└── route.ts                     # Chat orchestration (uses AI detection)
```

### API Flow

1. **User sends message** → Saved to database
2. **AI generates response** → Streamed to client
3. **On finish callback**:
   - Build fresh context with all saved messages
   - **AI extracts data** (check-in or journal if applicable)
   - **AI determines if stage should transition**
   - Update stage if needed
   - Rebuild context with new stage
   - Generate suggested replies

### Logging

The system logs detailed information for debugging:

```typescript
// Stage transition attempts
[STAGE TRANSITION CHECK] Stage: check_in, Should Transition: true, Reasoning: User provided mood, sleep, and energy data
[STAGE TRANSITIONED] check_in → journal_prompt

// Data extraction
[CHECK-IN CREATED] User: user_123, Mood: calm, Sleep: 4/5, Energy: 3/5
[JOURNAL CREATED] User: user_123, Title: "Reflecting on my progress", Length: 245 chars

// AI detection
[AI STAGE DETECTION] Stage: check_in, Should Transition: true, Reasoning: User met 3/4 criteria
[AI CHECK-IN EXTRACTION] Confidence: 95%, Has All Data: true
[AI JOURNAL EXTRACTION] Has Content: true, Confidence: 88%
```

## Confidence Thresholds

The system uses confidence thresholds to ensure data quality:

- **Check-In Extraction**: Requires ≥70% confidence AND all required fields
- **Journal Extraction**: Requires ≥70% confidence AND reflective content
- **Stage Transition**: Uses low temperature (0.1) for consistent decisions

## Error Handling

### Graceful Degradation

If AI detection fails:
- **Stage Transition**: Defaults to NOT transitioning (keeps current stage)
- **Data Extraction**: Returns `null` (no record created)
- **Logs Error**: For monitoring and debugging
- **Conversation Continues**: User experience not interrupted

### Fallback Strategy

```typescript
try {
  const result = await shouldTransitionStageAI(...)
  return result
} catch (error) {
  console.error("[AI STAGE DETECTION ERROR]", error)
  return {
    shouldTransition: false,
    reasoning: "Error during AI stage detection, keeping current stage"
  }
}
```

## Configuration

### Model Selection

Currently uses `gemini-2.0-flash-exp` for:
- Fast inference (<1 second)
- Structured output support (Zod schemas)
- Good natural language understanding
- Cost-effective

### Temperature Settings

- **Stage Detection**: 0.1 (very consistent, deterministic)
- **Data Extraction**: 0.1 (accurate, reliable)
- **Journal Extraction**: 0.2 (slightly more creative for titles)

## Testing Guide

### Test Scenarios

#### Test 1: Natural Check-In
```
User: "Hey, I'm feeling really good today. Had a solid night's sleep, probably like a 4 out of 5. Energy is high, maybe a 4 too. Want to stay focused on my goals."

Expected:
✅ Extracts: mood="good", sleep=4, energy=4, intentions="stay focused on my goals"
✅ Stage transitions: check_in → journal_prompt
```

#### Test 2: Informal Check-In
```
User: "Doing alright, slept okay"
AI: "How's your energy?"
User: "Pretty good, feeling motivated today"

Expected:
✅ Extracts: mood="alright", sleep=3, energy=4, intentions="No specific intentions"
✅ Stage transitions: check_in → journal_prompt (2/4 criteria met)
```

#### Test 3: Journal Declination
```
AI: "Would you like to journal?"
User: "Not right now, maybe later"

Expected:
✅ No journal created
✅ Stage transitions: journal_prompt → affirmation
```

#### Test 4: Stuck Prevention
If user has natural conversation but doesn't meet criteria after 5+ messages:
- AI should still detect engagement and transition
- Prevents users from getting indefinitely stuck

### Monitoring Metrics

Track these in production:

1. **Transition Success Rate**: % of stages that transition within expected message count
2. **Average Messages Per Stage**: Should be 2-4 for most stages
3. **Extraction Success Rate**: % of check-ins/journals successfully extracted
4. **Confidence Scores**: Average AI confidence for each extraction type
5. **Error Rate**: % of AI detection calls that fail

## Migration from Regex

### What Changed

**Before (Regex):**
```typescript
const hasMood = message.match(/(?:i'm feeling|feeling|mood)\s+(?:calm|happy|anxious)/i)
const hasSleep = message.match(/sleep[\s:]+(\d)/i)
// Required EXACT keyword matches
```

**After (AI):**
```typescript
const result = await extractCheckInDataAI(messages)
// Understands: "feeling good", "I'm good", "pretty calm", "doing well"
// Converts: "slept great" → 5, "didn't sleep well" → 2
```

### Backward Compatibility

- Old regex functions (`shouldTransitionStage`, `parseCheckInFromText`, etc.) remain in codebase
- Not imported or used in production code
- Can be used as fallback if needed
- May be removed in future versions

## Performance Considerations

### Latency

- **AI Detection**: ~200-500ms per call
- **Total Overhead**: ~500-1000ms per message (2 AI calls: detection + extraction)
- **User Impact**: Minimal (happens after response is streamed)

### Cost

Using Gemini 2.0 Flash:
- **Input**: ~500 tokens per detection (conversation context)
- **Output**: ~100 tokens per detection (structured output)
- **Cost**: ~$0.0003 per message (very low)

### Optimization Tips

1. **Limit Context Window**: Only include last 10 messages (currently implemented)
2. **Cache Model**: Reuse model instance across requests (implemented)
3. **Parallel Extraction**: Run detection and extraction in parallel when possible
4. **Batch Processing**: Consider batching multiple users' detections

## Future Enhancements

### Planned Improvements

1. **Multi-Turn Data Collection**: Track partial data across multiple messages
2. **Proactive Prompting**: AI suggests when to move to next stage
3. **Personalized Criteria**: Adapt stage requirements per user
4. **Sentiment Analysis**: Track emotional trajectory across stages
5. **A/B Testing**: Compare AI vs regex performance metrics

### Advanced Features

1. **Crisis Detection**: AI identifies distress signals and offers resources
2. **Goal Tracking**: Extract and track specific recovery goals
3. **Pattern Recognition**: Identify recurring themes in journals
4. **Adaptive Difficulty**: Adjust stage complexity based on user engagement

## Troubleshooting

### Common Issues

#### Issue: Stage Not Transitioning
**Symptoms**: User stuck in stage after many messages
**Diagnosis**: Check logs for `[STAGE TRANSITION CHECK]`
**Solution**:
- Verify AI is receiving full conversation context
- Check confidence thresholds aren't too high
- Review stage criteria definitions

#### Issue: Data Not Extracting
**Symptoms**: No check-in/journal records created
**Diagnosis**: Check logs for `[AI CHECK-IN EXTRACTION]` or `[AI JOURNAL EXTRACTION]`
**Solution**:
- Verify user actually provided the data
- Check confidence scores in logs
- Lower confidence threshold if needed (currently 70%)

#### Issue: AI Detection Errors
**Symptoms**: Errors in logs like `[AI STAGE DETECTION ERROR]`
**Diagnosis**: API key issues, rate limits, or model unavailability
**Solution**:
- Verify `GOOGLE_API_KEY` is set correctly
- Check API quota and rate limits
- Implement retry logic with exponential backoff

## Summary

The AI-powered stage detection system provides:

✅ **Natural conversation flow** - No more exact keyword requirements
✅ **Flexible understanding** - Handles language variations
✅ **Unified logic** - Same AI for detection and extraction
✅ **Better UX** - Users don't get stuck in stages
✅ **Detailed logging** - Easy to monitor and debug
✅ **Graceful errors** - Fails safely without breaking experience

The system is production-ready and has been tested with various conversation patterns.

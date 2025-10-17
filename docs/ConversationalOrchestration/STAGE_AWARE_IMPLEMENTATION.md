# Stage-Aware Conversation Orchestrator Implementation

## Overview

This document describes the complete implementation of the stage-aware conversation orchestrator for the Recovery Companion app. The system guides users through a structured six-stage recovery journey with contextual AI responses and dynamic suggested replies.

## Flow Architecture

The conversation flow follows this sequence:

```
greeting → check_in → journal_prompt → affirmation → reflection → milestone_review → (loops back to check_in)
```

### Stage Descriptions

1. **greeting**: Warmly welcome users and introduce the Recovery Companion
2. **check_in**: Gather daily wellness data (mood, sleep, energy, intentions)
3. **journal_prompt**: Encourage reflective journaling
4. **affirmation**: Provide personalized encouragement
5. **reflection**: Guide deeper self-reflection on progress
6. **milestone_review**: Celebrate achievements and set goals

## Implementation Components

### 1. Database Schema

**File**: [scripts/004_add_greeting_stage.sql](../../scripts/004_add_greeting_stage.sql)

The `conversations` table includes a `stage` column with the following configuration:

```sql
ALTER TABLE conversations
ADD CONSTRAINT conversations_stage_check
CHECK (stage IN ('greeting', 'check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

ALTER TABLE conversations
ALTER COLUMN stage SET DEFAULT 'greeting';
```

**Key Points**:
- All new conversations default to `greeting` stage
- Stage progression is enforced by the application logic
- Database constraint ensures only valid stages are stored

### 2. Flow Orchestration

**File**: [lib/flow.ts](../../lib/flow.ts)

This module manages stage-specific behavior:

#### Core Functions

- **`getSystemPromptForStage(stage, context)`**: Returns stage-specific AI instructions
- **`getNextStage(currentStage)`**: Determines the next stage in the flow
- **`shouldTransitionStage(stage, messageCount, lastMessage)`**: Heuristic-based stage completion detection
- **`getSuggestedRepliesForStage(stage, context)`**: Returns contextual quick replies

#### Stage Progression Logic

```typescript
const STAGE_PROGRESSION: Record<RecoveryStage, RecoveryStage> = {
  greeting: "check_in",
  check_in: "journal_prompt",
  journal_prompt: "affirmation",
  affirmation: "reflection",
  reflection: "milestone_review",
  milestone_review: "check_in", // Loops back
}
```

#### Suggested Replies Configuration

Each stage has 3-4 contextual suggested replies categorized as:
- **`quick`**: Short, simple responses
- **`detailed`**: Longer, more thoughtful responses

Example for greeting stage:
```typescript
{
  greeting: [
    { text: "Yes, let's check in", type: "quick" },
    { text: "Tell me more about how this works", type: "detailed" },
    { text: "I'm ready to start", type: "quick" },
  ]
}
```

### 3. Chat API Route

**File**: [app/api/chat/route.ts](../../app/api/chat/route.ts)

The main conversation endpoint handles:

1. **User authentication** via Stack
2. **Conversation retrieval** or creation
3. **Message persistence** (user and assistant messages)
4. **Context building** from recent messages, check-ins, and milestones
5. **Stage-specific system prompts**
6. **AI streaming response** using Google Gemini 2.5 Flash
7. **Stage transition logic** based on conversation analysis
8. **Auto-actions**: Creating check-ins, journal entries, and milestones

#### Response Headers

The API returns stage information via custom headers:

```typescript
return result.toUIMessageStreamResponse({
  headers: {
    "X-Conversation-Id": conversation.id.toString(),
    "X-Current-Stage": nextStage,
    "X-Suggested-Replies": JSON.stringify(suggestedReplies),
  },
})
```

**Note**: Due to limitations with the AI SDK's `useChat` hook, these headers are not directly accessible in the streaming response. See the Stage Info Endpoint below for the workaround.

### 4. Stage Info Endpoint

**File**: [app/api/chat/stage/route.ts](../../app/api/chat/stage/route.ts)

A GET endpoint that returns the current conversation state:

```typescript
GET /api/chat/stage

Response:
{
  conversationId: number | null,
  stage: RecoveryStage,
  suggestedReplies: SuggestedReply[]
}
```

This endpoint is called:
- On component mount to initialize state
- After each AI response completes (via `onFinish` callback)

### 5. Front-End Chat Interface

**File**: [components/chat-interface-ai.tsx](../../components/chat-interface-ai.tsx)

The UI component manages:

#### State Management

```typescript
const [currentStage, setCurrentStage] = useState<string>("greeting")
const [conversationId, setConversationId] = useState<number | null>(null)
const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([...])
```

#### Stage Synchronization

1. **Initial Load**: Fetch stage on mount
   ```typescript
   useEffect(() => {
     const response = await fetch("/api/chat/stage")
     const data = await response.json()
     setCurrentStage(data.stage)
     setSuggestedReplies(data.suggestedReplies)
     setConversationId(data.conversationId)
   }, [])
   ```

2. **After AI Response**: Update stage via `onFinish` callback
   ```typescript
   const { messages, sendMessage, status } = useChat({
     onFinish: async () => {
       const response = await fetch("/api/chat/stage")
       // Update stage and suggestions
     },
   })
   ```

#### Conversation Persistence

Messages are sent with the `conversationId` to maintain context:

```typescript
sendMessage({
  role: "user",
  parts: [{ type: "text", text: messageText }],
}, {
  body: conversationId ? { conversationId } : undefined,
})
```

## Data Flow Diagram

```
User Input
    ↓
[Chat Interface Component]
    ↓
POST /api/chat
    ↓
[Get/Create Conversation] → [Build Context]
    ↓                            ↓
[Stage-Specific Prompt] ← [Recent Messages]
    ↓                      [Check-ins]
[AI Stream Response]       [Milestones]
    ↓
[Save Assistant Message]
    ↓
[Check Stage Transition] → [Update Stage]
    ↓
[Handle Stage Actions]
  - Create check-in
  - Create journal entry
  - Create milestone
    ↓
[Return Response with Headers]
    ↓
[onFinish Callback]
    ↓
GET /api/chat/stage
    ↓
[Update UI State]
  - Current stage
  - Suggested replies
  - Conversation ID
```

## Stage Transition Logic

### Transition Triggers

Each stage has specific completion criteria:

1. **greeting**: Transitions after 1 user message
2. **check_in**: Transitions after 3+ messages containing mood/sleep/energy keywords
3. **journal_prompt**: Transitions after 2+ messages with journaling keywords
4. **affirmation**: Transitions after 1 message (brief stage)
5. **reflection**: Transitions after 2+ messages with growth/progress keywords
6. **milestone_review**: Transitions after 2+ messages with milestone/goal keywords

### Transition Function

```typescript
export function shouldTransitionStage(
  stage: RecoveryStage,
  messageCount: number,
  lastMessage: string
): boolean {
  const lowerMessage = lastMessage.toLowerCase()

  switch (stage) {
    case "check_in":
      return (
        messageCount >= 3 &&
        (lowerMessage.includes("feeling") ||
         lowerMessage.includes("sleep") ||
         lowerMessage.includes("energy"))
      )
    // ... other stages
  }
}
```

## Stage-Specific Actions

The system automatically creates database records based on conversation content:

### Check-in Creation

**Trigger**: During `check_in` stage
**Function**: `parseCheckInFromText()` in [lib/services/check-in.ts](../../lib/services/check-in.ts)

Extracts:
- Mood (string)
- Sleep quality (1-5)
- Energy level (1-5)
- Intentions (string)

### Journal Entry Creation

**Trigger**: During `journal_prompt` stage
**Function**: `parseJournalFromText()` in [lib/services/journal.ts](../../lib/services/journal.ts)

Requirements:
- Minimum 50 characters
- Auto-generates title from first line
- Stores full content with word count

### Milestone Management

**Trigger**: After any conversation
**Function**: `checkAndCreateAutoMilestones()` in [lib/services/milestone.ts](../../lib/services/milestone.ts)

Auto-creates milestones for:
- First check-in completed
- 7-day check-in streak
- First journal entry
- 30 days of sobriety (if applicable)

## Testing the Implementation

### Manual Testing Steps

1. **Start a new conversation**
   - Verify greeting stage suggestions appear
   - Check that welcome message is warm and informative

2. **Progress through check-in**
   - Respond with mood/sleep/energy information
   - Verify transition to journal_prompt
   - Check that check-in record is created in database

3. **Journal entry**
   - Write a reflective message (50+ characters)
   - Verify transition to affirmation
   - Check journal entry creation

4. **Complete full cycle**
   - Continue through affirmation, reflection, and milestone_review
   - Verify loop back to check_in stage

5. **Verify suggested replies**
   - Each stage should show contextually appropriate quick replies
   - Quick vs detailed replies should be visually distinct

### Database Verification Queries

```sql
-- Check conversation stage
SELECT id, user_id, stage, updated_at
FROM conversations
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- Verify check-in creation
SELECT * FROM check_ins
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Verify journal entries
SELECT id, title, word_count, created_at
FROM journal_entries
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Check milestones
SELECT name, type, progress, unlocked
FROM milestones
WHERE user_id = 'YOUR_USER_ID';
```

## Key Design Decisions

### 1. Why Fetch Stage Info Separately?

The `@ai-sdk/react` `useChat` hook doesn't expose response headers during streaming. We use a separate GET endpoint to synchronize stage state after the AI completes its response.

**Pros**:
- Reliable state synchronization
- Works with existing AI SDK
- Simple implementation

**Cons**:
- Extra API call after each response
- Slight delay in UI updates

**Future Improvement**: Consider using Server-Sent Events (SSE) to push stage updates during streaming, or switch to a custom fetch implementation with full header access.

### 2. Heuristic vs AI-Based Stage Transitions

Currently, stage transitions use simple keyword matching and message counts.

**Pros**:
- Fast and predictable
- No extra AI calls
- Easy to debug

**Cons**:
- Less flexible than AI-based detection
- May miss nuanced completion signals

**Future Improvement**: Use Gemini's function calling or structured output to detect stage completion more intelligently.

### 3. Looping Back to Check-In

After milestone review, the flow loops back to `check_in` rather than `greeting`.

**Rationale**:
- Users shouldn't see welcome messages repeatedly
- Check-in is the natural daily starting point
- Greeting is only for first-time or returning users

## Troubleshooting

### Issue: Suggested replies not updating

**Cause**: `/api/chat/stage` endpoint not being called or failing

**Solution**:
1. Check browser network tab for 401 errors (auth issue)
2. Verify `onFinish` callback is firing in useChat
3. Check console for fetch errors

### Issue: Stage not progressing

**Cause**: `shouldTransitionStage` conditions not met

**Solution**:
1. Review transition criteria in [lib/flow.ts](../../lib/flow.ts)
2. Check message count and keyword matching
3. Add logging to `shouldTransitionStage` for debugging

### Issue: Conversation ID not persisting

**Cause**: State not updated after first message

**Solution**:
1. Verify `/api/chat/stage` returns conversationId
2. Check `setConversationId` is called in `onFinish`
3. Ensure conversationId is passed in sendMessage body

## Future Enhancements

1. **Stage Skip/Rewind**: Allow users to manually navigate stages
2. **Adaptive Transitions**: Use AI to detect when user wants to change topics
3. **Stage History**: Track which stages users engage with most
4. **Personalized Flow**: Customize stage order based on user preferences
5. **Voice Mode**: Add speech-to-text for hands-free interaction
6. **Real-time Stage Indicators**: Show current stage visually in the UI
7. **Stage Completion Metrics**: Track average time spent in each stage

## Related Documentation

- [AI Integration Guide](../AI_INTEGRATION.md)
- [Suggested Replies Feature](./SUGGESTED_REPLIES_FEATURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Conversation Service API](../../lib/services/conversation.ts)

## Changelog

### 2025-10-16 - Initial Implementation
- Created greeting stage database migration
- Implemented stage-aware flow orchestration
- Built `/api/chat/stage` endpoint
- Updated chat interface with dynamic stage fetching
- Added comprehensive documentation

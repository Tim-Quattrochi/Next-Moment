# Conversational AI Orchestration System

## Overview

The Recovery Companion application now features a **guided conversational AI orchestration layer** that transforms the AI chat from a generic companion into a structured, stateful guide. The system automatically manages check-ins, journals, milestones, and message persistence through intelligent conversation flow.

## Architecture

### Core Components

1. **Flow Engine** ([lib/flow.ts](../../lib/flow.ts))
   - Manages conversation stages and transitions
   - Generates context-aware system prompts
   - Determines when to progress between stages

2. **Service Layer** ([lib/services/](../../lib/services/))
   - **conversation.ts**: Conversation lifecycle and context building
   - **check-in.ts**: Daily wellness check-in operations
   - **journal.ts**: Journal entry management
   - **milestone.ts**: Achievement tracking and auto-unlocking

3. **Type System** ([lib/types.ts](../../lib/types.ts))
   - Comprehensive TypeScript interfaces for all entities
   - Ensures type safety across the application

4. **API Orchestrator** ([app/api/chat/route.ts](../../app/api/chat/route.ts))
   - Integrates all services into the chat endpoint
   - Streams AI responses using Vercel AI SDK
   - Persists messages and triggers side effects

## Conversation Flow

### Stage Progression

The system guides users through six distinct recovery stages in a continuous cycle:

```
greeting → check_in → journal_prompt → affirmation → reflection → milestone_review → (loop back to check_in)
```

New conversations always start with a **greeting** stage to welcome users and set the tone.

### Stage Definitions

#### 0. **Greeting Stage**
- **Purpose**: Welcome the user and set expectations
- **AI Goal**: Create a warm, safe space and introduce the recovery companion
- **Side Effect**: None
- **Transition**: After 1 message
- **Suggested Replies**:
  - "Yes, let's check in"
  - "Tell me more about how this works"
  - "I'm ready to start"

#### 1. **Check-In Stage**
- **Purpose**: Gather daily wellness data
- **AI Goal**: Ask about mood, sleep quality (1-5), energy level (1-5), and intentions
- **Side Effect**: Creates a check-in record when data is detected
- **Transition**: After 3+ user messages containing check-in data
- **Suggested Replies**:
  - "I'm feeling calm today"
  - "I slept well, about 4/5"
  - "My energy level is 3/5"
  - "I want to stay focused and positive today"

#### 2. **Journal Prompt Stage**
- **Purpose**: Encourage reflective journaling
- **AI Goal**: Prompt gratitude, progress, challenges, or learnings
- **Side Effect**: Creates journal entry when reflection is detected (50+ chars)
- **Transition**: After 2+ messages with journal-like content
- **Suggested Replies**:
  - "I'd like to journal about today"
  - "I'm grateful for my progress"
  - "Let me reflect on my challenges"
  - "Skip journaling for now"

#### 3. **Affirmation Stage**
- **Purpose**: Provide personalized encouragement
- **AI Goal**: Deliver context-specific affirmation based on user's progress
- **Side Effect**: None
- **Transition**: After 1 message
- **Suggested Replies**:
  - "Thank you, that means a lot"
  - "I needed to hear that"
  - "Tell me more"

#### 4. **Reflection Stage**
- **Purpose**: Guide deeper self-awareness
- **AI Goal**: Facilitate reflection on growth, habits, and perspective shifts
- **Side Effect**: None
- **Transition**: After 2+ messages with reflection keywords
- **Suggested Replies**:
  - "I've noticed positive changes"
  - "My habits are improving"
  - "I'm learning to appreciate myself more"
  - "Let's move on"

#### 5. **Milestone Review Stage**
- **Purpose**: Celebrate achievements and set goals
- **AI Goal**: Review progress, unlock milestones, encourage goal-setting
- **Side Effect**: Auto-creates milestones based on streaks (e.g., 7-day check-in streak)
- **Transition**: After 2+ messages discussing milestones
- **Suggested Replies** (with milestones):
  - "Show me my progress"
  - "I'm proud of what I've achieved"
  - "What should I work on next?"
  - "Let's set a new goal"
- **Suggested Replies** (without milestones):
  - "Help me set my first goal"
  - "What milestones can I track?"
  - "I'm ready to start tracking progress"

## Key Features

### 1. **Suggested Replies**

Each stage provides contextual suggested replies to help users engage with the conversation:
- **Quick replies**: Short, immediate responses (e.g., "Yes, let's check in")
- **Detailed replies**: More thoughtful responses (e.g., "I'm grateful for my progress")
- Dynamically generated based on current stage and user context
- Returned in API response header `X-Suggested-Replies` as JSON array
- Help users understand what information is expected at each stage

Example suggested replies structure:
```typescript
[
  { text: "I'm feeling calm today", type: "quick" },
  { text: "I want to stay focused and positive today", type: "detailed" }
]
```

### 2. **Context-Aware System Prompts**

Each stage receives a dynamically generated system prompt that includes:
- Base recovery companion guidelines (empathy, safety, non-clinical)
- Stage-specific objectives and conversation patterns
- Recent conversation history (last 10 messages)
- User's recent check-ins (last 3)
- Active milestones with progress
- Journal entry count

### 3. **Automatic Data Extraction**

The system uses pattern matching to detect and extract:
- **Check-in data**: Parses mood, sleep, energy, intentions from natural language
- **Journal entries**: Identifies reflective content (50+ characters)
- **Milestone triggers**: Detects streak achievements automatically

### 4. **Conversation Continuity**

- Each conversation maintains:
  - Unique ID for tracking
  - Current stage
  - Full message history
  - Auto-generated title (from first user message)
  - Creation and update timestamps

### 5. **Milestone Auto-Unlocking**

Achievements are automatically tracked and unlocked:
- First check-in: "First Steps"
- 7-day check-in streak: "Week of Consistency"
- 30-day check-in streak: "Month of Dedication"
- First journal: "Beginning to Reflect"
- 5 journal entries: "Reflection Beginner"
- 25 journal entries: "Journaling Enthusiast"

## API Integration

### Chat Endpoint (`/api/chat`)

**Request:**
```typescript
POST /api/chat
{
  messages: Message[],      // Conversation history from client
  conversationId?: number   // Optional: reuse existing conversation
}
```

**Response:**
```typescript
// Streamed AI response with headers
Headers:
  X-Conversation-Id: number
  X-Current-Stage: RecoveryStage
  X-Suggested-Replies: JSON string of SuggestedReply[]
```

### Conversations Endpoint (`/api/conversations`)

**List Conversations:**
```typescript
GET /api/conversations?limit=20&offset=0
```

**Create Conversation:**
```typescript
POST /api/conversations
{
  title?: string,
  stage?: RecoveryStage
}
```

**Get Conversation:**
```typescript
GET /api/conversations/[id]?includeMessages=true&messageLimit=50
```

**Update Conversation:**
```typescript
PATCH /api/conversations/[id]
{
  title?: string,
  stage?: RecoveryStage
}
```

## Database Schema Changes

### Stage Column Updates

**Initial Stage Column:**
```sql
ALTER TABLE conversations
ADD COLUMN stage TEXT DEFAULT 'check_in'
CHECK (stage IN ('check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

CREATE INDEX idx_conversations_stage ON conversations(stage);
```
Migration file: [scripts/003_add_stage_column.sql](../../scripts/003_add_stage_column.sql)

**Greeting Stage Addition:**
```sql
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_stage_check;

ALTER TABLE conversations
ADD CONSTRAINT conversations_stage_check
CHECK (stage IN ('greeting', 'check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

ALTER TABLE conversations
ALTER COLUMN stage SET DEFAULT 'greeting';
```
Migration file: [scripts/004_add_greeting_stage.sql](../../scripts/004_add_greeting_stage.sql)

## Usage Example

### Client-Side Integration

```typescript
import { useChat } from '@ai-sdk/react';

function ChatComponent() {
  const [suggestedReplies, setSuggestedReplies] = useState([]);

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      const conversationId = response.headers.get('X-Conversation-Id');
      const currentStage = response.headers.get('X-Current-Stage');
      const repliesJson = response.headers.get('X-Suggested-Replies');

      if (repliesJson) {
        const replies = JSON.parse(repliesJson);
        setSuggestedReplies(replies);
      }

      console.log(`Conversation ${conversationId} at stage: ${currentStage}`);
    }
  });

  return (
    <div>
      {/* Your chat UI */}
      {suggestedReplies.length > 0 && (
        <div className="suggested-replies">
          {suggestedReplies.map((reply, i) => (
            <button key={i} onClick={() => sendMessage(reply.text)}>
              {reply.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Server-Side Service Usage

```typescript
import { getOrCreateConversation, buildConversationContext } from '@/lib/services/conversation';
import { createCheckIn } from '@/lib/services/check-in';
import { getSystemPromptForStage } from '@/lib/flow';

// Get active conversation
const conversation = await getOrCreateConversation(userId);

// Build context for AI
const context = await buildConversationContext(
  userId,
  conversation.id,
  conversation.stage
);

// Generate stage-specific prompt
const systemPrompt = getSystemPromptForStage(conversation.stage, context);

// Create check-in from conversation
const checkInData = { mood: 'calm', sleepQuality: 4, energyLevel: 3, intentions: 'Stay positive' };
await createCheckIn(userId, checkInData);
```

## Best Practices

### 1. **Stage Transition Logic**

- Don't force transitions too quickly—let conversations flow naturally
- Use keyword detection as hints, not strict rules
- Allow users to stay in a stage longer if they're engaged

### 2. **Data Extraction**

- Parse conservatively—require clear patterns before creating records
- Validate all extracted data before database insertion
- Log extraction attempts for debugging

### 3. **Error Handling**

- Wrap all service calls in try-catch blocks
- Return graceful fallbacks (empty arrays, default values)
- Never block the AI response due to side-effect failures

### 4. **Privacy & Safety**

- Never log message content containing PII
- Maintain crisis detection keywords in system prompts
- Encourage professional help for serious mental health concerns

## Performance Considerations

- **Message History**: Limited to last 10 messages per conversation
- **Check-in Context**: Limited to last 3 check-ins
- **Milestone Display**: Limited to 5 most recent milestones
- **Conversation Pagination**: 20 conversations per page by default

## Testing the System

### 1. **Check-In Flow**
```
User: "I'm feeling calm today. I slept 4/5 and my energy is 3/5. My intention is to stay focused."
AI: [Acknowledges check-in, transitions to journal prompt]
```

### 2. **Journal Flow**
```
User: "I'm grateful for my progress this week. I've been more mindful of my triggers."
AI: [Saves journal entry, provides affirmation]
```

### 3. **Milestone Unlock**
```
[After 7 consecutive check-ins]
AI: "🎉 You've unlocked 'Week of Consistency'! Seven days of showing up for yourself."
```

## Troubleshooting

### Stage Not Progressing
- Check `shouldTransitionStage()` logic in [lib/flow.ts](../../lib/flow.ts)
- Verify user messages contain expected keywords
- Review message count threshold

### Data Not Saving
- Check database connection in [lib/db.ts](../../lib/db.ts)
- Verify parsing functions return valid data
- Check server logs for SQL errors

### AI Context Missing
- Ensure `buildConversationContext()` is called before AI generation
- Verify database queries return expected data
- Check that conversation ID is being persisted

## Future Enhancements

- [x] Suggested replies for each stage
- [x] Greeting stage for new conversations
- [ ] AI-driven stage detection using function calling
- [ ] User-configurable stage progression preferences
- [ ] Multi-modal input (voice, images)
- [ ] Sentiment analysis for mood tracking
- [ ] Integration with external wellness APIs
- [ ] Conversation export and backup
- [ ] Admin dashboard for conversation analytics
- [ ] Personalized suggested replies based on user history

## Related Documentation

- [AI Integration Guide](../AI_INTEGRATION.md)
- [Database Schema](../../scripts/001_create_tables.sql)
- [API Routes Documentation](../routing-flow.md)

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0

# Migration Guide: Conversational Orchestration System

## Overview

This guide explains how to migrate your existing Recovery Companion application to use the new guided conversational orchestration layer.

## Prerequisites

- Node.js v18+
- PostgreSQL/Neon database access
- Existing Recovery Companion installation

## Step-by-Step Migration

### 1. Database Migration

Run the SQL migration to add the `stage` column to the conversations table:

```bash
# Option A: Using psql
psql $DATABASE_URL < scripts/003_add_stage_column.sql

# Option B: Using Neon SQL Editor
# Copy the contents of scripts/003_add_stage_column.sql
# Paste into Neon SQL Editor and execute
```

**Migration Contents:**
```sql
ALTER TABLE conversations
ADD COLUMN stage TEXT DEFAULT 'check_in'
CHECK (stage IN ('check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

CREATE INDEX idx_conversations_stage ON conversations(stage);

UPDATE conversations SET stage = 'check_in' WHERE stage IS NULL;
```

**Verification:**
```sql
-- Check that the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'stage';

-- Verify existing conversations were updated
SELECT COUNT(*), stage FROM conversations GROUP BY stage;
```

### 2. Update Dependencies

No new dependencies are required! The system uses existing packages:
- `@neondatabase/serverless` (already installed)
- `@ai-sdk/google` (already installed)
- `ai` (Vercel AI SDK - already installed)

### 3. Code Integration

#### Frontend Changes (Optional)

If you want to display the current conversation stage in your UI:

```typescript
// components/chat-interface-ai.tsx

const { messages, sendMessage, status } = useChat({
  api: '/api/chat',
  onResponse: (response) => {
    const conversationId = response.headers.get('X-Conversation-Id');
    const currentStage = response.headers.get('X-Current-Stage');

    // Update UI state
    setConversationId(conversationId);
    setCurrentStage(currentStage);
  }
});
```

#### No Breaking Changes

The refactored `/api/chat` endpoint is **backward compatible**:
- Existing clients will continue to work
- New functionality is opt-in via the `conversationId` parameter
- All response formats remain unchanged

### 4. Test the System

#### Test 1: New Conversation Flow

1. Start a new chat session
2. Send a greeting message
3. Verify the AI responds with check-in questions
4. Check database for new conversation with `stage = 'check_in'`

```sql
SELECT id, title, stage, created_at FROM conversations ORDER BY created_at DESC LIMIT 1;
```

#### Test 2: Check-In Creation

1. Send a message like: "I'm feeling happy. Sleep was 4/5, energy is 4/5. My intention is to exercise."
2. Verify a check-in record was created

```sql
SELECT * FROM check_ins ORDER BY created_at DESC LIMIT 1;
```

#### Test 3: Stage Progression

1. Complete a check-in
2. Continue the conversation
3. Verify the conversation progresses to `journal_prompt` stage

```sql
SELECT id, stage, updated_at FROM conversations WHERE id = <conversation_id>;
```

#### Test 4: Milestone Unlocking

1. Create 7 check-ins over 7 consecutive days (or manually insert for testing)
2. Trigger milestone check via chat
3. Verify milestone was created

```sql
SELECT * FROM milestones WHERE type = 'check_in_streak_7';
```

### 5. Rollback Plan

If you encounter issues, you can rollback the database changes:

```sql
-- Remove the stage column
ALTER TABLE conversations DROP COLUMN IF EXISTS stage;

-- Drop the index
DROP INDEX IF EXISTS idx_conversations_stage;
```

Then revert the code changes:

```bash
git checkout HEAD~1 app/api/chat/route.ts
```

## Troubleshooting

### Issue: "Column 'stage' does not exist"

**Cause**: Migration not applied

**Solution**:
```bash
# Verify migration was run
SELECT * FROM pg_catalog.pg_tables WHERE tablename = 'conversations';

# Re-run migration
psql $DATABASE_URL < scripts/003_add_stage_column.sql
```

### Issue: TypeScript errors in services

**Cause**: Neon driver API differences from Vercel Postgres

**Solution**: The service files have been updated to use the correct Neon API. Ensure you're using the latest code:

```typescript
// OLD (Vercel Postgres)
const result = await sql<User>`SELECT * FROM users`;
return result.rows[0];

// NEW (Neon)
const result = await sql`SELECT * FROM users`;
return result[0] as User;
```

### Issue: AI responses don't include stage context

**Cause**: `buildConversationContext()` not being called

**Solution**: Verify the chat route is using the new orchestration:

```typescript
// In app/api/chat/route.ts
const context = await buildConversationContext(userId, conversation.id, conversation.stage);
const systemPrompt = getSystemPromptForStage(conversation.stage, context);
```

### Issue: Milestones not unlocking automatically

**Cause**: `checkAndCreateAutoMilestones()` not called after AI response

**Solution**: Ensure it's in the `onFinish` callback:

```typescript
async onFinish({ text }) {
  await saveMessage(conversation.id, "assistant", text);
  await checkAndCreateAutoMilestones(userId); // This line
}
```

## Verification Checklist

Before deploying to production, verify:

- [ ] Database migration completed successfully
- [ ] No TypeScript compilation errors
- [ ] Chat API responds with correct headers (`X-Conversation-Id`, `X-Current-Stage`)
- [ ] Check-ins are created from natural language
- [ ] Journal entries are saved from longer reflections
- [ ] Milestones unlock automatically based on streaks
- [ ] Conversation history is preserved across sessions
- [ ] Stage transitions occur naturally during conversation
- [ ] Error handling works gracefully (no crashes on service failures)
- [ ] All existing API endpoints still function

## Performance Tuning

### Optimize Context Building

The `buildConversationContext()` function makes multiple database queries. For high-traffic applications, consider:

1. **Add Caching**:
```typescript
import { cache } from 'react';

export const buildConversationContext = cache(async (
  userId: string,
  conversationId: number,
  currentStage: RecoveryStage
) => {
  // ... existing code
});
```

2. **Reduce Query Count**:
```typescript
// Combine multiple queries into one using JOINs
const contextData = await sql`
  WITH recent_checkins AS (
    SELECT * FROM check_ins WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 3
  ),
  active_milestones AS (
    SELECT * FROM milestones WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5
  )
  SELECT
    (SELECT json_agg(recent_checkins.*) FROM recent_checkins) as checkins,
    (SELECT json_agg(active_milestones.*) FROM active_milestones) as milestones,
    (SELECT COUNT(*) FROM journal_entries WHERE user_id = ${userId}) as journal_count
`;
```

### Message History Limits

Adjust limits based on your token budget:

```typescript
// In lib/services/conversation.ts
export async function getRecentMessages(
  conversationId: number,
  limit: number = 10 // Reduce to 5 for smaller context
): Promise<Message[]> {
  // ...
}
```

## Post-Migration Tasks

### 1. Update Documentation

Update your project README to reference the new orchestration docs:

```markdown
## Conversational AI Features

The application uses a guided conversation orchestration system. See:
- [Orchestration Overview](docs/ConversationalOrchestration/README.md)
- [Migration Guide](docs/ConversationalOrchestration/MIGRATION_GUIDE.md)
```

### 2. Monitor Usage

Add logging to track stage transitions:

```typescript
// In app/api/chat/route.ts
if (shouldTransitionStage(...)) {
  const nextStage = await progressConversationStage(conversation.id, conversation.stage);
  console.log(`Conversation ${conversation.id} transitioned: ${conversation.stage} → ${nextStage}`);
}
```

### 3. Gather Feedback

Monitor user interactions to refine:
- Stage transition thresholds
- Keyword patterns for data extraction
- System prompt effectiveness

### 4. Optional Enhancements

Consider implementing:
- Analytics dashboard for conversation metrics
- A/B testing different stage prompts
- User preferences for conversation style
- Conversation export feature

## Support

If you encounter issues during migration:

1. Check server logs for detailed error messages
2. Verify database schema matches expected structure
3. Review the [Troubleshooting](#troubleshooting) section above
4. Open an issue in the project repository

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0

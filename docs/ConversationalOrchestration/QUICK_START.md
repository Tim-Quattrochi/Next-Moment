# Stage-Aware Orchestrator - Quick Start Guide

## What Was Implemented

A complete stage-aware conversation orchestrator that guides users through a structured recovery journey with dynamic AI responses and contextual suggested replies.

## Flow Overview

```
greeting → check_in → journal_prompt → affirmation → reflection → milestone_review → (loop)
```

## Key Files Modified/Created

### Database
- ✅ [scripts/004_add_greeting_stage.sql](../../scripts/004_add_greeting_stage.sql) - Migration applied
- Default stage: `greeting`
- All 6 stages enforced by constraint

### Backend
- ✅ [lib/flow.ts](../../lib/flow.ts) - Already existed with all stage configurations
- ✅ [app/api/chat/route.ts](../../app/api/chat/route.ts) - Already stage-aware
- ✅ [app/api/chat/stage/route.ts](../../app/api/chat/stage/route.ts) - **NEW** - Returns current stage info

### Frontend
- ✅ [components/chat-interface-ai.tsx](../../components/chat-interface-ai.tsx) - Updated to fetch and display stage-aware suggestions

### Documentation
- ✅ [docs/ConversationalOrchestration/STAGE_AWARE_IMPLEMENTATION.md](./STAGE_AWARE_IMPLEMENTATION.md) - Complete technical docs
- ✅ [scripts/test-stage-flow.sh](../../scripts/test-stage-flow.sh) - Automated test suite

## How It Works

### 1. Initial Load
When a user opens the chat:
```typescript
// Fetch current stage or default to greeting
GET /api/chat/stage
→ { stage: "greeting", suggestedReplies: [...], conversationId: null }
```

### 2. User Sends Message
```typescript
POST /api/chat
{
  messages: [...],
  conversationId: 123 // if exists
}
```

Backend:
1. Gets/creates conversation (defaults to greeting stage)
2. Builds context (messages, check-ins, milestones)
3. Uses stage-specific system prompt
4. Streams AI response
5. Checks if stage should transition
6. Updates conversation stage
7. Creates auto-records (check-ins, journals, milestones)

### 3. After Response Completes
```typescript
// Frontend onFinish callback
GET /api/chat/stage
→ { stage: "check_in", suggestedReplies: [...], conversationId: 123 }

// UI updates automatically
setCurrentStage("check_in")
setSuggestedReplies([...])
```

## Testing the Implementation

### Automated Tests
```bash
./scripts/test-stage-flow.sh
```

All tests should pass ✅

### Manual Testing

1. **Open the app**: http://localhost:3000
2. **Navigate to chat** (if not default view)
3. **Verify greeting stage**:
   - Should see greeting-specific suggestions:
     - "Yes, let's check in"
     - "Tell me more about how this works"
     - "I'm ready to start"
4. **Send first message**
   - AI should welcome you warmly
   - Stage transitions to `check_in` after response
5. **Continue conversation**:
   - Provide mood, sleep, energy info
   - Watch suggestions update to check-in stage
   - Progress to journal, affirmation, etc.

### Database Verification

```sql
-- Check current conversation stage
SELECT id, user_id, stage, updated_at
FROM conversations
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- Verify check-in was created
SELECT * FROM check_ins
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 1;
```

## Stage Progression Reference

| Stage | Suggested Replies | Auto-Actions | Next Stage |
|-------|------------------|--------------|------------|
| **greeting** | "Yes, let's check in"<br>"Tell me more"<br>"I'm ready" | None | check_in |
| **check_in** | "I'm feeling calm"<br>"I slept well, 4/5"<br>"Energy 3/5" | Create check-in record | journal_prompt |
| **journal_prompt** | "I'd like to journal"<br>"I'm grateful"<br>"Let me reflect" | Create journal entry (50+ chars) | affirmation |
| **affirmation** | "Thank you"<br>"I needed that"<br>"Tell me more" | None | reflection |
| **reflection** | "I've noticed changes"<br>"My habits improving"<br>"Learning to appreciate" | None | milestone_review |
| **milestone_review** | "Show my progress"<br>"I'm proud"<br>"What's next?" | Create auto-milestones | check_in (loop) |

## Troubleshooting

### Suggestions not updating
**Check**: Browser console for fetch errors to `/api/chat/stage`
**Fix**: Ensure user is authenticated (Stack auth)

### Stage not progressing
**Check**: Review `shouldTransitionStage` logic in [lib/flow.ts:233](../../lib/flow.ts#L233)
**Fix**: Adjust message count or keyword matching

### ConversationId not persisting
**Check**: Network tab to verify conversationId in POST body
**Fix**: Ensure `onFinish` callback updates state

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         User Opens Chat                     │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  GET /api/chat/stage                        │
│  Returns: { stage, suggestedReplies }       │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  UI Displays Stage-Specific Suggestions     │
└────────────────┬────────────────────────────┘
                 │
            User sends message
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  POST /api/chat                             │
│  - Get/create conversation                  │
│  - Build context                            │
│  - Get stage-specific prompt                │
│  - Stream AI response                       │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  onFinish callback                          │
│  - Save assistant message                   │
│  - Check transition criteria                │
│  - Update conversation.stage                │
│  - Create auto-records                      │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  GET /api/chat/stage                        │
│  Returns updated: { stage, suggestions }    │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  UI Updates with New Suggestions            │
│  Cycle continues...                         │
└─────────────────────────��───────────────────┘
```

## What's Next?

The implementation is complete and ready for testing. Consider these enhancements:

1. **Visual Stage Indicator**: Show current stage in the UI
2. **Stage History**: Track user engagement per stage
3. **Manual Navigation**: Let users skip/revisit stages
4. **AI-Based Transitions**: Use function calling instead of keywords
5. **Stage Analytics**: Measure time spent in each stage

## Support

For detailed technical information, see:
- [Full Implementation Guide](./STAGE_AWARE_IMPLEMENTATION.md)
- [Flow Orchestration Code](../../lib/flow.ts)
- [Chat API Route](../../app/api/chat/route.ts)

---

**Status**: ✅ Implementation Complete
**Last Updated**: 2025-10-16
**Test Status**: All automated tests passing

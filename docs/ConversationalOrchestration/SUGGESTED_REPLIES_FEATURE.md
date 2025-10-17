# Suggested Replies & Greeting Stage - Implementation Summary

**Date**: 2025-10-16
**Status**: ✅ Complete - Ready for Testing

## Overview

Enhanced the Recovery Companion conversational AI with:
1. **Greeting Stage** - Warm welcome for new conversations
2. **Suggested Replies** - Context-aware quick responses for each stage

## What Changed

### 1. New Greeting Stage
- Added as the first stage in the conversation flow
- Provides a welcoming introduction to new users
- Transitions to check-in after 1 message
- Returns after milestone review completes the cycle

### 2. Suggested Replies System
Every stage now provides 3-4 suggested replies to help users:
- Understand what information is expected
- Respond quickly with buttons/chips
- Navigate the conversation more easily

### 3. Files Modified

| File | Changes |
|------|---------|
| `lib/types.ts` | Added `greeting` to RecoveryStage, added SuggestedReply interface |
| `lib/flow.ts` | Added greeting stage logic, implemented getSuggestedRepliesForStage() |
| `lib/services/conversation.ts` | Changed default stage to 'greeting' |
| `app/api/chat/route.ts` | Returns suggested replies in X-Suggested-Replies header |
| `docs/ConversationalOrchestration/README.md` | Comprehensive documentation updates |

### 4. Files Created

| File | Purpose |
|------|---------|
| `scripts/004_add_greeting_stage.sql` | Database migration to add greeting stage |

## Database Migration Required

Run this migration to update the stage constraint:

```bash
psql $DATABASE_URL -f scripts/004_add_greeting_stage.sql
```

Or manually in Neon SQL Editor:

```sql
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_stage_check;

ALTER TABLE conversations
ADD CONSTRAINT conversations_stage_check
CHECK (stage IN ('greeting', 'check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

ALTER TABLE conversations
ALTER COLUMN stage SET DEFAULT 'greeting';
```

## API Changes

### Response Headers

The `/api/chat` endpoint now returns an additional header:

```
X-Suggested-Replies: JSON array of { text: string, type?: "quick" | "detailed" }
```

### Example Response Headers

```
X-Conversation-Id: 123
X-Current-Stage: check_in
X-Suggested-Replies: [{"text":"I'm feeling calm today","type":"quick"},{"text":"I slept well, about 4/5","type":"quick"}]
```

## Client Integration

### Parsing Suggested Replies

```typescript
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

function ChatComponent() {
  const [suggestedReplies, setSuggestedReplies] = useState([]);

  const { messages, sendMessage } = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      const repliesJson = response.headers.get('X-Suggested-Replies');
      if (repliesJson) {
        setSuggestedReplies(JSON.parse(repliesJson));
      }
    }
  });

  return (
    <div>
      {/* Your chat UI */}
      {suggestedReplies.length > 0 && (
        <div className="suggested-replies">
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(reply.text)}
              className={reply.type === 'quick' ? 'quick-reply' : 'detailed-reply'}
            >
              {reply.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Suggested Replies by Stage

### Greeting Stage
- "Yes, let's check in" (quick)
- "Tell me more about how this works" (detailed)
- "I'm ready to start" (quick)

### Check-In Stage
- "I'm feeling calm today" (quick)
- "I slept well, about 4/5" (quick)
- "My energy level is 3/5" (quick)
- "I want to stay focused and positive today" (detailed)

### Journal Prompt Stage
- "I'd like to journal about today" (quick)
- "I'm grateful for my progress" (detailed)
- "Let me reflect on my challenges" (detailed)
- "Skip journaling for now" (quick)

### Affirmation Stage
- "Thank you, that means a lot" (quick)
- "I needed to hear that" (quick)
- "Tell me more" (detailed)

### Reflection Stage
- "I've noticed positive changes" (detailed)
- "My habits are improving" (quick)
- "I'm learning to appreciate myself more" (detailed)
- "Let's move on" (quick)

### Milestone Review Stage

**With milestones:**
- "Show me my progress" (quick)
- "I'm proud of what I've achieved" (detailed)
- "What should I work on next?" (detailed)
- "Let's set a new goal" (quick)

**Without milestones:**
- "Help me set my first goal" (quick)
- "What milestones can I track?" (detailed)
- "I'm ready to start tracking progress" (detailed)

## Testing Checklist

Before deploying:

- [ ] Run database migration
- [ ] Start new conversation and verify greeting appears
- [ ] Check X-Suggested-Replies header is present
- [ ] Verify suggested replies change between stages
- [ ] Test that stage transitions work correctly
- [ ] Confirm milestone-based replies show correctly

## Benefits

1. **Improved UX**: Users know what to say at each stage
2. **Faster Responses**: Quick-reply buttons reduce typing
3. **Better Onboarding**: Greeting stage creates welcoming experience
4. **Guided Flow**: Suggested replies teach users how to interact
5. **Accessibility**: Easier for users with typing difficulties

## Backward Compatibility

✅ Fully backward compatible:
- Existing conversations continue to work
- API accepts same request format
- Only adds new response header
- No breaking changes

## Performance Impact

Minimal impact:
- `getSuggestedRepliesForStage()` is a simple switch statement
- No additional database queries
- Suggested replies are generated synchronously before response

## Future Enhancements

Consider implementing:
- AI-generated suggested replies based on conversation context
- User preferences to show/hide suggested replies
- Analytics on which replies are used most
- Personalized replies based on user history

## Support

For questions or issues:
1. See [docs/ConversationalOrchestration/README.md](docs/ConversationalOrchestration/README.md)
2. Check the greeting stage and suggested replies sections
3. Review server logs for errors

---

**Implementation Complete** ✅
**Ready for Migration** ✅
**Documentation Updated** ✅

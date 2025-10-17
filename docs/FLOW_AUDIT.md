# Chat Flow & Stage Progression Audit

## Current Issues Identified

### Issue 1: Stage Progression Too Aggressive
The stage transitions are happening too quickly based on simple keyword matching, causing mismatches between:
- What the AI is asking
- What stage the system thinks it's in
- What suggested replies are shown

### Example Timeline:
1. **Stage: check_in** → AI asks about mood/sleep/energy
2. User mentions "feeling positive"
3. **Stage jumps to: affirmation** (too early - energy not answered yet)
4. AI still asking check-in questions but stage/suggestions don't match

### Issue 2: Stage Transition Logic Problems

#### Current Flow:
```
greeting → check_in → journal_prompt → affirmation → reflection → milestone_review → check_in (cycle)
```

#### Transition Conditions (lib/flow.ts:233-291):

1. **greeting → check_in**: After 1 message ✓ (OK)

2. **check_in → journal_prompt**:
   - Requires 4+ messages AND all of (mood, sleep, energy, intention)
   - **PROBLEM**: Fixed but may still be too rigid

3. **journal_prompt → affirmation**:
   - Requires 2+ messages AND keywords: journal|write|grateful|reflect
   - **PROBLEM**: User saying "I've noticed positive changes" contains "reflect"-like language
   - Transitions even if user declined journaling

4. **affirmation → reflection**:
   - Requires ONLY 1 message
   - **PROBLEM**: Too fast! Should wait for user acknowledgment

5. **reflection → milestone_review**:
   - Requires 2+ messages AND keywords: growth|change|learn|progress
   - **PROBLEM**: User saying "I've noticed positive changes" triggers this immediately
   - Contains both "change" and implicit "progress"

6. **milestone_review → check_in**:
   - Requires 2+ messages AND keywords: milestone|goal|achievement
   - **PROBLEM**: Completes the cycle back to check-in too quickly

### Issue 3: AI Prompt vs Stage Mismatch

The AI is following the stage prompts, but transitions happen DURING the conversation about that stage, not AFTER completing it.

**Example:**
- Stage: `reflection`
- AI Prompt says: "Help the user reflect... Ask: What positive changes have you noticed?"
- AI asks: "What specific positive changes have you noticed?"
- User responds with "changes" keyword
- **Stage immediately transitions to `milestone_review`**
- But AI hasn't finished the reflection conversation!

### Issue 4: Suggested Replies Don't Match AI Context

The suggested replies are stage-based but don't consider:
- What the AI just asked
- Whether the user already answered
- The conversational flow

**Current behavior:**
- Stage: milestone_review
- AI asking: "What positive changes have you noticed?" (reflection question)
- Suggestions: "Show me my progress", "I'm proud of what I've achieved" (milestone responses)
- **These don't answer the AI's question!**

## Root Causes

### 1. **Keyword-Based Stage Transitions Are Too Simplistic**
Keywords like "change", "progress", "reflect" appear naturally in conversations but trigger stage transitions prematurely.

### 2. **Transitions Based on User Input, Not AI Completion**
Stages should transition when the AI completes its objective, not when the user happens to use certain words.

### 3. **No "Stage Completion" State**
There's no mechanism to detect when a stage's objectives are actually met vs when keywords are mentioned.

### 4. **Message Count Is Arbitrary**
Using message counts (2+ messages, 4+ messages) doesn't reflect actual conversation progress.

## Recommended Fixes

### Fix 1: Use AI Function Calling for Stage Management
Instead of keyword matching, let the AI explicitly signal when it's ready to transition:

```typescript
// AI can call this function when stage objectives are complete
function completeStage() {
  return { readyToTransition: true, reason: "User has completed reflection" }
}
```

### Fix 2: Separate "Stage" from "AI Intent"
- **Stage**: What data we're collecting (check_in, journal, etc.)
- **AI Intent**: What the AI is currently doing (asking about mood, giving affirmation, etc.)

Suggested replies should match AI intent, not stage.

### Fix 3: Make Transitions More Conservative
Require explicit completion signals:

**check_in**: Only transition when AI explicitly says "let's move to journaling" or similar
**journal_prompt**: Only transition when user agrees to journal OR explicitly declines
**affirmation**: Only transition when user acknowledges affirmation
**reflection**: Only transition when AI summarizes reflections and suggests milestone review

### Fix 4: Context-Aware Suggested Replies
Already partially implemented, but needs to:
- Parse AI's last question
- Extract what it's asking about
- Provide relevant answer options

### Fix 5: Add Transition Cooldown
Don't allow stage transitions on consecutive messages. Require at least 2-3 exchanges per stage.

## Proposed New Transition Logic

```typescript
case "journal_prompt":
  // Only transition if user explicitly engages with or declines journaling
  const explicitlyEngaged = lowerMessage.match(/yes|sure|okay|let's|i'd like to journal/i)
  const explicitlyDeclined = lowerMessage.match(/no|skip|not now|maybe later/i)

  return messageCount >= 2 && (explicitlyEngaged || explicitlyDeclined)

case "affirmation":
  // Only transition after user acknowledges the affirmation
  const acknowledged = lowerMessage.match(/thank|appreciate|needed|helps|feel better/i)

  return messageCount >= 2 && acknowledged

case "reflection":
  // Only transition when conversation naturally concludes
  // User has shared reflections AND AI has asked about progress/milestones
  const sharedReflections = messageCount >= 3
  const aiMentionedMilestones = lastAIMessage.includes("milestone") ||
                                lastAIMessage.includes("progress") ||
                                lastAIMessage.includes("achievement")

  return sharedReflections && aiMentionedMilestones
```

## Impact Assessment

### High Priority Issues:
1. ✅ **FIXED**: check_in transitioning too early
2. ❌ **CRITICAL**: reflection → milestone_review happening mid-conversation
3. ❌ **CRITICAL**: Suggested replies don't match AI's questions

### Medium Priority:
4. ❌ journal_prompt transition too keyword-dependent
5. ❌ affirmation stage too short (1 message)

### Low Priority:
6. ❌ Better validation of parsed check-in data
7. ❌ Stage transition history/logging

## Testing Scenarios Needed

1. **Full happy path**: greeting → check_in → journal → affirmation → reflection → milestones → back to check_in - done for today? still allow user to see journal, garden and chat regularly with AI chat
2. **User declines journaling**: Should still progress gracefully
3. **User gives incomplete check-in data**: Should stay in check_in until complete
4. **User mentions keywords naturally**: Shouldn't trigger premature transitions
5. **Long reflection conversation**: Should allow multiple exchanges before transitioning

## Next Steps

1. Implement AI function calling for explicit stage transitions
2. Update `shouldTransitionStage` logic for each stage
3. Add logging to track stage transitions and why they happened
4. Create test conversations to validate flow
5. Update suggested replies to be more AI-question aware

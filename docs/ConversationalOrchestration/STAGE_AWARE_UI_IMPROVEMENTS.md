# Stage-Aware UI Improvements

## Overview

This document describes the visual UX improvements implemented to enhance the stage-based conversational orchestration system in the Recovery Companion app.

## What's New

### 1. Stage Progress Indicator

**Component:** `components/stage-progress-indicator.tsx`

A horizontal progress bar showing the user's journey through the 6 conversation stages:

- **Visual Elements:**
  - Animated dots representing each stage
  - Current stage highlighted with color-coded glow effect
  - Completed stages shown with checkmarks
  - Smooth transitions between stages
  - Stage name labels below each dot
  - Current stage description text

- **Animation Features:**
  - Pulsing glow animation on active stage
  - Scale animation when transitioning
  - Progressive fill of connecting lines
  - Staggered fade-in effects

### 2. Dynamic Header Subtitle

**Modified:** `components/chat-interface-ai.tsx:161-186`

The header now adapts to the current conversation stage:

- **Dynamic Subtitle:** Changes based on stage context
  - `greeting`: "Let's start your day together"
  - `check_in`: "How are you feeling today?"
  - `journal_prompt`: "Time to reflect on your journey"
  - `affirmation`: "Celebrating your progress"
  - `reflection`: "Looking at how far you've come"
  - `milestone_review`: "Your achievements matter"

- **Animated Icon:** Header icon color and glow dynamically match current stage color

### 3. Smart Icon Glow States

**Modified:** `components/chat-interface-ai.tsx:188-267`

Navigation icons now provide visual feedback about the current stage:

- **Active State Indicators:**
  - Check-in icon glows during `check_in` stage (teal #14B8A6)
  - Journal icon glows during `journal_prompt` stage (amber #F59E0B)
  - Garden icon glows during `milestone_review` stage (rose #F43F5E)

- **Visual Effects:**
  - Pulsing animation on active icons
  - Ring border with matching color
  - Subtle shadow glow effect
  - Smooth transition animations

### 4. Enhanced Suggested Replies

**Modified:** `components/chat-interface-ai.tsx:350-378`

Suggested replies now feature contextual icons and dynamic colors:

- **Emoji Icons:** Automatically added based on reply content
  - 😌 Mood/feeling responses
  - 💤 Sleep responses
  - ⚡ Energy responses
  - 🎯 Intention/goal responses
  - ✍️ Journal prompts
  - 🙏 Gratitude responses
  - 🌱 Progress/milestone responses
  - 💚 Thank you responses

- **Dynamic Colors:** Border and hover colors match reply intent
  - Green borders for affirmative replies
  - Blue borders for informational queries
  - Violet borders for reflective responses
  - Gray borders for skip/defer options

- **Animations:**
  - Staggered fade-in effect (50ms delay between each)
  - Scale on hover
  - Smooth color transitions

### 5. Stage UI Configuration System

**New File:** `lib/stage-ui-config.ts`

Centralized configuration for all stage-related UI elements:

```typescript
export interface StageConfig {
  name: string           // Display name
  color: string          // Primary color (hex)
  subtitle: string       // Dynamic header text
  icon: LucideIcon       // Icon component
  gradient: string       // Tailwind gradient class
  description: string    // Stage description
}
```

**Utility Functions:**
- `getStageConfig(stage)` - Get configuration for a stage
- `getStageIndex(stage)` - Get 0-based index
- `getStageProgress(stage)` - Get progress percentage
- `isIconActiveForStage(icon, stage)` - Check if navigation icon should glow
- `getSuggestedReplyIcon(text)` - Get emoji for reply text
- `getSuggestedReplyColor(text, type)` - Get color class for reply

## Color Palette by Stage

| Stage | Color | Hex | Theme |
|-------|-------|-----|-------|
| Greeting | Blue | `#3B82F6` | Welcoming |
| Check-In | Teal | `#14B8A6` | Present |
| Journal | Amber | `#F59E0B` | Reflective |
| Affirmation | Emerald | `#10B981` | Positive |
| Reflection | Violet | `#8B5CF6` | Thoughtful |
| Milestone Review | Rose | `#F43F5E` | Celebratory |

## Dependencies Added

- `framer-motion@^12.23.24` - For smooth animations and transitions

## User Experience Improvements

### Before
- Users had no visual indication of conversation progress
- Navigation icons were static and disconnected from flow
- Suggested replies lacked visual hierarchy
- No contextual feedback about current stage

### After
- Clear visual progress through 6-stage journey
- Active stage highlighted with color-coded indicators
- Navigation icons pulse when their related stage is active
- Suggested replies include helpful emoji icons
- Dynamic header subtitle provides context
- Smooth animations guide user attention
- Color-coded system helps users recognize patterns

## Technical Implementation

### Animation Strategy
- Used `framer-motion` for declarative animations
- CSS transitions for hover states
- Staggered animations for list items
- `animate-pulse` for active state indicators

### Performance Considerations
- Animations use GPU-accelerated properties (transform, opacity)
- Conditional rendering prevents unnecessary re-renders
- Memoized stage config lookups
- Inline styles only for dynamic values

### Accessibility
- ARIA labels maintained on all interactive elements
- Color is not the only indicator (text labels, icons, checkmarks)
- Animations respect `prefers-reduced-motion` (via Tailwind)
- Keyboard navigation fully supported

## Testing Checklist

- [x] Stage progress indicator displays correctly on all stages
- [x] Header subtitle updates when stage changes
- [x] Icons glow appropriately for active stages
- [x] Suggested replies show correct emojis
- [x] Suggested replies show correct colors
- [x] Animations are smooth and not janky
- [ ] Test on mobile viewport (responsive)
- [ ] Test with dark mode
- [ ] Test stage transitions in live conversation
- [ ] Verify accessibility with screen reader

## Future Enhancements

1. **Mobile Optimization**
   - Collapse progress indicator to compact pill on small screens
   - Bottom sheet for full stage map
   - Touch-optimized icon sizes

2. **Advanced Animations**
   - Confetti effect when completing important stages
   - Particle effects for milestone unlocks
   - Smooth page transitions between views

3. **User Customization**
   - Toggle stage progress visibility
   - Choose color theme preferences
   - Adjust animation speed

4. **Analytics Integration**
   - Track which stages users engage with most
   - Measure average time per stage
   - Identify drop-off points

## Files Modified

- ✅ `components/chat-interface-ai.tsx` - Main chat UI with stage awareness
- ✅ `components/stage-progress-indicator.tsx` - New progress component
- ✅ `lib/stage-ui-config.ts` - New configuration utility
- ✅ `package.json` - Added framer-motion dependency

## Related Documentation

- [Stage-Aware Implementation](./STAGE_AWARE_IMPLEMENTATION.md)
- [Suggested Replies Feature](./SUGGESTED_REPLIES_FEATURE.md)
- [Flow Orchestration](../../lib/flow.ts)

---

**Date:** 2025-10-16
**Author:** Claude Code

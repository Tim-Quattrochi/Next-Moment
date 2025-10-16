# Suggested Replies UI Implementation

## Overview

The chat interface now displays suggested replies as clickable buttons below the chat messages. Users can click these buttons to quickly send pre-defined responses that match the current conversation stage.

## How It Works

### 1. Visual Design

Suggested replies appear as **pill-shaped buttons** above the message input:

```
[Yes, let's check in]  [Tell me more about how this works]  [I'm ready to start]
┌─────────────────────────────────────────────────────────────┐
│ Share what's on your mind...                      [Send] │
└─────────────────────────────────────────────────────────────┘
```

### 2. Button Styles

- **Quick replies**: Smaller padding (px-4 py-2)
- **Detailed replies**: Slightly larger padding (px-5 py-2.5)
- **Hover effect**: Scale up, blue border, blue background tint
- **Rounded-full**: Pill-shaped appearance
- **Hidden when loading**: Buttons disappear while AI is responding

### 3. Current Implementation

The implementation in [components/chat-interface-ai.tsx](../components/chat-interface-ai.tsx) uses a **simple client-side approach**:

```typescript
// Suggested replies update based on message count
useEffect(() => {
  if (messages.length === 0) {
    // Greeting stage
    setSuggestedReplies([...])
  } else if (messages.length <= 3) {
    // Check-in stage
    setSuggestedReplies([...])
  } else if (messages.length <= 6) {
    // Journal prompt stage
    setSuggestedReplies([...])
  } else {
    // Affirmation / reflection stage
    setSuggestedReplies([...])
  }
}, [messages.length])
```

### 4. Click Handler

When a user clicks a suggested reply:

```typescript
const handleSuggestedReplyClick = (replyText: string) => {
  if (isLoading) return // Prevent clicks while AI is responding

  // Send the suggested reply as a message
  sendMessage({
    role: "user",
    parts: [{ type: "text", text: replyText }],
  })
}
```

The message is sent exactly as if the user typed it manually.

## Upgrading to Server-Side Suggested Replies

The current implementation uses **client-side logic** based on message count. To upgrade to **server-side suggested replies** from the API:

### Option 1: Custom Fetch Wrapper (Recommended)

Create a custom hook that wraps `useChat` and extracts headers:

```typescript
// hooks/use-chat-with-suggestions.ts
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'

export function useChatWithSuggestions() {
  const [suggestedReplies, setSuggestedReplies] = useState([])
  const [currentStage, setCurrentStage] = useState('')

  // Override the fetch to intercept response headers
  const chatHelpers = useChat({
    // Custom implementation here
  })

  return {
    ...chatHelpers,
    suggestedReplies,
    currentStage,
  }
}
```

### Option 2: Parallel API Call

After each message completes, fetch the current conversation state:

```typescript
useEffect(() => {
  const fetchSuggestions = async () => {
    if (messages.length === 0) return

    try {
      const response = await fetch('/api/conversations/current')
      const data = await response.json()

      setSuggestedReplies(data.suggestedReplies)
      setCurrentStage(data.stage)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  fetchSuggestions()
}, [messages])
```

This requires creating a new endpoint: `GET /api/conversations/current`

### Option 3: WebSocket or Server-Sent Events

For real-time updates, establish a persistent connection:

```typescript
useEffect(() => {
  const eventSource = new EventSource('/api/chat/stream')

  eventSource.addEventListener('suggestions', (event) => {
    const data = JSON.parse(event.data)
    setSuggestedReplies(data.replies)
  })

  return () => eventSource.close()
}, [])
```

## Styling Customization

### Current Styles

```typescript
className={cn(
  "rounded-full border-border/50 bg-background/50 text-sm transition-all hover:scale-105 hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]",
  reply.type === "quick" && "px-4 py-2",
  reply.type === "detailed" && "px-5 py-2.5"
)}
```

### Custom Theme

To change colors or styling:

```typescript
// Different color per stage
const getReplyButtonStyle = (stage: string) => {
  switch (stage) {
    case 'greeting':
      return 'hover:border-purple-500 hover:bg-purple-500/10'
    case 'check_in':
      return 'hover:border-blue-500 hover:bg-blue-500/10'
    case 'journal_prompt':
      return 'hover:border-amber-500 hover:bg-amber-500/10'
    // ...etc
  }
}
```

### Animation

Add entrance animation:

```typescript
<div className="mb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
  {suggestedReplies.map((reply, index) => (
    <Button
      key={index}
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-in fade-in slide-in-from-bottom-1"
      // ...
    >
```

## Accessibility

The implementation includes:

- ✅ Semantic button elements
- ✅ Keyboard navigation (tab between buttons)
- ✅ Focus states (default browser behavior)
- ✅ Screen reader support (button text is descriptive)

### Improvements

Consider adding:

```typescript
<Button
  aria-label={`Quick reply: ${reply.text}`}
  role="button"
  tabIndex={isLoading ? -1 : 0}
>
```

## Mobile Responsiveness

Current implementation:
- Uses `flex-wrap` so buttons wrap on small screens
- Buttons are touch-friendly (minimum 44px height)

### Enhancements

For better mobile UX:

```typescript
<div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
  {/* Horizontal scroll on mobile, wrap on desktop */}
</div>
```

## User Experience Tips

### 1. Show/Hide Logic

```typescript
// Only show after AI responds
{suggestedReplies.length > 0 && !isLoading && lastMessage?.role === 'assistant' && (
  <div className="mb-4 flex flex-wrap gap-2">
```

### 2. Maximum Replies

Limit to 3-4 suggestions to avoid overwhelming users:

```typescript
{suggestedReplies.slice(0, 4).map((reply, index) => (
```

### 3. Skip Button

Add a "Skip" or "Let me type" option:

```typescript
<Button
  variant="ghost"
  onClick={() => {
    setSuggestedReplies([])
    inputRef.current?.focus()
  }}
>
  Type my own response
</Button>
```

## Testing

### Manual Testing Checklist

- [ ] Suggested replies appear after greeting
- [ ] Clicking a reply sends it as a message
- [ ] Replies update as conversation progresses
- [ ] Buttons are hidden while AI is responding
- [ ] Buttons wrap properly on mobile
- [ ] Keyboard navigation works
- [ ] Hover effects are smooth

### Automated Testing

```typescript
// Example Jest test
describe('ChatInterface', () => {
  it('should send message when suggested reply is clicked', () => {
    const { getByText } = render(<ChatInterface />)
    const button = getByText("Yes, let's check in")

    fireEvent.click(button)

    expect(mockSendMessage).toHaveBeenCalledWith({
      role: 'user',
      parts: [{ type: 'text', text: "Yes, let's check in" }],
    })
  })
})
```

## Future Enhancements

- [ ] Fetch suggested replies from API response headers
- [ ] Personalize suggestions based on user history
- [ ] Add emoji icons to replies
- [ ] Animate reply transitions
- [ ] Support voice input for replies
- [ ] Allow users to hide/show suggestions in settings
- [ ] Track which suggestions are most used (analytics)

---

**Last Updated**: 2025-10-16
**Component**: [components/chat-interface-ai.tsx](../components/chat-interface-ai.tsx)

# AI Integration Guide - Gemini with Vercel AI SDK

This guide explains how the Recovery Companion uses Google's Gemini AI for intelligent, empathetic responses.

## Architecture Overview

### Technology Stack
- **Vercel AI SDK**: Handles streaming responses and React hooks
- **Google Generative AI**: Powers the AI responses via Gemini 1.5 Flash
- **Next.js API Routes**: Server-side AI integration with database persistence

### Flow Diagram
```
User Input → ChatInterface (useChat hook) → /api/chat → Gemini API
                                                ↓
                                          Stream Response
                                                ↓
                                        Save to Database
                                                ↓
                                    Display in Real-time to User
```

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Add Environment Variable

Add to your `.env.local` file:
```bash
GOOGLE_API_KEY=your_api_key_here
```

### 3. Verify Installation

The following packages are already installed:
```json
{
  "ai": "^5.0.74",
  "@google/generative-ai": "latest"
}
```

### 4. Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/app` (protected route)
3. Send a message in the chat interface
4. You should see:
   - Typing indicator while AI generates response
   - Streaming text appearing in real-time
   - Response saved to database automatically

## API Route: `/api/chat`

### Location
[app/api/chat/route.ts](../app/api/chat/route.ts)

### Features
- **User Authentication**: Validates user via Stack Auth
- **Conversation Management**: Creates/updates conversations in database
- **Message Persistence**: Saves both user and AI messages
- **Streaming Responses**: Real-time text generation
- **Recovery-Focused System Prompt**: Guides AI to provide empathetic, supportive responses

### System Prompt

The AI is configured with a comprehensive system prompt that:
- Provides empathetic, non-judgmental support
- Encourages healthy coping mechanisms
- Celebrates progress
- Offers gentle guidance
- Helps identify triggers
- Promotes mindfulness and self-compassion
- Recognizes crisis situations and encourages professional help

### Request Format
```typescript
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "I'm struggling today..." }
  ],
  "conversationId": 123 // optional
}
```

### Response
- Streams text in real-time using `StreamingTextResponse`
- Returns `X-Conversation-Id` header for conversation tracking
- Auto-saves to database on completion

## Chat Interface Component

### Location
[components/chat-interface-ai.tsx](../components/chat-interface-ai.tsx)

### Key Features

#### 1. **useChat Hook**
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/chat",
  body: { userId: user?.id },
  onError: (error) => console.error("Chat error:", error)
})
```

Benefits:
- Automatic message state management
- Built-in loading states
- Optimistic updates
- Error handling
- Streaming support

#### 2. **Real-time Streaming**
- Text appears character-by-character as Gemini generates it
- Typing indicator shows while processing
- Smooth scrolling to latest message

#### 3. **Empty State**
Shows welcome message when no messages exist

#### 4. **Responsive Design**
- Mobile-friendly chat bubbles
- Gradient styling for visual appeal
- Accessible with ARIA labels

## Database Integration

### Message Storage
```sql
-- User message saved immediately
INSERT INTO messages (conversation_id, role, content)
VALUES (123, 'user', 'I need help...')

-- AI response saved after streaming completes
INSERT INTO messages (conversation_id, role, content)
VALUES (123, 'assistant', 'I hear you. Let me help...')
```

### Conversation Tracking
- Creates new conversation if `conversationId` not provided
- Updates `updated_at` timestamp on each message
- Maintains conversation history for context

## Model Configuration

### Current Model: `gemini-1.5-flash`

**Why Gemini 1.5 Flash?**
- **Fast**: Low latency for real-time responses
- **Cost-effective**: Optimized pricing for high-volume use
- **Capable**: Handles complex conversational context
- **Long context**: Supports extended conversation history

### Alternative Models
You can switch models in [app/api/chat/route.ts](../app/api/chat/route.ts:95):

```typescript
// Current (fast, cost-effective)
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// More powerful (higher quality, slower, more expensive)
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
```

## Error Handling

### Common Issues

#### 1. Missing API Key
```
Error: GoogleGenerativeAI requires an API key
```
**Solution**: Add `GOOGLE_API_KEY` to `.env.local`

#### 2. Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution**: Implement rate limiting or upgrade Gemini API quota

#### 3. Authentication Errors
```
Error: 401 Unauthorized
```
**Solution**: Verify Stack Auth session is valid

#### 4. Module Import Errors
```
Error: Cannot find module 'ai/react'
```
**Solution**:
```bash
npm install ai @google/generative-ai --legacy-peer-deps
```

## Security Considerations

### 1. **API Key Protection**
- Never commit `.env.local` to version control
- API key is server-side only (not exposed to client)
- Validate all requests with Stack Auth

### 2. **Content Filtering**
Gemini has built-in safety filters for:
- Hate speech
- Sexually explicit content
- Dangerous content
- Harassment

### 3. **User Privacy**
- Messages stored in your private PostgreSQL database
- No data shared with third parties beyond Gemini API
- User conversations are isolated by `user_id`

## Performance Optimization

### 1. **Streaming**
- Reduces perceived latency
- Shows progress immediately
- Better UX than waiting for complete response

### 2. **Conversation History**
- Maintains context across messages
- Only sends relevant history to API
- Limits token usage

### 3. **Database Efficiency**
- Indexed on `conversation_id` and `user_id`
- Async saves don't block streaming
- Updated timestamps for chronological sorting

## Monitoring & Debugging

### Server Logs
Check terminal for API errors:
```bash
console.error("Error in chat route:", error)
```

### Client Logs
Check browser console for chat errors:
```bash
onError: (error) => console.error("Chat error:", error)
```

### Database Verification
Query messages to verify persistence:
```sql
SELECT * FROM messages WHERE conversation_id = X ORDER BY created_at DESC;
```

## Future Enhancements

### 1. **Context-Aware Responses**
- Include recent check-ins in AI context
- Reference journal entries for personalized support
- Suggest milestones based on conversation

### 2. **Advanced Features**
- Multi-modal support (images, voice)
- Function calling for actions (e.g., "Create a check-in")
- Sentiment analysis for mood tracking

### 3. **Fine-tuning**
- Custom model training on recovery-specific data
- Personalized responses based on user history
- Domain-specific knowledge integration

## Cost Estimation

### Gemini 1.5 Flash Pricing (as of 2025)
- **Input**: ~$0.075 per 1M tokens
- **Output**: ~$0.30 per 1M tokens

### Example Monthly Cost
Assuming 1,000 active users, 10 messages/day, 100 tokens/message:
- Monthly tokens: ~300M
- Estimated cost: ~$25-50/month

���� **Tip**: Monitor usage in [Google Cloud Console](https://console.cloud.google.com/)

## Support & Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Troubleshooting Checklist

- [ ] `GOOGLE_API_KEY` set in `.env.local`
- [ ] Packages installed: `ai`, `@google/generative-ai`
- [ ] Development server running on port 3000
- [ ] User authenticated via Stack Auth
- [ ] Database connection active
- [ ] Browser console shows no errors
- [ ] Server terminal shows no errors

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
**Author**: Recovery Companion Team

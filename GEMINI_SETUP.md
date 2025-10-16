# Quick Setup: Gemini AI Integration

## 🚀 Get Started in 3 Steps

### 1. Get Your API Key
Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key (free tier available).

### 2. Add to Environment
```bash
# Add to .env.local
GOOGLE_API_KEY=your_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

That's it! The AI chat is now powered by Google Gemini 1.5 Flash.

## ✅ Verify It Works

1. Navigate to `http://localhost:3000/app`
2. Send a message like "I'm feeling anxious today"
3. Watch the AI response stream in real-time
4. Check your database - both messages should be saved

## 📖 Full Documentation

See [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) for complete details.

## 🔧 What Changed?

### New Files
- [app/api/chat/route.ts](app/api/chat/route.ts) - Streaming AI endpoint
- [components/chat-interface-ai.tsx](components/chat-interface-ai.tsx) - Updated chat UI
- [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) - Full documentation

### Updated Files
- [components/recovery-companion.tsx](components/recovery-companion.tsx) - Now imports AI-powered chat
- [.env.example](.env.example) - Added `GOOGLE_API_KEY`
- [package.json](package.json) - Added `ai` and `@google/generative-ai`

### Old Files (Deprecated)
- [components/chat-interface.tsx](components/chat-interface.tsx) - Old hardcoded responses (kept for reference)
- [app/api/messages/route.ts](app/api/messages/route.ts) - Old message API (still used for fetching history)

## 🎯 Key Features

✅ **Real-time Streaming** - Responses appear as they're generated
✅ **Recovery-Focused** - System prompt tuned for empathetic support
✅ **Database Persistence** - All conversations saved automatically
✅ **User Authentication** - Secure, user-specific conversations
✅ **Context Awareness** - Maintains conversation history
✅ **Error Handling** - Graceful fallbacks for API issues

## 💰 Cost

Gemini 1.5 Flash is **extremely affordable**:
- Free tier: 15 requests/minute, 1,500 requests/day
- Paid tier: ~$0.075 per 1M input tokens
- Average message: ~100 tokens = $0.000075 per message

For a small-medium app: **< $50/month**

## 🛠️ Troubleshooting

### "Cannot find module 'ai/react'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "GoogleGenerativeAI requires an API key"
Add `GOOGLE_API_KEY` to `.env.local` and restart the dev server.

### AI responses not saving to database
Check server logs for database connection errors. Verify `DATABASE_URL` is set.

## 🔐 Security Notes

- API key is **server-side only** (never exposed to browser)
- All requests validated via Stack Auth
- Gemini has built-in content safety filters
- User conversations isolated by `user_id`

## 📚 Next Steps

1. **Customize the system prompt** in [app/api/chat/route.ts](app/api/chat/route.ts:46-65)
2. **Add check-in context** to AI responses for personalization
3. **Implement crisis detection** with function calling
4. **Track AI insights** in journal entries

---

**Questions?** Check [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) or open an issue.

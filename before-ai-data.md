Data Source: Database-Driven, Not Hardcoded
All user data is stored in a PostgreSQL database via Neon (serverless). The only hardcoded elements are:
Demo/seed data for initial user experience (in scripts/002_seed_initial_data.sql)
Writing prompts in the journal interface
Static AI suggestions (placeholder for real AI integration)
How the Interactions Work
1. Check-Ins (app/api/check-ins/route.ts)
Flow:
User completes 4-step form in MorningCheckIn component
Mood selection (5 options: peaceful, hopeful, grateful, struggling, uncertain)
Sleep quality (1-5 scale)
Energy level (1-5 scale)
Daily intention
Submits to POST /api/check-ins
API validates user authentication via Stack Auth
Inserts into check_ins table with user_id, mood, sleep_quality, energy_level, intentions, timestamp
Returns saved check-in
Database:
check_ins: id, user_id, mood, sleep_quality, energy_level, intentions, created_at
2. Journal Entries (app/api/journal/route.ts)
Flow:
User types in JournalInterface textarea
Frontend auto-calculates word count in real-time
After 50 characters, static AI suggestion appears (placeholder)
User clicks Save → POST /api/journal
API stores: title (optional), content, word_count, ai_insights (JSON)
Fetches updated entries for sidebar preview (shows 3 most recent)
Features:
6 pre-written prompts available
Recent entries sidebar
Word counter
Can update existing entries via PATCH /api/journal
Database:
journal_entries: id, user_id, title, content, word_count, ai_insights (JSONB), created_at, updated_at
3. Messages (app/api/messages/route.ts)
Flow:
User types message in ChatInterface
Sends POST /api/messages with role="user", content, conversationId
API stores user message
Frontend auto-generates assistant response after 1.5s delay (simulated)
Sends another POST with role="assistant"
Both messages displayed chronologically
Uses SWR for automatic data refresh
Special Logic:
First message from new user triggers user sync to neon_auth.users_sync table
Messages grouped by conversation_id
3 demo conversations seeded: "Welcome", "Coping with Triggers", "Building Healthy Routines"
Database:
conversations: id, user_id, title, created_at, updated_at
messages: id, conversation_id, role (user/assistant), content, created_at
4. Milestones (app/api/milestones/route.ts)
Flow:
Milestones typically created programmatically (5 seeded per user)
Progress updated via PATCH /api/milestones (triggered by check-ins/journal activity)
When progress reaches 100%, sets unlocked=true and unlocked_at timestamp
ProgressGarden component fetches and visualizes as plants
Visualization:
Each milestone = 1 plant with 5 growth stages
Color-coded by type: mindfulness (blue), gratitude (orange), strength/hope (green)
Progress bar under each plant
Achievement badges (4 types: First Step, Week Warrior, Reflection Master, Growth Champion)
Database:
milestones: id, user_id, type, name, description, progress (0-100), unlocked (bool), unlocked_at, created_at
Data Relationships
User (Stack Auth)
  ├── Check-Ins (1:many) → contributes to milestone progress
  ├── Journal Entries (1:many) → contributes to "Reflection Master" achievement
  ├── Conversations (1:many)
  │   └── Messages (1:many per conversation)
  └── Milestones (1:many) → 5 types tracked
Key Architecture Points
Component	Technology	Purpose
Database	Neon (PostgreSQL)	Persistent storage, supports JSONB for ai_insights
Auth	Stack Auth	User authentication & session management
State	React Hooks + SWR	Client-side state + automatic data revalidation
Routing	Client-side state	Single-page app within /app route
APIs	Next.js API Routes	Server-side validation, database access
Current Limitations (Hardcoded Elements)
AI Responses: Assistant messages are simulated with 1.5s delay (not real AI)
AI Insights: Static suggestion "Consider exploring this feeling further" (placeholder)
Achievement Logic: Achievement badges use hardcoded conditions, not auto-triggered
Progress Updates: Milestone progress manually updated, not auto-calculated from check-ins
Demo Data: Seed data for demo user b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54
Summary
Your Recovery Companion is a fully database-driven application. All user data (check-ins, journals, messages, milestones) flows through authenticated REST APIs and persists in PostgreSQL. The only hardcoded parts are placeholders for future AI integration and demo seed data for testing. Would you like me to help implement any of these features, such as:
Real AI integration for insights/responses
Auto-triggering achievement logic
Automatic milestone progress calculation from check-ins
Or explore any specific component in more detail?
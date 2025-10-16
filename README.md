# Recovery Companion App

A Next.js 15 + TypeScript wellness application with a premium "Wellness Luxury" aesthetic, featuring AI-powered chat, morning check-ins, progress tracking, and journaling.

## Features

- **Chat Interface**: Full-screen chat with glassmorphism message bubbles and AI support
- **Morning Check-in**: Progressive check-in flow with visual mood selector
- **Progress Garden**: Interactive growth visualization with animated plants representing milestones
- **Journaling**: Integrated journaling with real-time AI suggestions and writing prompts
- **Crisis Support**: Always-accessible floating crisis button
- **Authentication**: Secure user authentication with Stack Auth via Neon

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Database**: Neon PostgreSQL
- **Authentication**: Stack Auth (Neon Auth)
- **Data Fetching**: SWR for client-side caching
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Database Setup

The app uses Neon PostgreSQL for data persistence. Run the SQL scripts in order:

1. `scripts/001_create_tables.sql` - Creates all necessary tables
2. `scripts/002_seed_initial_data.sql` - Seeds initial demo data

## Authentication

The app uses Stack Auth integrated with Neon for user authentication. All data is scoped to authenticated users:

- Users must sign in to access the app
- Each user has their own isolated data (messages, check-ins, milestones, journal entries)
- User data is automatically synced to `neon_auth.users_sync` table
- Authentication routes are handled at `/handler/sign-in`, `/handler/sign-up`, etc.

## Environment Variables

Required environment variables (automatically configured with Neon integration):

- `DATABASE_URL` - Neon database connection string
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth client key
- `STACK_SECRET_SERVER_KEY` - Stack Auth server key

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000)

4. Sign up for a new account or sign in

## Design System

### Colors
- **Primary Blue**: #3B82F6, #1E3A8A
- **Success Green**: #10B981, #059669
- **Accent Gold**: #F59E0B
- **Crisis Purple**: #8B5CF6

### Typography
- **Font**: Inter
- **Body Size**: 18px
- **Line Height**: 1.5-1.6 (leading-relaxed)

### Accessibility
- WCAG AA compliant
- Motion-reduction support via `prefers-reduced-motion`
- Semantic HTML with proper ARIA labels
- Screen reader optimized

## API Routes

All API routes require authentication via Stack Auth:

- `GET/POST /api/messages` - Chat messages (user-scoped)
- `GET/POST /api/check-ins` - Morning check-ins (user-scoped)
- `GET/POST/PATCH /api/milestones` - Progress tracking (user-scoped)
- `GET/POST/PATCH /api/journal` - Journal entries (user-scoped)

## User Features

- **Personalized Experience**: User's name displayed throughout the app
- **Data Privacy**: All user data is isolated and secure
- **Progress Tracking**: Individual milestone tracking per user
- **Journal History**: Personal journal entries with AI insights
- **Check-in History**: Track mood and wellness over time

## License

MIT

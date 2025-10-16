Routing Flow
Landing Page (/) → Users see the Hero component with the landing page
"Get Started Free" Button → Redirects to /handler/sign-in (Stack Auth)
After Authentication → Users are redirected to /app (RecoveryCompanion)
Changes Made
app/page.tsx - Now displays the Hero landing page component (public route)
app/(protected)/app/page.tsx - New protected route that checks authentication and displays RecoveryCompanion
components/hero.tsx:76 - Updated "Get Started Free" button to link to /handler/sign-in
stack.ts:8 - Updated Stack Auth configuration to redirect to /app after successful sign-in
How It Works
Unauthenticated users visiting / see the landing page
Clicking "Get Started Free" takes them to Stack Auth sign-in
After signing in, they're automatically redirected to /app where RecoveryCompanion lives
If unauthenticated users try to access /app directly, they're redirected back to sign-in
After signing out, users return to the landing page
The dev server is already running on port 3000, so you can test this flow immediately at http://localhost:3000!
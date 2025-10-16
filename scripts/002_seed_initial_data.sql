-- ============================================
-- DEMO USER SEED DATA
-- ============================================
-- IMPORTANT: Create the demo user in Stack Auth first!
-- 1. Go to https://app.stack-auth.com and create user: demo@example.com
-- 2. Get the user ID assigned by Stack Auth
-- 3. Replace 'demo-user-123' below with the actual Stack Auth user ID
-- 4. Then run this seed script

-- First, ensure the demo user exists in users_sync table
-- Note: This INSERT may not be needed if Stack Auth auto-syncs users,
-- but it's included for completeness
INSERT INTO neon_auth.users_sync (raw_json)
VALUES ('{"id": "b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54", "display_name": "Demo User", "primary_email": "demo@example.com", "signed_up_at_millis": 1734042984694}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed milestones for demo user (varied progress levels)
INSERT INTO milestones (user_id, type, name, description, progress, unlocked, unlocked_at)
VALUES
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'mindfulness', 'Mindfulness Bloom', '7 days of daily check-ins', 85, false, NULL),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'gratitude', 'Gratitude Garden', '5 journal entries', 100, true, NOW() - INTERVAL '3 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'strength', 'Strength Sprout', '14 days active', 60, false, NULL),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'hope', 'Hope Blossom', 'Started your journey', 100, true, NOW() - INTERVAL '7 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'resilience', 'Resilience Tree', '30 days active', 35, false, NULL)
ON CONFLICT DO NOTHING;

-- Seed journal entries for demo user
INSERT INTO journal_entries (user_id, title, content, word_count, created_at, updated_at)
VALUES
  (
    'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54',
    'My First Steps',
    'Today marks the beginning of my recovery journey. I feel both nervous and hopeful. I know this won''t be easy, but I''m committed to making positive changes in my life. I''m grateful for this opportunity to heal and grow.',
    42,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54',
    'Gratitude Practice',
    'Three things I''m grateful for today: 1) The support of my family, 2) A beautiful sunrise I witnessed this morning, 3) The strength I found to say no to temptation. Taking time to appreciate these small moments helps me stay grounded.',
    38,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54',
    'Challenging Day',
    'Today was hard. I felt triggered by old patterns and habits. But instead of giving in, I reached out to my support network and practiced the coping strategies I''ve learned. I''m proud of myself for choosing differently.',
    35,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54',
    'Reflections on Growth',
    'Looking back at where I started, I can see how much I''ve grown. The journey isn''t linear, and that''s okay. Each day I''m learning more about myself and building resilience. I''m discovering new hobbies and reconnecting with parts of myself I had forgotten.',
    45,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54',
    'Setting Intentions',
    'This week, I want to focus on self-compassion. I tend to be too hard on myself when I make mistakes. I''m learning that healing includes being kind to myself, celebrating small wins, and understanding that recovery is a process, not a destination.',
    41,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  )
ON CONFLICT DO NOTHING;

-- Seed check-ins for demo user (varied moods and patterns)
INSERT INTO check_ins (user_id, mood, sleep_quality, energy_level, intentions, created_at)
VALUES
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'hopeful', 4, 3, 'Focus on gratitude and attend support group', NOW() - INTERVAL '7 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'calm', 3, 4, 'Practice mindfulness meditation for 10 minutes', NOW() - INTERVAL '6 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'anxious', 2, 2, 'Use breathing exercises when feeling overwhelmed', NOW() - INTERVAL '5 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'grateful', 4, 4, 'Write in journal and connect with a friend', NOW() - INTERVAL '4 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'determined', 5, 4, 'Stay committed to my daily routine', NOW() - INTERVAL '3 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'peaceful', 4, 3, 'Spend time in nature and practice self-care', NOW() - INTERVAL '2 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'reflective', 3, 3, 'Review my progress and set new goals', NOW() - INTERVAL '1 day'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'hopeful', 4, 4, 'Continue building healthy habits', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- Seed multiple conversations for demo user
INSERT INTO conversations (user_id, title, created_at)
VALUES
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'Welcome to Recovery Companion', NOW() - INTERVAL '7 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'Coping with Triggers', NOW() - INTERVAL '5 days'),
  ('b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54', 'Building Healthy Routines', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Seed messages for demo user conversations
DO $$
DECLARE
  conv_id_1 INTEGER;
  conv_id_2 INTEGER;
  conv_id_3 INTEGER;
BEGIN
  -- Get conversation IDs
  SELECT id INTO conv_id_1 FROM conversations
  WHERE user_id = 'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54' AND title = 'Welcome to Recovery Companion' LIMIT 1;

  SELECT id INTO conv_id_2 FROM conversations
  WHERE user_id = 'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54' AND title = 'Coping with Triggers' LIMIT 1;

  SELECT id INTO conv_id_3 FROM conversations
  WHERE user_id = 'b08d13c3-695a-4bdd-9e7e-e5edfb7f6e54' AND title = 'Building Healthy Routines' LIMIT 1;

  -- Conversation 1: Welcome conversation
  IF conv_id_1 IS NOT NULL THEN
    INSERT INTO messages (conversation_id, role, content, created_at)
    VALUES
      (conv_id_1, 'assistant', 'Hello! I''m here to support you on your recovery journey. How are you feeling today?', NOW() - INTERVAL '7 days'),
      (conv_id_1, 'user', 'I''m feeling nervous but hopeful. This is my first day.', NOW() - INTERVAL '7 days' + INTERVAL '2 minutes'),
      (conv_id_1, 'assistant', 'It''s completely normal to feel nervous at the beginning. The fact that you''re here shows incredible courage. What made you decide to start this journey today?', NOW() - INTERVAL '7 days' + INTERVAL '5 minutes'),
      (conv_id_1, 'user', 'I realized I needed to make a change. I want to be healthier and happier.', NOW() - INTERVAL '7 days' + INTERVAL '8 minutes'),
      (conv_id_1, 'assistant', 'That''s a beautiful and powerful realization. Taking that first step is often the hardest part. I''m here to support you every step of the way. Would you like to set some initial intentions for your recovery?', NOW() - INTERVAL '7 days' + INTERVAL '10 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Conversation 2: Coping with triggers
  IF conv_id_2 IS NOT NULL THEN
    INSERT INTO messages (conversation_id, role, content, created_at)
    VALUES
      (conv_id_2, 'user', 'I''m struggling today. I encountered some old triggers.', NOW() - INTERVAL '5 days'),
      (conv_id_2, 'assistant', 'Thank you for sharing that with me. Encountering triggers is a normal part of recovery. The important thing is that you''re reaching out instead of dealing with it alone. Can you tell me more about what happened?', NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),
      (conv_id_2, 'user', 'I ran into some old friends who don''t understand my journey. They were encouraging old behaviors.', NOW() - INTERVAL '5 days' + INTERVAL '4 minutes'),
      (conv_id_2, 'assistant', 'That must have been really challenging. Setting boundaries with people from your past can be one of the hardest parts of recovery. How did you handle the situation?', NOW() - INTERVAL '5 days' + INTERVAL '6 minutes'),
      (conv_id_2, 'user', 'I excused myself and left. I felt proud but also a bit sad.', NOW() - INTERVAL '5 days' + INTERVAL '9 minutes'),
      (conv_id_2, 'assistant', 'You should be incredibly proud of yourself! Choosing to leave was an act of self-care and shows real strength. It''s okay to feel sad about it too. That shows you''re processing these changes in a healthy way. What helped you make that choice?', NOW() - INTERVAL '5 days' + INTERVAL '11 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Conversation 3: Building healthy routines
  IF conv_id_3 IS NOT NULL THEN
    INSERT INTO messages (conversation_id, role, content, created_at)
    VALUES
      (conv_id_3, 'user', 'I want to establish better daily routines. Can you help me?', NOW() - INTERVAL '2 days'),
      (conv_id_3, 'assistant', 'Absolutely! Building healthy routines is a cornerstone of sustainable recovery. What areas of your daily life would you like to focus on first?', NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
      (conv_id_3, 'user', 'I think sleep and morning routines. I''ve been struggling with both.', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
      (conv_id_3, 'assistant', 'Those are excellent places to start. Quality sleep and a structured morning can set a positive tone for your entire day. Let''s start with sleep - what time do you typically try to go to bed, and what does your evening routine look like?', NOW() - INTERVAL '2 days' + INTERVAL '7 minutes')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- EXISTING USER SEED DATA
-- ============================================

-- Seed data for your specific user (e0200e3d-5b44-41a1-9173-838d9718a845)
-- First, ensure the user exists in users_sync table (if not already synced)
INSERT INTO neon_auth.users_sync (raw_json)
VALUES ('{"id": "e0200e3d-5b44-41a1-9173-838d9718a845", "display_name": "Recovery User", "primary_email": "user@example.com", "signed_up_at_millis": 1734042984694}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed initial milestones for your user
INSERT INTO milestones (user_id, type, name, description, progress, unlocked, unlocked_at)
VALUES
  ('e0200e3d-5b44-41a1-9173-838d9718a845', 'mindfulness', 'Mindfulness Bloom', '7 days of daily check-ins', 30, false, NULL),
  ('e0200e3d-5b44-41a1-9173-838d9718a845', 'gratitude', 'Gratitude Garden', '5 journal entries', 20, false, NULL),
  ('e0200e3d-5b44-41a1-9173-838d9718a845', 'strength', 'Strength Sprout', '14 days active', 10, false, NULL),
  ('e0200e3d-5b44-41a1-9173-838d9718a845', 'hope', 'Hope Blossom', 'Started your journey', 50, true, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Seed initial conversation with welcome message for your user
INSERT INTO conversations (user_id, title, created_at)
VALUES ('e0200e3d-5b44-41a1-9173-838d9718a845', 'Welcome to Recovery Companion', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Get the conversation ID and insert welcome message for your user
DO $$
DECLARE
  conv_id INTEGER;
BEGIN
  SELECT id INTO conv_id FROM conversations WHERE user_id = 'e0200e3d-5b44-41a1-9173-838d9718a845' ORDER BY created_at ASC LIMIT 1;

  IF conv_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, role, content, created_at)
    VALUES (
      conv_id,
      'assistant',
      'Welcome to your recovery journey! I''m here to support you every step of the way. How are you feeling today?',
      NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

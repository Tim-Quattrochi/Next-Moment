-- First, ensure the demo user exists in users_sync table
INSERT INTO neon_auth.users_sync (raw_json)
VALUES ('{"id": "demo-user-123", "display_name": "Demo User", "primary_email": "demo@example.com", "signed_up_at_millis": 1734042984694}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed initial milestones for demo user
INSERT INTO milestones (user_id, type, name, description, progress, unlocked, unlocked_at)
VALUES
  ('demo-user-123', 'mindfulness', 'Mindfulness Bloom', '7 days of daily check-ins', 60, false, NULL),
  ('demo-user-123', 'gratitude', 'Gratitude Garden', '5 journal entries', 40, false, NULL),
  ('demo-user-123', 'strength', 'Strength Sprout', '14 days active', 80, false, NULL),
  ('demo-user-123', 'hope', 'Hope Blossom', 'Started your journey', 20, true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Seed initial conversation with welcome message
INSERT INTO conversations (user_id, title, created_at)
VALUES ('demo-user-123', 'Welcome Conversation', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Get the conversation ID and insert welcome message
DO $$
DECLARE
  conv_id INTEGER;
BEGIN
  SELECT id INTO conv_id FROM conversations WHERE user_id = 'demo-user-123' ORDER BY created_at ASC LIMIT 1;

  IF conv_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, role, content, created_at)
    VALUES (
      conv_id,
      'assistant',
      'Hello, I''m here to support you on your recovery journey. How are you feeling today?',
      NOW() - INTERVAL '1 hour'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

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

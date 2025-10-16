-- Migration: Add greeting stage to conversations and update constraints
-- Created: 2025-10-16

-- Drop the existing check constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_stage_check;

-- Add the new check constraint with greeting stage
ALTER TABLE conversations
ADD CONSTRAINT conversations_stage_check
CHECK (stage IN ('greeting', 'check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

-- Update the default value to greeting for new conversations
ALTER TABLE conversations
ALTER COLUMN stage SET DEFAULT 'greeting';

-- Add comment to describe the updated column
COMMENT ON COLUMN conversations.stage IS 'Current stage in the guided recovery conversation flow (greeting -> check_in -> journal_prompt -> affirmation -> reflection -> milestone_review -> loop)';

-- Migration: Add stage column to conversations table for guided orchestration
-- Created: 2025-10-16

-- Add stage column with check constraint
ALTER TABLE conversations
ADD COLUMN stage TEXT DEFAULT 'check_in'
CHECK (stage IN ('check_in', 'journal_prompt', 'affirmation', 'reflection', 'milestone_review'));

-- Add comment to describe the column
COMMENT ON COLUMN conversations.stage IS 'Current stage in the guided recovery conversation flow';

-- Create index for stage queries
CREATE INDEX idx_conversations_stage ON conversations(stage);

-- Update existing conversations to start at check_in stage
UPDATE conversations SET stage = 'check_in' WHERE stage IS NULL;

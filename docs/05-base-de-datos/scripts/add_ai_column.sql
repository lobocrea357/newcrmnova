-- Add ai_analysis column to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb;

-- Comment
COMMENT ON COLUMN chats.ai_analysis IS 'Stores the latest AI analysis result for this chat';

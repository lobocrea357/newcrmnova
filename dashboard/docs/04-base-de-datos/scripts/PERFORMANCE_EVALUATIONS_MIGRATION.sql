-- ============================================
-- MIGRATION: Create performance_evaluations table
-- Purpose: Store individual conversation evaluations for performance analysis
-- Date: 2026-02-04
-- ============================================

-- Create performance_evaluations table
CREATE TABLE IF NOT EXISTS performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  performance_analysis_id UUID REFERENCES performance_analyses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  bot_id UUID REFERENCES bots(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  
  -- Evaluation Date
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evaluation Metrics (7 parameters)
  tiempo_contacto BOOLEAN DEFAULT FALSE,
  tiempo_respuesta BOOLEAN DEFAULT FALSE,
  tiempo_cotizacion BOOLEAN DEFAULT FALSE,
  cierre_intencion BOOLEAN DEFAULT FALSE,
  ofrecio_scalapay BOOLEAN DEFAULT FALSE,
  mas_dos_opciones BOOLEAN DEFAULT FALSE,
  seguimiento_intencion BOOLEAN DEFAULT FALSE,
  
  -- Scores
  score DECIMAL(3,1) DEFAULT 0.0,
  max_score INTEGER DEFAULT 7,
  percentage DECIMAL(5,2) DEFAULT 0.0,
  
  -- Metadata
  generated_by TEXT DEFAULT 'Manual', -- 'AI' or 'Manual'
  manually_edited BOOLEAN DEFAULT FALSE,
  evaluated_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- AI Feedback
  ai_feedback JSONB,
  
  -- Manager Notes
  manager_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_analysis_id 
  ON performance_evaluations(performance_analysis_id);

CREATE INDEX IF NOT EXISTS idx_performance_evaluations_bot_id 
  ON performance_evaluations(bot_id);

CREATE INDEX IF NOT EXISTS idx_performance_evaluations_worker_id 
  ON performance_evaluations(worker_id);

CREATE INDEX IF NOT EXISTS idx_performance_evaluations_chat_id 
  ON performance_evaluations(chat_id);

CREATE INDEX IF NOT EXISTS idx_performance_evaluations_evaluation_date 
  ON performance_evaluations(evaluation_date DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_performance_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_evaluations_updated_at
  BEFORE UPDATE ON performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_evaluations_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Policy: Allow authenticated users to read all evaluations
CREATE POLICY "Allow authenticated users to read evaluations"
  ON performance_evaluations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert evaluations
CREATE POLICY "Allow authenticated users to insert evaluations"
  ON performance_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update evaluations
CREATE POLICY "Allow authenticated users to update evaluations"
  ON performance_evaluations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete evaluations
CREATE POLICY "Allow authenticated users to delete evaluations"
  ON performance_evaluations
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access to evaluations"
  ON performance_evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE performance_evaluations IS 'Stores individual conversation evaluations for performance analysis';
COMMENT ON COLUMN performance_evaluations.tiempo_contacto IS 'Whether contact time was adequate (< 5 min)';
COMMENT ON COLUMN performance_evaluations.tiempo_respuesta IS 'Whether response time was fast (< 2 min)';
COMMENT ON COLUMN performance_evaluations.tiempo_cotizacion IS 'Whether quotation time was efficient (< 10 min)';
COMMENT ON COLUMN performance_evaluations.cierre_intencion IS 'Whether closing had purchase intention';
COMMENT ON COLUMN performance_evaluations.ofrecio_scalapay IS 'Whether Scalapay was offered';
COMMENT ON COLUMN performance_evaluations.mas_dos_opciones IS 'Whether more than two options were presented';
COMMENT ON COLUMN performance_evaluations.seguimiento_intencion IS 'Whether intention follow-up was done';
COMMENT ON COLUMN performance_evaluations.score IS 'Total score (sum of passed metrics)';
COMMENT ON COLUMN performance_evaluations.percentage IS 'Percentage score (score/max_score * 100)';
COMMENT ON COLUMN performance_evaluations.ai_feedback IS 'AI-generated feedback and analysis';

-- Verification query
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'performance_evaluations'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ performance_evaluations table created successfully!';
  RAISE NOTICE '📊 Indexes created for optimal query performance';
  RAISE NOTICE '🔒 RLS policies configured for secure access';
END $$;

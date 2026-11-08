-- Manual de ventas generado por ai-auditor (generate-manual.js) y leído por
-- dashboard /api/manual-ventas. No estaba en el esquema base de la migración.
CREATE TABLE IF NOT EXISTS public.ai_sales_manual (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_sales_manual_created_at ON public.ai_sales_manual (created_at DESC);

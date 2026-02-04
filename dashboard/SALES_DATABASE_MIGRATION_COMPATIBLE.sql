-- ============================================
-- MIGRACIÓN COMPATIBLE: SISTEMA DE ANÁLISIS DE VENTAS
-- Versión: 1.1 - Compatible con esquema existente
-- Fecha: 2024-01-26
-- Descripción: Extiende el sistema actual sin conflictos
-- ============================================

-- VERIFICACIÓN PREVIA: Mostrar estructura actual
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversation_evaluations';

-- ============================================
-- 1. EXTENDER TABLA EXISTENTE: conversation_evaluations
-- Agregar nuevos campos de análisis de ventas
-- ============================================

DO $$
BEGIN
    -- Agregar nuevos parámetros de ventas (solo si no existen)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'venta_confirmada') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN venta_confirmada boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'lead_caliente') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN lead_caliente boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'cotizacion_enviada') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN cotizacion_enviada boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'metodo_pago_enviado') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN metodo_pago_enviado boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'objeciones_superadas') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN objeciones_superadas boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'seguimiento_efectivo') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN seguimiento_efectivo boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'urgencia_creada') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN urgencia_creada boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'valor_agregado') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN valor_agregado boolean DEFAULT false;
    END IF;

    -- Agregar campos de métricas de ventas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'score_ventas') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN score_ventas integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'percentage_ventas') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN percentage_ventas numeric(5,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'valor_venta') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN valor_venta numeric(15,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'valor_estimado') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN valor_estimado numeric(15,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'interest_level') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN interest_level varchar(10) DEFAULT 'bajo' CHECK (interest_level IN ('alto', 'medio', 'bajo'));
    END IF;

    -- Agregar campos de análisis cualitativo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'resultado_comercial') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN resultado_comercial jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'exitos_asesor') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN exitos_asesor text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'errores_criticos') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN errores_criticos text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'siguiente_accion') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN siguiente_accion text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'confidence_score') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN confidence_score numeric(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'analysis_method') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN analysis_method varchar(20) DEFAULT 'hybrid';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'analysis_version') THEN
        ALTER TABLE conversation_evaluations ADD COLUMN analysis_version varchar(10) DEFAULT 'v2.0';
    END IF;

    RAISE NOTICE 'conversation_evaluations actualizada con campos de ventas';
END $$;

-- ============================================
-- 2. EXTENDER TABLA EXISTENTE: performance_analyses
-- Agregar campos para métricas de ventas agregadas
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'ventas_confirmadas_count') THEN
        ALTER TABLE performance_analyses ADD COLUMN ventas_confirmadas_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'leads_calientes_count') THEN
        ALTER TABLE performance_analyses ADD COLUMN leads_calientes_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'valor_total_ventas') THEN
        ALTER TABLE performance_analyses ADD COLUMN valor_total_ventas numeric(15,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'tasa_conversion') THEN
        ALTER TABLE performance_analyses ADD COLUMN tasa_conversion numeric(5,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'average_score_ventas') THEN
        ALTER TABLE performance_analyses ADD COLUMN average_score_ventas numeric(5,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'nivel_comercial') THEN
        ALTER TABLE performance_analyses ADD COLUMN nivel_comercial varchar(20) DEFAULT 'REGULAR';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'sales_summary') THEN
        ALTER TABLE performance_analyses ADD COLUMN sales_summary jsonb DEFAULT '{}'::jsonb;
    END IF;

    RAISE NOTICE 'performance_analyses actualizada con métricas de ventas';
END $$;

-- ============================================
-- 3. NUEVA TABLA: daily_sales_reports
-- Para reportes diarios automáticos
-- ============================================

CREATE TABLE IF NOT EXISTS daily_sales_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id uuid NOT NULL, -- Referencias bots(id)
    worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
    report_date date NOT NULL,

    -- Métricas principales
    ventas_confirmadas integer DEFAULT 0,
    leads_calientes integer DEFAULT 0,
    cotizaciones_enviadas integer DEFAULT 0,
    conversaciones_analizadas integer DEFAULT 0,
    valor_total_ventas numeric(15,2) DEFAULT 0.00,

    -- Métricas calculadas
    tasa_conversion numeric(5,2) DEFAULT 0.00,
    valor_promedio_venta numeric(15,2) DEFAULT 0.00,
    score_promedio_ventas numeric(5,2) DEFAULT 0.00,

    -- Clasificación
    nivel_rendimiento varchar(20) DEFAULT 'REGULAR',
    requiere_seguimiento boolean DEFAULT false,

    -- Análisis detallado
    ventas_exitosas jsonb DEFAULT '[]'::jsonb,
    oportunidades_perdidas jsonb DEFAULT '[]'::jsonb,
    recomendaciones jsonb DEFAULT '[]'::jsonb,

    -- Referencias al análisis completo
    performance_analysis_id uuid REFERENCES performance_analyses(id),

    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    -- Restricciones
    CONSTRAINT daily_sales_reports_asesor_date_unique UNIQUE(asesor_id, report_date),
    CONSTRAINT daily_sales_reports_ventas_positive CHECK (ventas_confirmadas >= 0),
    CONSTRAINT daily_sales_reports_conversion_valid CHECK (tasa_conversion >= 0 AND tasa_conversion <= 100)
);

-- Índices para daily_sales_reports
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_asesor_date
    ON daily_sales_reports(asesor_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_worker_date
    ON daily_sales_reports(worker_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_nivel
    ON daily_sales_reports(nivel_rendimiento);

-- ============================================
-- 4. NUEVA TABLA: sales_analysis_config
-- Configuración del sistema de análisis
-- ============================================

CREATE TABLE IF NOT EXISTS sales_analysis_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key varchar(50) UNIQUE NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Configuraciones iniciales
INSERT INTO sales_analysis_config (config_key, config_value, description) VALUES
('parameters_weights', '{
    "venta_confirmada": 10,
    "lead_caliente": 8,
    "cotizacion_enviada": 6,
    "metodo_pago_enviado": 7,
    "objeciones_superadas": 8,
    "seguimiento_efectivo": 6,
    "urgencia_creada": 5,
    "valor_agregado": 7
}', 'Pesos para parámetros de ventas'),

('analysis_thresholds', '{
    "excelente_threshold": 80,
    "bueno_threshold": 70,
    "regular_threshold": 60,
    "confidence_threshold": 0.7
}', 'Umbrales de clasificación'),

('cron_settings', '{
    "daily_analysis_time": "00:00",
    "timezone": "America/Bogota",
    "enabled": false,
    "max_conversations_per_advisor": 20,
    "min_messages_per_conversation": 5
}', 'Configuración análisis automático'),

('notification_settings', '{
    "notify_on_sales": true,
    "notify_on_critical_performance": true,
    "email_recipients": [],
    "whatsapp_notifications": false
}', 'Configuración notificaciones')

ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_at = now();

-- ============================================
-- 5. NUEVA TABLA: sales_analysis_logs
-- Logs para auditoría y debugging
-- ============================================

CREATE TABLE IF NOT EXISTS sales_analysis_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type varchar(50) NOT NULL,
    asesor_id uuid,
    worker_id uuid REFERENCES workers(id),
    event_data jsonb DEFAULT '{}'::jsonb,
    success boolean DEFAULT true,
    error_message text,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_sales_analysis_logs_type_date
    ON sales_analysis_logs(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_analysis_logs_asesor
    ON sales_analysis_logs(asesor_id, created_at DESC);

-- ============================================
-- 6. ÍNDICES ADICIONALES PARA TABLAS EXISTENTES
-- Optimizar consultas de análisis de ventas
-- ============================================

-- Índices en conversation_evaluations para nuevos campos
CREATE INDEX IF NOT EXISTS idx_conversation_evaluations_ventas
    ON conversation_evaluations(venta_confirmada)
    WHERE venta_confirmada = true;

CREATE INDEX IF NOT EXISTS idx_conversation_evaluations_leads
    ON conversation_evaluations(lead_caliente)
    WHERE lead_caliente = true;

CREATE INDEX IF NOT EXISTS idx_conversation_evaluations_analysis_version
    ON conversation_evaluations(analysis_version);

-- Índices en chats para ai_analysis
CREATE INDEX IF NOT EXISTS idx_chats_ai_analysis
    ON chats USING gin(ai_analysis)
    WHERE ai_analysis != '{}'::jsonb;

-- ============================================
-- 7. VISTAS PARA REPORTING
-- ============================================

-- Vista principal del dashboard de ventas
CREATE OR REPLACE VIEW vw_sales_dashboard AS
SELECT
    dsr.id,
    dsr.asesor_id,
    dsr.worker_id,
    w.name as worker_name,
    b.name as bot_name,
    b.session_name,
    dsr.report_date,
    dsr.ventas_confirmadas,
    dsr.leads_calientes,
    dsr.cotizaciones_enviadas,
    dsr.conversaciones_analizadas,
    dsr.valor_total_ventas,
    dsr.tasa_conversion,
    dsr.valor_promedio_venta,
    dsr.score_promedio_ventas,
    dsr.nivel_rendimiento,
    dsr.requiere_seguimiento,
    dsr.created_at,

    -- Métricas calculadas
    CASE
        WHEN dsr.conversaciones_analizadas > 0
        THEN ROUND((dsr.leads_calientes::numeric / dsr.conversaciones_analizadas) * 100, 1)
        ELSE 0
    END as tasa_leads,

    CASE
        WHEN dsr.conversaciones_analizadas > 0
        THEN ROUND((dsr.cotizaciones_enviadas::numeric / dsr.conversaciones_analizadas) * 100, 1)
        ELSE 0
    END as tasa_cotizaciones

FROM daily_sales_reports dsr
LEFT JOIN workers w ON dsr.worker_id = w.id
LEFT JOIN bots b ON dsr.asesor_id = b.id
ORDER BY dsr.report_date DESC, dsr.score_promedio_ventas DESC;

-- Vista de resumen por asesor (últimos 30 días)
CREATE OR REPLACE VIEW vw_advisor_sales_summary AS
SELECT
    asesor_id,
    worker_id,
    MAX(worker_name) as worker_name,
    MAX(bot_name) as bot_name,
    COUNT(*) as dias_analizados,
    SUM(ventas_confirmadas) as total_ventas,
    SUM(leads_calientes) as total_leads,
    SUM(valor_total_ventas) as valor_total,
    ROUND(AVG(score_promedio_ventas), 1) as score_promedio,
    ROUND(AVG(tasa_conversion), 1) as conversion_promedio,
    SUM(CASE WHEN nivel_rendimiento = 'EXCELENTE' THEN 1 ELSE 0 END) as dias_excelentes,
    SUM(CASE WHEN nivel_rendimiento = 'DEFICIENTE' THEN 1 ELSE 0 END) as dias_deficientes,
    MAX(report_date) as ultimo_analisis
FROM vw_sales_dashboard
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY asesor_id, worker_id
ORDER BY score_promedio DESC, total_ventas DESC;

-- ============================================
-- 8. FUNCIONES DE UTILIDAD
-- ============================================

-- Función para calcular estadísticas de ventas de un asesor
CREATE OR REPLACE FUNCTION calculate_advisor_sales_stats(
    p_asesor_id uuid,
    p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date,
            'days', p_end_date - p_start_date + 1
        ),
        'totals', jsonb_build_object(
            'ventas_confirmadas', COALESCE(SUM(ventas_confirmadas), 0),
            'leads_calientes', COALESCE(SUM(leads_calientes), 0),
            'valor_total', COALESCE(SUM(valor_total_ventas), 0),
            'conversaciones_analizadas', COALESCE(SUM(conversaciones_analizadas), 0)
        ),
        'averages', jsonb_build_object(
            'ventas_por_dia', COALESCE(ROUND(AVG(ventas_confirmadas), 2), 0),
            'conversion_promedio', COALESCE(ROUND(AVG(tasa_conversion), 2), 0),
            'score_promedio', COALESCE(ROUND(AVG(score_promedio_ventas), 2), 0)
        ),
        'performance', jsonb_build_object(
            'dias_excelentes', COUNT(CASE WHEN nivel_rendimiento = 'EXCELENTE' THEN 1 END),
            'dias_buenos', COUNT(CASE WHEN nivel_rendimiento = 'BUENO' THEN 1 END),
            'dias_regulares', COUNT(CASE WHEN nivel_rendimiento = 'REGULAR' THEN 1 END),
            'dias_deficientes', COUNT(CASE WHEN nivel_rendimiento = 'DEFICIENTE' THEN 1 END)
        )
    ) INTO result
    FROM daily_sales_reports
    WHERE asesor_id = p_asesor_id
      AND report_date BETWEEN p_start_date AND p_end_date;

    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en daily_sales_reports
CREATE OR REPLACE FUNCTION update_daily_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_sales_reports ON daily_sales_reports;
CREATE TRIGGER trigger_update_daily_sales_reports
    BEFORE UPDATE ON daily_sales_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_reports_timestamp();

-- Trigger para actualizar updated_at en sales_analysis_config
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_config ON sales_analysis_config;
CREATE TRIGGER trigger_update_sales_config
    BEFORE UPDATE ON sales_analysis_config
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

-- ============================================
-- 10. PERMISOS Y SEGURIDAD
-- ============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE daily_sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según roles existentes)
CREATE POLICY "Authenticated users can view sales reports" ON daily_sales_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sales reports" ON daily_sales_reports
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- 11. VERIFICACIONES FINALES
-- ============================================

-- Verificar que la migración se ejecutó correctamente
DO $$
BEGIN
    -- Verificar nuevos campos en conversation_evaluations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'venta_confirmada') THEN
        RAISE NOTICE '✅ Campo venta_confirmada agregado correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Campo venta_confirmada no se pudo agregar';
    END IF;

    -- Verificar nueva tabla daily_sales_reports
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_sales_reports') THEN
        RAISE NOTICE '✅ Tabla daily_sales_reports creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla daily_sales_reports no se pudo crear';
    END IF;

    -- Verificar configuraciones
    IF EXISTS (SELECT 1 FROM sales_analysis_config WHERE config_key = 'parameters_weights') THEN
        RAISE NOTICE '✅ Configuraciones iniciales cargadas correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Configuraciones no se pudieron cargar';
    END IF;

    RAISE NOTICE '🎉 ¡Migración completada exitosamente!';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Verificar vistas: SELECT * FROM vw_sales_dashboard LIMIT 5;';
    RAISE NOTICE '  2. Probar función: SELECT calculate_advisor_sales_stats(''<uuid-asesor>'');';
    RAISE NOTICE '  3. Configurar cron job para análisis diario';
END $$;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN RECOMENDADAS
-- ============================================

-- Ejecutar después de la migración para verificar:
/*
-- Ver estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_evaluations'
AND column_name LIKE '%venta%' OR column_name LIKE '%lead%'
ORDER BY column_name;

-- Ver configuraciones
SELECT * FROM sales_analysis_config;

-- Probar vistas
SELECT * FROM vw_sales_dashboard LIMIT 3;

-- Ver tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%sales%';
*/

COMMIT;

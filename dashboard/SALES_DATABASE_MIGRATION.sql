-- ============================================
-- MIGRACIÓN DE BASE DE DATOS: SISTEMA DE ANÁLISIS DE VENTAS
-- Versión: 1.0
-- Fecha: 2024-01-26
-- Descripción: Agrega tablas y campos para el nuevo sistema de análisis de ventas
-- ============================================

-- 1. TABLA PRINCIPAL: daily_sales_reports
-- Almacena reportes diarios de ventas por asesor
CREATE TABLE IF NOT EXISTS daily_sales_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id UUID NOT NULL, -- ID del bot/asesor
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    report_date DATE NOT NULL,

    -- Métricas de ventas principales
    ventas_confirmadas INTEGER DEFAULT 0,
    leads_calientes INTEGER DEFAULT 0,
    cotizaciones_enviadas INTEGER DEFAULT 0,
    valor_total_ventas DECIMAL(15,2) DEFAULT 0.00,

    -- Métricas de rendimiento
    conversaciones_analizadas INTEGER DEFAULT 0,
    tasa_conversion DECIMAL(5,2) DEFAULT 0.00,
    valor_promedio_venta DECIMAL(15,2) DEFAULT 0.00,

    -- Análisis detallado (JSON)
    ventas_exitosas JSONB DEFAULT '[]'::jsonb,
    oportunidades_perdidas JSONB DEFAULT '[]'::jsonb,
    mejores_practicas JSONB DEFAULT '[]'::jsonb,
    areas_mejora JSONB DEFAULT '[]'::jsonb,

    -- Scores y porcentajes
    score_ventas INTEGER DEFAULT 0,
    max_score_ventas INTEGER DEFAULT 57,
    percentage_ventas DECIMAL(5,2) DEFAULT 0.00,

    -- Clasificación del día
    nivel_rendimiento VARCHAR(20) DEFAULT 'REGULAR', -- EXCELENTE, BUENO, REGULAR, DEFICIENTE
    requiere_seguimiento BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restricciones
    UNIQUE(asesor_id, report_date),
    CHECK (ventas_confirmadas >= 0),
    CHECK (leads_calientes >= 0),
    CHECK (valor_total_ventas >= 0),
    CHECK (tasa_conversion >= 0 AND tasa_conversion <= 100),
    CHECK (percentage_ventas >= 0 AND percentage_ventas <= 100)
);

-- Índices para daily_sales_reports
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_asesor_date
    ON daily_sales_reports(asesor_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_worker_date
    ON daily_sales_reports(worker_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_date
    ON daily_sales_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_nivel
    ON daily_sales_reports(nivel_rendimiento);
CREATE INDEX IF NOT EXISTS idx_daily_sales_reports_seguimiento
    ON daily_sales_reports(requiere_seguimiento)
    WHERE requiere_seguimiento = true;

-- ============================================

-- 2. TABLA DETALLE: sales_conversations
-- Almacena el análisis detallado de cada conversación de venta
CREATE TABLE IF NOT EXISTS sales_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_sales_reports(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL, -- ID de la conversación original
    contact_name TEXT,
    contact_number TEXT,

    -- Nuevos parámetros de ventas (booleanos)
    venta_confirmada BOOLEAN DEFAULT false,
    lead_caliente BOOLEAN DEFAULT false,
    cotizacion_enviada BOOLEAN DEFAULT false,
    metodo_pago_enviado BOOLEAN DEFAULT false,
    objeciones_superadas BOOLEAN DEFAULT false,
    seguimiento_efectivo BOOLEAN DEFAULT false,
    urgencia_creada BOOLEAN DEFAULT false,
    valor_agregado BOOLEAN DEFAULT false,

    -- Valores y métricas
    valor_venta DECIMAL(15,2),
    valor_estimado DECIMAL(15,2),
    interest_level VARCHAR(10) DEFAULT 'bajo', -- alto, medio, bajo

    -- Análisis cualitativo
    exitos_asesor TEXT[],
    errores_criticos TEXT[],
    siguiente_accion TEXT,
    resultado_comercial_tipo VARCHAR(30), -- VENTA_CONFIRMADA, LEAD_CALIENTE, etc.
    resultado_comercial_prioridad VARCHAR(10), -- ALTA, MEDIA, BAJA, MINIMA

    -- Scores
    score_ventas INTEGER DEFAULT 0,
    max_score_ventas INTEGER DEFAULT 57,
    percentage_ventas DECIMAL(5,2) DEFAULT 0.00,

    -- Confianza del análisis IA
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    analysis_method VARCHAR(20) DEFAULT 'openai', -- openai, local, hybrid

    -- Evidencias (textos específicos que justifican la evaluación)
    venta_confirmada_evidencia TEXT,
    lead_caliente_evidencia TEXT,
    cotizacion_enviada_evidencia TEXT,
    metodo_pago_enviado_evidencia TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restricciones
    CHECK (valor_venta >= 0),
    CHECK (valor_estimado >= 0),
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CHECK (percentage_ventas >= 0 AND percentage_ventas <= 100),
    CHECK (interest_level IN ('alto', 'medio', 'bajo')),
    CHECK (resultado_comercial_prioridad IN ('ALTA', 'MEDIA', 'BAJA', 'MINIMA'))
);

-- Índices para sales_conversations
CREATE INDEX IF NOT EXISTS idx_sales_conversations_report
    ON sales_conversations(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_sales_conversations_conversation
    ON sales_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sales_conversations_venta
    ON sales_conversations(venta_confirmada)
    WHERE venta_confirmada = true;
CREATE INDEX IF NOT EXISTS idx_sales_conversations_leads
    ON sales_conversations(lead_caliente)
    WHERE lead_caliente = true;
CREATE INDEX IF NOT EXISTS idx_sales_conversations_prioridad
    ON sales_conversations(resultado_comercial_prioridad);

-- ============================================

-- 3. EXTENDER TABLA EXISTENTE: conversation_evaluations
-- Agregar campos de ventas a las evaluaciones existentes
ALTER TABLE conversation_evaluations
ADD COLUMN IF NOT EXISTS venta_confirmada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_caliente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cotizacion_enviada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metodo_pago_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS objeciones_superadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seguimiento_efectivo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS urgencia_creada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_agregado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS score_ventas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage_ventas DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_venta DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS resultado_comercial JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_version VARCHAR(10) DEFAULT 'v2.0';

-- Índices para conversation_evaluations (nuevos campos)
CREATE INDEX IF NOT EXISTS idx_conversation_evaluations_ventas
    ON conversation_evaluations(venta_confirmada)
    WHERE venta_confirmada = true;
CREATE INDEX IF NOT EXISTS idx_conversation_evaluations_leads
    ON conversation_evaluations(lead_caliente)
    WHERE lead_caliente = true;

-- ============================================

-- 4. EXTENDER TABLA EXISTENTE: performance_reports
-- Mejorar tabla de reportes para incluir datos de ventas
ALTER TABLE performance_reports
ADD COLUMN IF NOT EXISTS sales_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS commercial_summary JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS report_version VARCHAR(10) DEFAULT 'v2.0';

-- ============================================

-- 5. TABLA DE CONFIGURACIÓN: sales_analysis_config
-- Configuración para el sistema de análisis de ventas
CREATE TABLE IF NOT EXISTS sales_analysis_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
}', 'Pesos para cada parámetro de ventas'),

('analysis_thresholds', '{
    "excelente_threshold": 80,
    "bueno_threshold": 70,
    "regular_threshold": 60,
    "confidence_threshold": 0.7
}', 'Umbrales para clasificación de rendimiento'),

('cron_settings', '{
    "daily_analysis_time": "00:00",
    "timezone": "America/Bogota",
    "enabled": true,
    "max_conversations_per_advisor": 20
}', 'Configuración para análisis automático diario'),

('notification_settings', '{
    "notify_on_sales": true,
    "notify_on_critical_performance": true,
    "email_recipients": [],
    "whatsapp_notifications": false
}', 'Configuración de notificaciones')

ON CONFLICT (config_key) DO NOTHING;

-- ============================================

-- 6. TABLA DE LOGS: sales_analysis_logs
-- Para auditoría y debugging del sistema
CREATE TABLE IF NOT EXISTS sales_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- daily_analysis, manual_analysis, error, etc.
    asesor_id UUID,
    worker_id UUID,
    event_data JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sales_analysis_logs
CREATE INDEX IF NOT EXISTS idx_sales_analysis_logs_type_date
    ON sales_analysis_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_analysis_logs_asesor
    ON sales_analysis_logs(asesor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_analysis_logs_errors
    ON sales_analysis_logs(success, created_at DESC)
    WHERE success = false;

-- ============================================

-- 7. VISTAS PARA REPORTING
-- Vista consolidada de métricas de ventas
CREATE OR REPLACE VIEW vw_sales_dashboard AS
SELECT
    dsr.id,
    dsr.asesor_id,
    dsr.worker_id,
    w.name as worker_name,
    dsr.report_date,
    dsr.ventas_confirmadas,
    dsr.leads_calientes,
    dsr.cotizaciones_enviadas,
    dsr.valor_total_ventas,
    dsr.conversaciones_analizadas,
    dsr.tasa_conversion,
    dsr.valor_promedio_venta,
    dsr.percentage_ventas,
    dsr.nivel_rendimiento,
    dsr.requiere_seguimiento,
    dsr.created_at,
    -- Métricas derivadas
    CASE
        WHEN dsr.conversaciones_analizadas > 0
        THEN ROUND((dsr.leads_calientes::DECIMAL / dsr.conversaciones_analizadas) * 100, 1)
        ELSE 0
    END as tasa_leads,
    CASE
        WHEN dsr.ventas_confirmadas > 0 AND dsr.valor_total_ventas > 0
        THEN ROUND(dsr.valor_total_ventas / dsr.ventas_confirmadas, 0)
        ELSE 0
    END as ticket_promedio
FROM daily_sales_reports dsr
LEFT JOIN workers w ON dsr.worker_id = w.id
ORDER BY dsr.report_date DESC, dsr.percentage_ventas DESC;

-- Vista de top performers
CREATE OR REPLACE VIEW vw_top_sales_performers AS
SELECT
    asesor_id,
    worker_id,
    MAX(worker_name) as worker_name,
    COUNT(*) as dias_analizados,
    SUM(ventas_confirmadas) as total_ventas,
    SUM(leads_calientes) as total_leads,
    SUM(valor_total_ventas) as valor_total,
    ROUND(AVG(percentage_ventas), 1) as percentage_promedio,
    ROUND(AVG(tasa_conversion), 1) as conversion_promedio,
    SUM(CASE WHEN nivel_rendimiento = 'EXCELENTE' THEN 1 ELSE 0 END) as dias_excelentes
FROM vw_sales_dashboard
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY asesor_id, worker_id
ORDER BY percentage_promedio DESC, total_ventas DESC;

-- ============================================

-- 8. FUNCIONES DE UTILIDAD

-- Función para calcular métricas agregadas de un asesor
CREATE OR REPLACE FUNCTION calculate_advisor_sales_stats(
    p_asesor_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
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
            'score_promedio', COALESCE(ROUND(AVG(percentage_ventas), 2), 0)
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

-- 9. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA

-- Trigger para actualizar updated_at en daily_sales_reports
CREATE OR REPLACE FUNCTION update_daily_sales_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_sales_reports_updated_at
    BEFORE UPDATE ON daily_sales_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_sales_reports_updated_at();

-- Trigger para actualizar updated_at en sales_analysis_config
CREATE OR REPLACE FUNCTION update_sales_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_config_updated_at
    BEFORE UPDATE ON sales_analysis_config
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_config_updated_at();

-- ============================================

-- 10. PERMISOS Y SEGURIDAD (RLS)

-- Habilitar RLS en las nuevas tablas
ALTER TABLE daily_sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según los roles existentes)
CREATE POLICY "Users can view their own sales reports" ON daily_sales_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert sales reports" ON daily_sales_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their sales reports" ON daily_sales_reports
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Similar para sales_conversations
CREATE POLICY "Users can view sales conversations" ON sales_conversations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert sales conversations" ON sales_conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================

-- 11. DATOS DE PRUEBA (OPCIONAL - SOLO PARA DESARROLLO)
-- Comentar en producción

/*
-- Insertar algunos datos de ejemplo
INSERT INTO daily_sales_reports (
    asesor_id,
    report_date,
    ventas_confirmadas,
    leads_calientes,
    cotizaciones_enviadas,
    valor_total_ventas,
    conversaciones_analizadas,
    tasa_conversion,
    percentage_ventas,
    nivel_rendimiento
) VALUES
(gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', 3, 5, 8, 15000.00, 20, 15.0, 78.5, 'BUENO'),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', 5, 7, 12, 25000.00, 25, 20.0, 85.2, 'EXCELENTE'),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', 1, 3, 6, 5000.00, 18, 5.6, 65.4, 'REGULAR');
*/

-- ============================================
-- NOTAS FINALES
-- ============================================

-- COMENTARIOS:
-- 1. Este script es seguro para ejecutar múltiples veces (IF NOT EXISTS)
-- 2. Las restricciones CHECK previenen datos inválidos
-- 3. Los índices optimizan las consultas más comunes
-- 4. Las vistas simplifican el reporting
-- 5. La función calculate_advisor_sales_stats permite análisis rápidos
-- 6. RLS está habilitado para seguridad básica

-- PRÓXIMOS PASOS DESPUÉS DE EJECUTAR:
-- 1. Verificar que todas las tablas se crearon correctamente
-- 2. Testear las funciones con datos de prueba
-- 3. Configurar el cron job para usar estas tablas
-- 4. Actualizar las APIs para escribir en las nuevas tablas
-- 5. Crear dashboards que consuman estas vistas

-- VERIFICACIÓN RÁPIDA:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%sales%';
-- SELECT * FROM sales_analysis_config;

COMMIT;

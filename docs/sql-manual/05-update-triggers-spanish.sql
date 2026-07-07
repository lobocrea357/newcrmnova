-- ============================================================================
-- Actualizar Triggers y Funciones para Tipos de Eventos en Español
-- Archivo: 05-update-triggers-spanish.sql
-- Propósito: Actualizar funciones y triggers para usar nombres en español
-- ============================================================================

-- ============================================================================
-- FUNCIÓN 1: poc_detect_sale_from_vuelo()
-- Actualizada para usar VENTA_CONFIRMADA
-- ============================================================================
CREATE OR REPLACE FUNCTION poc_detect_sale_from_vuelo()
RETURNS TRIGGER AS $$
DECLARE
    v_thread_id UUID;
    v_event_exists BOOLEAN;
BEGIN
    -- Buscar thread por contacto_telefono del vuelo
    SELECT id INTO v_thread_id
    FROM poc_customer_threads
    WHERE customer_phone = NEW.contacto_telefono
    LIMIT 1;
    
    -- Si no se encuentra thread, salir sin hacer nada
    IF v_thread_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar que no exista un evento de venta duplicado para este vuelo
    SELECT EXISTS(
        SELECT 1 FROM poc_thread_events
        WHERE thread_id = v_thread_id
        AND related_vuelo_id = NEW.id
        AND event_type = 'VENTA_CONFIRMADA'
    ) INTO v_event_exists;
    
    -- Si ya existe evento, salir sin hacer nada
    IF v_event_exists THEN
        RETURN NEW;
    END IF;
    
    -- Crear evento de venta automático
    INSERT INTO poc_thread_events (
        thread_id,
        event_type,
        event_subtype,
        occurred_at,
        event_data,
        related_vuelo_id,
        is_milestone,
        is_system_generated
    ) VALUES (
        v_thread_id,
        'VENTA_CONFIRMADA',
        'AUTO_DETECTED',
        COALESCE(NEW.created_at, NOW()),
        jsonb_build_object(
            'vuelo_id', NEW.id,
            'amount', NEW.monto_venta,
            'origen', NEW.ruta,
            'destino', NEW.ruta,
            'fecha_salida', NEW.fecha_vuelo
        ),
        NEW.id,
        TRUE,
        TRUE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN 2: poc_update_thread_status_from_event()
-- Actualizada para usar nombres en español
-- ============================================================================
CREATE OR REPLACE FUNCTION poc_update_thread_status_from_event()
RETURNS TRIGGER AS $$
DECLARE
    v_new_status VARCHAR(50);
    v_current_status VARCHAR(50);
BEGIN
    -- Obtener estado actual del thread
    SELECT current_status INTO v_current_status
    FROM poc_thread_status
    WHERE thread_id = NEW.thread_id;
    
    -- Determinar nuevo estado basado en tipo de evento
    CASE NEW.event_type
        WHEN 'VENTA_CONFIRMADA' THEN
            v_new_status := 'VENTA_CONCRETADA';
        WHEN 'VENTA_CANCELADA' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'LEAD_PERDIDO' THEN
            v_new_status := 'PERDIDO';
        WHEN 'LEAD_REACTIVADO' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'COTIZACION_ENVIADA' THEN
            -- Si está en NUEVO, pasar a EN_NEGOCIACION
            IF v_current_status = 'NUEVO' THEN
                v_new_status := 'EN_NEGOCIACION';
            ELSE
                v_new_status := v_current_status;
            END IF;
        WHEN 'COTIZACION_ACEPTADA' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'REUNION_AGENDADA' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'LLAMADA_REALIZADA' THEN
            v_new_status := 'EN_NEGOCIACION';
        ELSE
            -- Para otros eventos, mantener estado actual
            v_new_status := v_current_status;
    END CASE;
    
    -- Actualizar o insertar estado del thread
    INSERT INTO poc_thread_status (
        thread_id,
        current_status,
        status_since,
        previous_status,
        total_sales,
        total_sales_amount,
        first_sale_at,
        last_sale_at,
        last_activity_at,
        updated_at
    ) VALUES (
        NEW.thread_id,
        v_new_status,
        NOW(),
        v_current_status,
        0,
        0,
        NULL,
        NULL,
        NEW.occurred_at,
        NOW()
    )
    ON CONFLICT (thread_id) DO UPDATE SET
        current_status = EXCLUDED.current_status,
        status_since = CASE
            WHEN EXCLUDED.current_status != poc_thread_status.current_status
            THEN NOW()
            ELSE poc_thread_status.status_since
        END,
        previous_status = CASE
            WHEN EXCLUDED.current_status != poc_thread_status.current_status
            THEN poc_thread_status.current_status
            ELSE poc_thread_status.previous_status
        END,
        last_activity_at = NEW.occurred_at,
        updated_at = NOW();
    
    -- Si el evento es VENTA_CONFIRMADA, actualizar métricas de ventas
    IF NEW.event_type = 'VENTA_CONFIRMADA' THEN
        UPDATE poc_thread_status
        SET
            total_sales = total_sales + 1,
            total_sales_amount = total_sales_amount + COALESCE(
                (NEW.event_data->>'amount')::NUMERIC,
                0
            ),
            first_sale_at = COALESCE(first_sale_at, NEW.occurred_at),
            last_sale_at = NEW.occurred_at
        WHERE thread_id = NEW.thread_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que las funciones se crearon correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'poc_%';

-- Verificar que los triggers están activos
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_poc_%';

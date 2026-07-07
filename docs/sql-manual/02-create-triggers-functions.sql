-- ============================================================================
-- Sistema de Eventos POC - Triggers y Funciones
-- Archivo: 02-create-triggers-functions.sql
-- Propósito: Crear funciones automáticas y triggers para detección de eventos
-- ============================================================================

-- ============================================================================
-- FUNCIÓN 1: poc_detect_sale_from_vuelo()
-- Detecta automáticamente una venta cuando se crea un vuelo
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
        AND event_type = 'SALE_CONFIRMED'
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
        'SALE_CONFIRMED',
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

-- Comentario de la función
COMMENT ON FUNCTION poc_detect_sale_from_vuelo() IS 'Detecta automáticamente una venta cuando se crea un vuelo y crea el evento correspondiente';

-- ============================================================================
-- TRIGGER 1: trigger_poc_detect_sale
-- Se ejecuta después de insertar en tabla vuelos
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_poc_detect_sale ON vuelos;
CREATE TRIGGER trigger_poc_detect_sale
AFTER INSERT ON vuelos
FOR EACH ROW
EXECUTE FUNCTION poc_detect_sale_from_vuelo();

-- ============================================================================
-- FUNCIÓN 2: poc_update_thread_status_from_event()
-- Actualiza el estado del thread basándose en el tipo de evento
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
        WHEN 'SALE_CONFIRMED' THEN
            v_new_status := 'VENTA_CONCRETADA';
        WHEN 'SALE_CANCELLED' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'LEAD_LOST' THEN
            v_new_status := 'PERDIDO';
        WHEN 'LEAD_REACTIVATED' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'QUOTATION_SENT' THEN
            -- Si está en NUEVO, pasar a EN_NEGOCIACION
            IF v_current_status = 'NUEVO' THEN
                v_new_status := 'EN_NEGOCIACION';
            ELSE
                v_new_status := v_current_status;
            END IF;
        WHEN 'QUOTATION_ACCEPTED' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'MEETING_SCHEDULED' THEN
            v_new_status := 'EN_NEGOCIACION';
        WHEN 'CALL_MADE' THEN
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
    
    -- Si el evento es SALE_CONFIRMED, actualizar métricas de ventas
    IF NEW.event_type = 'SALE_CONFIRMED' THEN
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

-- Comentario de la función
COMMENT ON FUNCTION poc_update_thread_status_from_event() IS 'Actualiza el estado del thread basándose en el tipo de evento creado';

-- ============================================================================
-- TRIGGER 2: trigger_poc_update_status
-- Se ejecuta después de insertar en poc_thread_events
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_poc_update_status ON poc_thread_events;
CREATE TRIGGER trigger_poc_update_status
AFTER INSERT ON poc_thread_events
FOR EACH ROW
EXECUTE FUNCTION poc_update_thread_status_from_event();

-- ============================================================================
-- FUNCIÓN 3: poc_sync_first_contact()
-- Sincroniza timestamps de primer contacto y última actividad
-- ============================================================================
CREATE OR REPLACE FUNCTION poc_sync_first_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es un INSERT nuevo, establecer first_contact_at
    IF TG_OP = 'INSERT' THEN
        INSERT INTO poc_thread_status (
            thread_id,
            current_status,
            status_since,
            first_contact_at,
            last_activity_at,
            updated_at
        ) VALUES (
            NEW.id,
            'NUEVO',
            NOW(),
            NEW.created_at::TIMESTAMPTZ,
            NEW.created_at::TIMESTAMPTZ,
            NOW()
        )
        ON CONFLICT (thread_id) DO UPDATE SET
            first_contact_at = LEAST(
                EXCLUDED.first_contact_at,
                NEW.created_at::TIMESTAMPTZ,
                poc_thread_status.first_contact_at
            ),
            last_activity_at = NEW.created_at::TIMESTAMPTZ,
            updated_at = NOW();
    END IF;
    
    -- Si es un UPDATE, actualizar last_activity_at
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO poc_thread_status (
            thread_id,
            current_status,
            status_since,
            last_activity_at,
            updated_at
        ) VALUES (
            NEW.id,
            'NUEVO',
            NOW(),
            NEW.updated_at::TIMESTAMPTZ,
            NEW.updated_at::TIMESTAMPTZ,
            NOW()
        )
        ON CONFLICT (thread_id) DO UPDATE SET
            last_activity_at = NEW.updated_at::TIMESTAMPTZ,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION poc_sync_first_contact() IS 'Sincroniza timestamps de primer contacto y última actividad del thread';

-- ============================================================================
-- TRIGGER 3: trigger_poc_sync_contact
-- Se ejecuta después de insertar o actualizar en poc_customer_threads
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_poc_sync_contact ON poc_customer_threads;
CREATE TRIGGER trigger_poc_sync_contact
AFTER INSERT OR UPDATE ON poc_customer_threads
FOR EACH ROW
EXECUTE FUNCTION poc_sync_first_contact();

-- ============================================================================
-- FUNCIÓN 4: poc_create_status_on_thread_insert()
-- Crea automáticamente el registro de status cuando se crea un thread
-- ============================================================================
CREATE OR REPLACE FUNCTION poc_create_status_on_thread_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO poc_thread_status (
        thread_id,
        current_status,
        status_since,
        first_contact_at,
        last_activity_at,
        updated_at
    ) VALUES (
        NEW.id,
        'NUEVO',
        NOW(),
        NEW.created_at::TIMESTAMPTZ,
        NEW.created_at::TIMESTAMPTZ,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION poc_create_status_on_thread_insert() IS 'Crea automáticamente el registro de status cuando se crea un nuevo thread';

-- ============================================================================
-- TRIGGER 4: trigger_poc_create_status
-- Se ejecuta después de insertar en poc_customer_threads
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_poc_create_status ON poc_customer_threads;
CREATE TRIGGER trigger_poc_create_status
AFTER INSERT ON poc_customer_threads
FOR EACH ROW
EXECUTE FUNCTION poc_create_status_on_thread_insert();

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Success. No rows returned
-- ============================================================================

-- ============================================
-- FIX: Función get_bot_owner_suffix para ignorar sufijos numéricos
-- ============================================
-- PROBLEMA: 
--   andrea_gutierrez_colombia_2_endry -> extrae "endry" ✓
--   mariangel_yepes_colombia_endry_2 -> extrae "2" ✗
--
-- SOLUCIÓN: Ignorar tokens numéricos y buscar el último token válido
-- ============================================

-- Reemplazar la función existente
CREATE OR REPLACE FUNCTION get_bot_owner_suffix(session_name TEXT)
RETURNS TEXT AS $$
DECLARE
    tokens TEXT[];
    token TEXT;
    valid_leaders TEXT[] := ARRAY['moises', 'jesus', 'endry'];
    found_leader TEXT := NULL;
BEGIN
    -- Si session_name es NULL o vacío, retornar NULL
    IF session_name IS NULL OR TRIM(session_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Dividir el session_name por guiones bajos
    tokens := string_to_array(LOWER(session_name), '_');
    
    -- Recorrer los tokens de derecha a izquierda
    -- buscando el primer token que sea un líder válido
    FOR i IN REVERSE array_length(tokens, 1)..1 LOOP
        token := TRIM(tokens[i]);
        
        -- Saltar tokens vacíos o numéricos puros
        IF token = '' OR token ~ '^[0-9]+$' THEN
            CONTINUE;
        END IF;
        
        -- Si encontramos un líder válido, retornarlo
        IF token = ANY(valid_leaders) THEN
            found_leader := token;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN found_leader;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PRUEBAS DE VALIDACIÓN
-- ============================================
-- Descomentar para probar la función

/*
SELECT 
    'Test 1: andrea_gutierrez_colombia_2_endry' as test_case,
    get_bot_owner_suffix('andrea_gutierrez_colombia_2_endry') as result,
    'endry' as expected,
    get_bot_owner_suffix('andrea_gutierrez_colombia_2_endry') = 'endry' as pass;

SELECT 
    'Test 2: mariangel_yepes_colombia_endry_2' as test_case,
    get_bot_owner_suffix('mariangel_yepes_colombia_endry_2') as result,
    'endry' as expected,
    get_bot_owner_suffix('mariangel_yepes_colombia_endry_2') = 'endry' as pass;

SELECT 
    'Test 3: stefany_oliveros_colombia_2_endry' as test_case,
    get_bot_owner_suffix('stefany_oliveros_colombia_2_endry') as result,
    'endry' as expected,
    get_bot_owner_suffix('stefany_oliveros_colombia_2_endry') = 'endry' as pass;

SELECT 
    'Test 4: carlos_ramirez_3_apolo_moises' as test_case,
    get_bot_owner_suffix('carlos_ramirez_3_apolo_moises') as result,
    'moises' as expected,
    get_bot_owner_suffix('carlos_ramirez_3_apolo_moises') = 'moises' as pass;

SELECT 
    'Test 5: abrahama_apolo_moises_2_3' as test_case,
    get_bot_owner_suffix('abrahama_apolo_moises_2_3') as result,
    'moises' as expected,
    get_bot_owner_suffix('abrahama_apolo_moises_2_3') = 'moises' as pass;

SELECT 
    'Test 6: alfredo_nova_jesus_15' as test_case,
    get_bot_owner_suffix('alfredo_nova_jesus_15') as result,
    'jesus' as expected,
    get_bot_owner_suffix('alfredo_nova_jesus_15') = 'jesus' as pass;

SELECT 
    'Test 7: sin_numero_endry' as test_case,
    get_bot_owner_suffix('sin_numero_endry') as result,
    'endry' as expected,
    get_bot_owner_suffix('sin_numero_endry') = 'endry' as pass;

SELECT 
    'Test 8: bot_sin_leader_123' as test_case,
    get_bot_owner_suffix('bot_sin_leader_123') as result,
    NULL as expected,
    get_bot_owner_suffix('bot_sin_leader_123') IS NULL as pass;
*/

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Descomentar las pruebas para validar
-- 3. Verificar que todos los tests pasen
-- 4. Los usuarios ahora verán sus bots correctamente sin importar
--    la posición de los sufijos numéricos
-- ============================================

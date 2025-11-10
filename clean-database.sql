-- ============================================
-- LIMPIEZA DE BASE DE DATOS
-- MANTIENE: profiles, roles, messages, chats
-- ELIMINA: workers, bots
-- ============================================

BEGIN;

-- 1. Desasociar profiles de workers (poner worker_id en NULL)
UPDATE profiles SET worker_id = NULL WHERE worker_id IS NOT NULL;

-- 2. Eliminar workers
DELETE FROM workers;

-- 3. Eliminar bots
DELETE FROM bots;

-- 4. Verificar lo que queda
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'roles' as tabla, COUNT(*) as registros FROM roles
UNION ALL
SELECT 'messages' as tabla, COUNT(*) as registros FROM messages
UNION ALL
SELECT 'chats' as tabla, COUNT(*) as registros FROM chats
UNION ALL
SELECT 'workers' as tabla, COUNT(*) as registros FROM workers
UNION ALL
SELECT 'bots' as tabla, COUNT(*) as registros FROM bots;

COMMIT;

-- ============================================
-- RESULTADO ESPERADO:
-- profiles: mantiene registros existentes ✅
-- roles: mantiene registros existentes ✅
-- messages: mantiene registros existentes ✅
-- chats: mantiene registros existentes ✅
-- workers: 0 (limpiado) ❌
-- bots: 0 (limpiado) ❌
-- ============================================

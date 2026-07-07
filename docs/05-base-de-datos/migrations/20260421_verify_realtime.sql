-- Script: Verificar que Realtime está habilitado en tabla vuelos
-- Date: 2026-04-21
-- Purpose: Confirmar que la tabla vuelos está en la publicación supabase_realtime
-- Ejecutar DESPUÉS de la migración 20260421_create_deudas_tables.sql

-- Verificar que vuelos está en realtime
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'vuelos';

-- Debe retornar 1 fila con:
-- schemaname: public
-- tablename: vuelos
-- pubname: supabase_realtime

-- ============================================================
-- MIGRACIÓN: Estructura de Equipos
-- Crea la tabla equipos y agrega equipo_id a profiles
-- ============================================================

-- 1. Crear tabla de equipos
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  color text DEFAULT '#6366f1',
  gerente_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipos_pkey PRIMARY KEY (id),
  CONSTRAINT equipos_gerente_id_fkey FOREIGN KEY (gerente_id) REFERENCES public.profiles(id)
);

-- 2. Agregar columna equipo_id a profiles (si no existe)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS equipo_id uuid REFERENCES public.equipos(id);

-- 3. Poblar equipo_id desde manager_id existente (migración de datos)
-- Crea equipos automáticos para cada gerente que ya tiene asesores asignados
INSERT INTO public.equipos (nombre, gerente_id)
SELECT DISTINCT
  CONCAT('Equipo de ', g.full_name) as nombre,
  g.id as gerente_id
FROM public.profiles a
JOIN public.profiles g ON a.manager_id = g.id
WHERE a.manager_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Asigna equipo_id a los asesores según su manager_id y limpia manager_id (ya no se usa)
UPDATE public.profiles a
SET 
  equipo_id = e.id,
  manager_id = NULL
FROM public.equipos e
WHERE a.manager_id = e.gerente_id
  AND a.equipo_id IS NULL;

-- NOTA IMPORTANTE: 
-- A partir de esta migración, la relación asesor-gerente se maneja SOLO con equipos.
-- manager_id ya NO se usa y debe permanecer NULL.
-- La relación es: profiles.equipo_id → equipos.gerente_id → profiles.id

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT e.nombre, e.color, p.full_name as gerente, COUNT(a.id) as asesores
-- FROM equipos e
-- JOIN profiles p ON e.gerente_id = p.id
-- LEFT JOIN profiles a ON a.equipo_id = e.id
-- GROUP BY e.id, e.nombre, e.color, p.full_name;

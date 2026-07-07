-- Team Schema Reference for ERP Nova CRM
-- Extracted from docs/05-base-de-datos/esquemalocal.sql

-- EQUIPOS: Each team has ONE manager who leads it
CREATE TABLE equipos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  color text DEFAULT '#6366f1'::text,
  gerente_id uuid NOT NULL,  -- Manager who leads this team
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipos_pkey PRIMARY KEY (id),
  CONSTRAINT equipos_gerente_id_fkey FOREIGN KEY (gerente_id) REFERENCES public.profiles(id)
);

-- PROFILES: Users can belong to ONE team (nullable for managers)
CREATE TABLE profiles (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  role_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  equipo_id uuid,  -- Team membership (NULL for managers)
  avatar_url text,
  sede_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT profiles_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id),
  CONSTRAINT profiles_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id)
);

-- Key Relationship Rules:
-- 1. Manager (Gerente): equipos.gerente_id = manager.id, profiles.equipo_id = NULL
-- 2. Advisor (Asesor): profiles.equipo_id = team.id, may or may not be in equipos table
-- 3. Permission Check: recurso.creator?.equipo_id === equipoLiderado?.id

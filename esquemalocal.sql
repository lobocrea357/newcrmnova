-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bookings (
  loc text NOT NULL,
  fecha_registro_venta timestamp with time zone,
  fecha_salida_vuelo date,
  origen_codigo text,
  destino_codigo text,
  ruta_completa text,
  numero_vuelo text,
  aerolinea text,
  paradas_o_escalas text,
  duracion_vuelo text,
  equipaje_incluido text,
  estado_reserva text,
  tipo_servicio text,
  proveedor text,
  agente_venta text,
  pax_total integer,
  pasajeros_nombres text,
  pasajeros_ticket_numbers text,
  venta_total_usd numeric,
  costo_base_usd numeric,
  emision_fee_usd numeric,
  hostal_usd numeric,
  fee_agencia_usd numeric,
  total_boleto_usd numeric,
  vuelto_usd numeric,
  pago_status text,
  metodo_pago text,
  cuenta_pago text,
  last_updated_source text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (loc)
);
CREATE TABLE public.bot_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bot_id uuid,
  date date DEFAULT CURRENT_DATE,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  media_sent integer DEFAULT 0,
  media_received integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bot_stats_pkey PRIMARY KEY (id),
  CONSTRAINT bot_stats_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
);
CREATE TABLE public.bots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone_number text NOT NULL UNIQUE,
  status text DEFAULT 'offline'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_name text UNIQUE,
  engine text DEFAULT 'NOWEB'::text,
  qr_code text,
  last_seen timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  worker_id uuid,
  CONSTRAINT bots_pkey PRIMARY KEY (id),
  CONSTRAINT bots_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bot_id uuid,
  contact_number text NOT NULL,
  contact_name text,
  unread_count integer DEFAULT 0,
  last_message text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  chat_id text,
  contact_id uuid,
  is_group boolean DEFAULT false,
  archived boolean DEFAULT false,
  pinned boolean DEFAULT false,
  muted boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_message_time timestamp with time zone,
  name character varying,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT chats_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.contact_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  note text NOT NULL,
  created_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_notes_pkey PRIMARY KEY (id),
  CONSTRAINT contact_notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.contact_tags (
  contact_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_tags_pkey PRIMARY KEY (contact_id, tag_id),
  CONSTRAINT contact_tags_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT contact_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid,
  phone_number text NOT NULL,
  name text,
  push_name text,
  is_business boolean DEFAULT false,
  is_enterprise boolean DEFAULT false,
  profile_picture_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
);
CREATE TABLE public.media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid,
  message_id uuid,
  file_url text NOT NULL,
  file_name text,
  mimetype text,
  file_size bigint,
  thumbnail_url text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT media_files_pkey PRIMARY KEY (id),
  CONSTRAINT media_files_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT media_files_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bot_id uuid,
  message_id text NOT NULL,
  from_number text NOT NULL,
  to_number text NOT NULL,
  content text,
  media_url text,
  message_type text NOT NULL,
  status text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  chat_id uuid,
  contact_id uuid,
  body text,
  type text DEFAULT 'text'::text,
  from_me boolean DEFAULT false,
  ack integer DEFAULT 0,
  has_media boolean DEFAULT false,
  media_mimetype text,
  caption text,
  quoted_message_id text,
  is_forwarded boolean DEFAULT false,
  broadcast boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  role_id uuid,
  worker_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT profiles_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid,
  name text NOT NULL,
  color text DEFAULT '#3B82F6'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
);
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid,
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT webhook_events_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
);
CREATE TABLE public.workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone_number character varying,
  role character varying DEFAULT 'agent'::character varying,
  status character varying DEFAULT 'active'::character varying,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT workers_pkey PRIMARY KEY (id)
);
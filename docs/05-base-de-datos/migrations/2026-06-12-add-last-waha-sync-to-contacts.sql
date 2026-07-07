-- Agregar columna last_waha_sync para registrar última sincronización con WAHA
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS last_waha_sync timestamp with time zone DEFAULT NULL;

-- Agregar columna profile_picture_hash para detectar cambios en foto de perfil
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS profile_picture_hash text DEFAULT NULL;

-- Crear índice para optimizar consultas por last_waha_sync
CREATE INDEX IF NOT EXISTS idx_contacts_last_waha_sync ON public.contacts (last_waha_sync);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name IN ('last_waha_sync', 'profile_picture_hash');

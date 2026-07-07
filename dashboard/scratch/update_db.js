const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar .env desde el directorio raíz o dashboard
const envPath = path.resolve(__dirname, '../../.env');
const dashboardEnvPath = path.resolve(__dirname, '../../dashboard/.env');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else if (fs.existsSync(dashboardEnvPath)) dotenv.config({ path: dashboardEnvPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
  console.log('🔄 Iniciando actualización de esquema en:', supabaseUrl);

  const sql = `
    -- Actualizar conversation_evaluations
    ALTER TABLE conversation_evaluations 
    ADD COLUMN IF NOT EXISTS lead_respondio BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS seguimiento_estructurado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS preguntas_negociacion BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS calidad_cotizacion BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS manejo_objeciones BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS venta BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS numero_telefono TEXT;

    -- Actualizar performance_analyses (contadores)
    ALTER TABLE performance_analyses
    ADD COLUMN IF NOT EXISTS lead_respondio_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seguimiento_estructurado_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS preguntas_negociacion_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS calidad_cotizacion_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS manejo_objeciones_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS venta_count INTEGER DEFAULT 0;

    -- Comentarios de documentación
    COMMENT ON COLUMN conversation_evaluations.lead_respondio IS 'Si el lead respondió a la gestión';
    COMMENT ON COLUMN conversation_evaluations.seguimiento_estructurado IS 'Si se realizó un seguimiento estructurado';
    COMMENT ON COLUMN conversation_evaluations.preguntas_negociacion IS 'Si se realizaron preguntas de negociación';
    COMMENT ON COLUMN conversation_evaluations.calidad_cotizacion IS 'Calidad cualitativa de la cotización';
    COMMENT ON COLUMN conversation_evaluations.manejo_objeciones IS 'Capacidad de manejo de objeciones';
    COMMENT ON COLUMN conversation_evaluations.venta IS 'Si se concretó el cierre de venta';
  `;

  // Intentar ejecutar vía un helper RPC si existe, o avisar que se requiere manual
  // Supabase no permite SQL crudo vía SDK por seguridad a menos que haya un RPC 'exec_sql'
  
  console.log('⚠️ El SDK de Supabase no permite ejecutar SQL crudo directamente sin un RPC definido.');
  console.log('Intentando verificar si las tablas existen primero...');

  const { data, error } = await supabase.from('conversation_evaluations').select('id').limit(1);
  
  if (error && error.code === 'PGRST116') {
      console.log('✅ La tabla existe pero está vacía (o no tiene el ID correcto).');
  } else if (error) {
      console.error('❌ Error verificando tabla:', error.message);
      if (error.message.includes('not found')) {
          console.log('🚀 Sugiriendo ejecución manual del script SQL proporcionado.');
      }
  } else {
      console.log('✅ Conexión con la base de datos establecida correctamente.');
  }

  console.log('\n📄 SQL A EJECUTAR (Copiar y pegar en Supabase SQL Editor):\n');
  console.log(sql);
}

updateSchema();

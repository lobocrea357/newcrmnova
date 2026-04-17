const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env manualmente
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/^"|"$/g, '');
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTableSchema(tableName) {
  console.log(`\n🔍 Inspeccionando esquema real de: ${tableName}`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`❌ Error al acceder a ${tableName}:`, error.message);
    return;
  }
  if (data && data.length > 0) {
    console.log(`✅ Columnas [${Object.keys(data[0]).length}]:`);
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log(`⚠️ La tabla ${tableName} está vacía.`);
  }
}

async function run() {
  await inspectTableSchema('conversation_evaluations');
  await inspectTableSchema('performance_analyses');
  await inspectTableSchema('performance_reports');
}

run();

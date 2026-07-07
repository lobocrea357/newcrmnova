const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSales() {
  console.log('🔍 Probando consulta de ventas...');
  const { data, error } = await supabase
    .from("chats")
    .select("id, ai_analysis")
    .not("ai_analysis", "is", null)
    .eq("ai_analysis->sale_completed", true)
    .limit(5);

  if (error) {
    console.log('❌ Error Detectado:', JSON.stringify(error, null, 2));
    console.log('Detalles:', error.message, error.details, error.hint);
  } else {
    console.log('✅ Consulta exitosa. Filas encontradas:', data.length);
    console.log('Muestra:', data[0]);
  }
}

debugSales();

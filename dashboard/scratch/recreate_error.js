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

// USAR ANON_KEY para recrear el error del frontend
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function recreateError() {
  console.log('🧪 Recreando error con ANON_KEY...');
  
  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .not("ai_analysis", "is", null)
    .eq("ai_analysis->sale_completed", true);

  if (error) {
    console.log('🔴 ERROR CAPTURADO:');
    console.log('Mensaje:', error.message);
    console.log('Detalles:', error.details);
    console.log('Hint:', error.hint);
    console.log('Código:', error.code);
  } else {
    console.log('✅ Inesperadamente tuvo éxito con ANON_KEY. Filas:', data.length);
  }
}

recreateError();

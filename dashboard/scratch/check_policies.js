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

async function checkPolicies() {
  console.log('🔍 Revisando políticas de la tabla chats...');
  
  const query = `
    SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
    FROM pg_policies 
    WHERE tablename = 'chats';
  `;

  // Intentar usar rpc run_sql si existe, o similar
  // En muchos entornos Supabase, podemos usar raw SQL para investigar esquema si tenemos service_role
  const { data, error } = await supabase.rpc('run_raw_sql', { sql_query: query });
  
  if (error) {
    // Si no hay rpc, intentaremos una alternativa: ver si podemos consultar las políticas indirectamente
    console.log('⚠️ No se pudo ejecutar RPC run_raw_sql. Intentando alternativa...');
    // A veces podemos usar el editor SQL pero aquí estamos en código.
    // Intentemos obtener info de tablas y ver si RLS está activo
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', { t_name: 'chats' });
    console.log('Info de tabla:', tableInfo || tableError);
  } else {
    console.log('✅ Políticas encontradas:');
    console.table(data);
  }
}

checkPolicies();

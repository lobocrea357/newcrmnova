import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Probando autenticación y acceso a datos...\n');

  try {
    // Intentar autenticación con credenciales de prueba
    console.log('1. Intentando autenticación...');
    
    // Primero, intentemos ver si hay usuarios registrados o si necesitamos crear uno
    console.log('2. Verificando configuración de autenticación...');
    
    // Intentar obtener datos sin autenticación pero con más detalles del error
    console.log('3. Probando acceso detallado a bots...');
    const { data: bots, error: botsError, status, statusText } = await supabase
      .from('bots')
      .select('*');

    console.log('Status:', status);
    console.log('StatusText:', statusText);
    
    if (botsError) {
      console.error('❌ Error completo:', {
        message: botsError.message,
        details: botsError.details,
        hint: botsError.hint,
        code: botsError.code
      });
    } else {
      console.log(`✅ Bots obtenidos: ${bots.length}`);
    }

    // Verificar si RLS está habilitado
    console.log('\n4. Verificando políticas de seguridad...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'bots' })
      .select();

    if (policiesError) {
      console.log('No se pudieron obtener políticas (normal si no hay función RPC)');
    } else {
      console.log('Políticas encontradas:', policies);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testAuth();

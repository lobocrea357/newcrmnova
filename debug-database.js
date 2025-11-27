import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDatabase() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE BASE DE DATOS\n');
  console.log('='.repeat(50));

  try {
    // 1. Verificar conexión básica
    console.log('\n1. 🌐 VERIFICANDO CONEXIÓN A SUPABASE');
    console.log('-'.repeat(30));
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

    // 2. Verificar si las tablas existen
    console.log('\n2. 📋 VERIFICANDO EXISTENCIA DE TABLAS');
    console.log('-'.repeat(30));
    
    const tables = ['workers', 'bots', 'chats', 'contacts', 'messages'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
          if (error.code) console.log(`   Código: ${error.code}`);
          if (error.details) console.log(`   Detalles: ${error.details}`);
        } else {
          console.log(`✅ ${table}: Existe (${count || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: EXCEPCIÓN - ${err.message}`);
      }
    }

    // 3. Verificar estructura de tabla contacts (para ver si push_name existe)
    console.log('\n3. 🏗️ VERIFICANDO ESTRUCTURA DE TABLA CONTACTS');
    console.log('-'.repeat(30));
    
    try {
      const { data: contactSample, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);
      
      if (contactError) {
        console.log(`❌ Error obteniendo muestra de contacts: ${contactError.message}`);
      } else if (contactSample && contactSample.length > 0) {
        console.log('✅ Campos disponibles en contacts:');
        Object.keys(contactSample[0]).forEach(field => {
          console.log(`   - ${field}`);
        });
      } else {
        console.log('⚠️ Tabla contacts existe pero está vacía');
        
        // Intentar obtener la estructura de otra manera
        console.log('\nIntentando obtener estructura con query específica...');
        const { data, error } = await supabase
          .from('contacts')
          .select('id, name, phone_number, profile_picture_url')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error con campos básicos: ${error.message}`);
        } else {
          console.log('✅ Campos básicos funcionan');
        }

        // Probar push_name específicamente
        const { data: pushTest, error: pushError } = await supabase
          .from('contacts')
          .select('push_name')
          .limit(1);
        
        if (pushError) {
          console.log(`❌ Campo 'push_name' NO existe: ${pushError.message}`);
        } else {
          console.log('✅ Campo push_name existe');
        }
      }
    } catch (err) {
      console.log(`❌ Excepción verificando contacts: ${err.message}`);
    }

    // 4. Verificar políticas RLS
    console.log('\n4. 🔒 VERIFICANDO POLÍTICAS DE SEGURIDAD (RLS)');
    console.log('-'.repeat(30));
    
    // Intentar insertar un registro de prueba para ver si RLS bloquea
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('workers')
        .insert([{ name: 'TEST_WORKER', email: 'test@test.com' }])
        .select();
      
      if (insertError) {
        console.log(`❌ RLS activo o permisos restringidos: ${insertError.message}`);
        if (insertError.code) console.log(`   Código: ${insertError.code}`);
      } else {
        console.log('✅ Inserción de prueba exitosa (eliminando...)');
        // Eliminar el registro de prueba
        await supabase
          .from('workers')
          .delete()
          .eq('email', 'test@test.com');
      }
    } catch (err) {
      console.log(`❌ Error en prueba de inserción: ${err.message}`);
    }

    // 5. Verificar si hay datos históricos
    console.log('\n5. 📊 BUSCANDO DATOS HISTÓRICOS');
    console.log('-'.repeat(30));
    
    for (const table of ['workers', 'bots']) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`✅ ${table}: ${data.length} registros encontrados`);
          console.log(`   Último registro:`, data[0]);
        } else {
          console.log(`⚠️ ${table}: Tabla vacía`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 RESUMEN DEL DIAGNÓSTICO COMPLETADO');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN DIAGNÓSTICO:', error);
  }
}

debugDatabase();

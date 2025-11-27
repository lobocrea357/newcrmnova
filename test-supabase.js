import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('🔍 Probando conexión a Supabase...\n');

  try {
    // Test 1: Verificar si podemos acceder a cualquier tabla
    console.log('1. Probando acceso a tabla workers...');
    const { data: workers, error: workersError, count: workersCount } = await supabase
      .from('workers')
      .select('*', { count: 'exact' })
      .limit(5);

    if (workersError) {
      console.error('❌ Error en workers:', workersError.message);
    } else {
      console.log(`✅ Workers: ${workers.length} encontrados de ${workersCount} total`);
      if (workers.length > 0) {
        console.log('Primer worker:', workers[0]);
      }
    }

    // Test 2: Probar tabla bots
    console.log('\n2. Probando acceso a tabla bots...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .limit(5);

    if (botsError) {
      console.error('❌ Error en bots:', botsError.message);
    } else {
      console.log(`✅ Bots: ${bots.length} encontrados`);
      if (bots.length > 0) {
        console.log('Primer bot:', bots[0]);
      }
    }

    // Test 3: Probar tabla chats
    console.log('\n3. Probando acceso a tabla chats...');
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(5);

    if (chatsError) {
      console.error('❌ Error en chats:', chatsError.message);
    } else {
      console.log(`✅ Chats: ${chats.length} encontrados`);
      if (chats.length > 0) {
        console.log('Primer chat:', chats[0]);
      }
    }

    // Test 4: Probar tabla contacts
    console.log('\n4. Probando acceso a tabla contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.error('❌ Error en contacts:', contactsError.message);
    } else {
      console.log(`✅ Contacts: ${contacts.length} encontrados`);
      if (contacts.length > 0) {
        console.log('Primer contact:', contacts[0]);
        console.log('Campos disponibles:', Object.keys(contacts[0]));
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testSupabase();

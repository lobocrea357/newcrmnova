import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Configuración:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminAuth() {
  console.log('\n🔐 === TEST DE AUTENTICACIÓN ADMIN ===\n');

  const adminEmail = 'admin@novapolointranet.xyz';
  const adminPassword = '2025.NoVapol0';

  try {
    // 1. Intentar login
    console.log('1️⃣ Intentando login con credenciales admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }

    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', authData.user.email);
    console.log('🎫 Session ID:', authData.session.access_token.substring(0, 20) + '...');

    // 2. Verificar sesión actual
    console.log('\n2️⃣ Verificando sesión actual...');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📋 Sesión activa:', sessionData.session?.user?.email);

    // 3. Probar acceso a datos con RLS
    console.log('\n3️⃣ Probando acceso a datos con RLS...');

    // Test: Workers
    console.log('\n👷 Probando acceso a WORKERS:');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(5);

    if (workersError) {
      console.error('❌ Error accediendo workers:', workersError.message);
    } else {
      console.log(`✅ Workers obtenidos: ${workers.length}`);
      workers.forEach(w => console.log(`  - ${w.name} (${w.email})`));
    }

    // Test: Bots
    console.log('\n🤖 Probando acceso a BOTS:');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .limit(5);

    if (botsError) {
      console.error('❌ Error accediendo bots:', botsError.message);
    } else {
      console.log(`✅ Bots obtenidos: ${bots.length}`);
      bots.forEach(b => console.log(`  - ${b.name} (${b.session_name}) - Status: ${b.status}`));
    }

    // Test: Chats
    console.log('\n💬 Probando acceso a CHATS:');
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(5);

    if (chatsError) {
      console.error('❌ Error accediendo chats:', chatsError.message);
    } else {
      console.log(`✅ Chats obtenidos: ${chats.length}`);
      chats.forEach(c => console.log(`  - ${c.contact_name || c.contact_number} (Bot: ${c.bot_id})`));
    }

    // Test: Messages
    console.log('\n📨 Probando acceso a MESSAGES:');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.error('❌ Error accediendo messages:', messagesError.message);
    } else {
      console.log(`✅ Messages obtenidos: ${messages.length}`);
      messages.forEach(m => console.log(`  - ${m.body?.substring(0, 50)}... (${m.from_me ? 'Enviado' : 'Recibido'})`));
    }

    // Test: Contacts
    console.log('\n👥 Probando acceso a CONTACTS:');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.error('❌ Error accediendo contacts:', contactsError.message);
    } else {
      console.log(`✅ Contacts obtenidos: ${contacts.length}`);
      contacts.forEach(c => console.log(`  - ${c.name || c.number} (${c.number})`));
    }

    // 4. Probar vistas especiales
    console.log('\n4️⃣ Probando vistas especiales...');

    // Test: Bot Statistics
    console.log('\n📊 Probando BOT_STATISTICS:');
    const { data: botStats, error: botStatsError } = await supabase
      .from('bot_statistics')
      .select('*')
      .limit(5);

    if (botStatsError) {
      console.error('❌ Error accediendo bot_statistics:', botStatsError.message);
    } else {
      console.log(`✅ Bot Statistics obtenidos: ${botStats.length}`);
      botStats.forEach(s => console.log(`  - Bot ${s.bot_name}: ${s.total_contacts} contactos, ${s.total_chats} chats`));
    }

    // Test: Recent Conversations
    console.log('\n🔄 Probando RECENT_CONVERSATIONS:');
    const { data: recentConvs, error: recentConvsError } = await supabase
      .from('recent_conversations')
      .select('*')
      .limit(5);

    if (recentConvsError) {
      console.error('❌ Error accediendo recent_conversations:', recentConvsError.message);
    } else {
      console.log(`✅ Recent Conversations obtenidos: ${recentConvs.length}`);
      recentConvs.forEach(r => console.log(`  - ${r.contact_name || r.contact_number}: ${r.last_message?.substring(0, 30)}...`));
    }

    // 5. Verificar rol del usuario
    console.log('\n5️⃣ Verificando rol del usuario...');
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message);
    } else {
      console.log('✅ Perfil del usuario:');
      console.log(`  - Email: ${userProfile.email}`);
      console.log(`  - Rol: ${userProfile.role?.name || 'Sin rol'}`);
      console.log(`  - Worker ID: ${userProfile.worker_id || 'Sin worker'}`);
    }

    // 6. Logout
    console.log('\n6️⃣ Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el test
testAdminAuth().then(() => {
  console.log('\n🏁 Test completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

import supabase from './src/config/supabase.js';

/**
 * Script para fusionar chats y contactos duplicados causados por diferentes formatos de ID
 * (@lid vs @c.us para el mismo contacto)
 * 
 * El problema: WhatsApp usa @lid para mensajes entrantes y @c.us para salientes
 * Esto causa que se creen contactos y chats separados para la misma persona
 */

// Mapeo conocido de @lid a números reales (obtenido de los logs)
// remoteJidAlt contiene el número real cuando from es @lid
const LID_TO_PHONE_MAP = {
  '108074429898770': '584244578726',  // Robert
  '194944908132543': '584144246102',  // Rphv -> mismo que el otro contacto
};

async function mergeDuplicates() {
  try {
    console.log('🔍 Fusionando contactos y chats duplicados...\n');
    
    const botId = '19a794c8-8fa9-4f10-aeba-0875a5e1fed2';
    
    for (const [lidNumber, realPhone] of Object.entries(LID_TO_PHONE_MAP)) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 Procesando: ${lidNumber} -> ${realPhone}`);
      
      // Buscar el contacto con @lid
      const { data: lidContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .eq('phone_number', lidNumber)
        .maybeSingle();
      
      // Buscar el contacto con número real
      const { data: realContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .eq('phone_number', realPhone)
        .maybeSingle();
      
      if (!lidContact) {
        console.log(`   ⚠️ No existe contacto con @lid: ${lidNumber}`);
        continue;
      }
      
      console.log(`   📱 Contacto @lid: ${lidContact.name} (${lidContact.id})`);
      
      if (realContact) {
        console.log(`   📱 Contacto real: ${realContact.name} (${realContact.id})`);
        
        // Buscar chat con @lid
        const { data: lidChat } = await supabase
          .from('chats')
          .select('*')
          .eq('bot_id', botId)
          .eq('contact_id', lidContact.id)
          .maybeSingle();
        
        // Buscar chat con número real
        const { data: realChat } = await supabase
          .from('chats')
          .select('*')
          .eq('bot_id', botId)
          .eq('contact_id', realContact.id)
          .maybeSingle();
        
        if (lidChat && realChat) {
          console.log(`   💬 Chat @lid: ${lidChat.id}`);
          console.log(`   💬 Chat real: ${realChat.id}`);
          
          // Mover mensajes del chat @lid al chat real
          const { data: movedMsgs } = await supabase
            .from('messages')
            .update({ 
              chat_id: realChat.id,
              contact_id: realContact.id 
            })
            .eq('chat_id', lidChat.id)
            .select('id');
          
          console.log(`   ✅ Movidos ${movedMsgs?.length || 0} mensajes`);
          
          // Eliminar chat @lid
          await supabase.from('chats').delete().eq('id', lidChat.id);
          console.log(`   ✅ Chat @lid eliminado`);
        }
        
        // Eliminar contacto @lid
        await supabase.from('contacts').delete().eq('id', lidContact.id);
        console.log(`   ✅ Contacto @lid eliminado`);
        
      } else {
        // No existe contacto real, solo actualizar el @lid
        console.log(`   📱 No existe contacto real, actualizando @lid...`);
        
        // Actualizar contacto
        await supabase
          .from('contacts')
          .update({ phone_number: realPhone })
          .eq('id', lidContact.id);
        
        // Actualizar chat
        await supabase
          .from('chats')
          .update({ 
            contact_number: realPhone,
            chat_id: `${realPhone}@c.us`
          })
          .eq('contact_id', lidContact.id);
        
        console.log(`   ✅ Contacto y chat actualizados con número real`);
      }
    }
    
    console.log('\n\n✅ Fusión completada!');
    
    // Mostrar estado final
    const { data: finalChats } = await supabase
      .from('chats')
      .select('id, contact_number, contact_name, chat_id')
      .eq('bot_id', botId);
    
    console.log('\n📊 Estado final de chats:');
    finalChats?.forEach(c => {
      console.log(`   - ${c.contact_name || c.contact_number}: ${c.chat_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

mergeDuplicates();

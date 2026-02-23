import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnections() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE CONVERSACIONES')
  console.log('=' * 60)

  try {
    // 1. Verificar conexión
    console.log('\n1. 🔌 VERIFICANDO CONEXIÓN A SUPABASE...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('bots')
      .select('id')
      .limit(1)

    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError)
      return
    }
    console.log('✅ Conexión exitosa')

    // 2. Verificar estructura de tablas principales
    console.log('\n2. 📊 VERIFICANDO ESTRUCTURA DE TABLAS...')
    
    // Contar registros en cada tabla
    const tables = ['bots', 'contacts', 'chats', 'messages']
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ Error en tabla ${table}:`, error)
      } else {
        console.log(`📋 ${table}: ${count || 0} registros`)
      }
    }

    // 3. Obtener muestra de bots
    console.log('\n3. 🤖 MUESTRA DE BOTS:')
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .limit(3)

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError)
    } else {
      console.log('Bots encontrados:', bots?.length || 0)
      bots?.forEach((bot, index) => {
        console.log(`  Bot ${index + 1}:`, {
          id: bot.id,
          session_name: bot.session_name,
          phone_number: bot.phone_number,
          status: bot.status,
          worker_id: bot.worker_id
        })
      })
    }

    // 4. Obtener muestra de contactos
    console.log('\n4. 👥 MUESTRA DE CONTACTOS:')
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5)

    if (contactsError) {
      console.error('❌ Error obteniendo contactos:', contactsError)
    } else {
      console.log('Contactos encontrados:', contacts?.length || 0)
      contacts?.forEach((contact, index) => {
        console.log(`  Contacto ${index + 1}:`, {
          id: contact.id,
          bot_id: contact.bot_id,
          phone_number: contact.phone_number,
          name: contact.name,
          push_name: contact.push_name
        })
      })
    }

    // 5. Obtener muestra de chats con relaciones
    console.log('\n5. 💬 MUESTRA DE CHATS CON RELACIONES:')
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        bot:bots(id, session_name, phone_number),
        contact:contacts(id, name, phone_number, profile_picture_url)
      `)
      .limit(5)

    if (chatsError) {
      console.error('❌ Error obteniendo chats:', chatsError)
    } else {
      console.log('Chats encontrados:', chats?.length || 0)
      chats?.forEach((chat, index) => {
        console.log(`\n  Chat ${index + 1}:`)
        console.log('    ID:', chat.id)
        console.log('    Chat ID (WhatsApp):', chat.chat_id)
        console.log('    Bot ID:', chat.bot_id)
        console.log('    Contact ID:', chat.contact_id)
        console.log('    Chat Name:', chat.name)
        console.log('    Is Group:', chat.is_group)
        console.log('    Last Message Time:', chat.last_message_time)
        console.log('    Bot Info:', chat.bot ? {
          session_name: chat.bot.session_name,
          phone_number: chat.bot.phone_number
        } : 'No bot info')
        console.log('    Contact Info:', chat.contact ? {
          name: chat.contact.name,
          phone_number: chat.contact.phone_number
        } : 'No contact info')
      })
    }

    // 6. Obtener muestra de mensajes
    console.log('\n6. 📨 MUESTRA DE MENSAJES:')
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
    } else {
      console.log('Mensajes encontrados:', messages?.length || 0)
      messages?.forEach((message, index) => {
        console.log(`\n  Mensaje ${index + 1}:`)
        console.log('    ID:', message.id)
        console.log('    Chat ID:', message.chat_id)
        console.log('    Bot ID:', message.bot_id)
        console.log('    From Me:', message.from_me)
        console.log('    From Number:', message.from_number)
        console.log('    To Number:', message.to_number)
        console.log('    Body:', message.body?.substring(0, 100) + (message.body?.length > 100 ? '...' : ''))
        console.log('    Type:', message.type)
        console.log('    Timestamp:', message.timestamp)
        console.log('    Has Media:', message.has_media)
      })
    }

    // 7. Verificar relaciones entre tablas
    console.log('\n7. 🔗 VERIFICANDO RELACIONES:')
    
    // Chats sin contacto
    const { count: chatsWithoutContact } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .is('contact_id', null)

    console.log(`📊 Chats sin contact_id: ${chatsWithoutContact || 0}`)

    // Mensajes sin chat
    const { count: messagesWithoutChat } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .is('chat_id', null)

    console.log(`📊 Mensajes sin chat_id: ${messagesWithoutChat || 0}`)

    // 8. Probar función específica de conversación
    console.log('\n8. 🎯 PROBANDO FUNCIÓN getConversationWithMessages:')
    
    if (chats && chats.length > 0) {
      const testChatId = chats[0].id
      console.log(`Probando con chat ID: ${testChatId}`)

      // Simular la función getConversationWithMessages
      const { data: conversationData, error: convError } = await supabase
        .from('chats')
        .select(`
          *,
          bot:bots(*),
          contact:contacts(*)
        `)
        .eq('id', testChatId)
        .single()

      if (convError) {
        console.error('❌ Error obteniendo conversación:', convError)
      } else {
        console.log('✅ Conversación obtenida:', {
          chat_id: conversationData.chat_id,
          bot_session: conversationData.bot?.session_name,
          contact_name: conversationData.contact?.name,
          contact_phone: conversationData.contact?.phone_number
        })

        // Obtener mensajes de esta conversación
        const { data: chatMessages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', testChatId)
          .order('timestamp', { ascending: false })
          .limit(10)

        if (msgError) {
          console.error('❌ Error obteniendo mensajes del chat:', msgError)
        } else {
          console.log(`✅ Mensajes del chat: ${chatMessages?.length || 0}`)
          
          const incomingCount = chatMessages?.filter(m => !m.from_me).length || 0
          const outgoingCount = chatMessages?.filter(m => m.from_me).length || 0
          
          console.log(`   📨 ${incomingCount} mensajes entrantes (cliente → bot)`)
          console.log(`   📤 ${outgoingCount} mensajes salientes (bot → cliente)`)

          // Mostrar algunos mensajes de ejemplo
          if (chatMessages && chatMessages.length > 0) {
            console.log('\n   📝 EJEMPLOS DE MENSAJES:')
            chatMessages.slice(0, 3).forEach((msg, index) => {
              console.log(`     ${index + 1}. ${msg.from_me ? '🤖 Bot' : '👤 Cliente'}: ${msg.body?.substring(0, 50)}...`)
              console.log(`        Timestamp: ${msg.timestamp}`)
            })
          }
        }
      }
    }

    // 9. Verificar problemas comunes
    console.log('\n9. ⚠️ VERIFICANDO PROBLEMAS COMUNES:')
    
    // Chats con mensajes pero sin nombre
    const { data: problematicChats } = await supabase
      .from('chats')
      .select(`
        id,
        chat_id,
        name,
        contact_id,
        contact:contacts(name, phone_number)
      `)
      .is('name', null)
      .is('contact.name', null)
      .limit(5)

    if (problematicChats && problematicChats.length > 0) {
      console.log(`⚠️ Encontrados ${problematicChats.length} chats problemáticos (sin nombre):`)
      for (const chat of problematicChats) {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)

        console.log(`   - Chat ID: ${chat.id}, WhatsApp ID: ${chat.chat_id}, Mensajes: ${msgCount || 0}`)
      }
    } else {
      console.log('✅ No se encontraron chats problemáticos')
    }

    console.log('\n🎉 DIAGNÓSTICO COMPLETADO')
    console.log('=' * 60)

  } catch (error) {
    console.error('💥 Error general en el diagnóstico:', error)
  }
}

// Ejecutar el diagnóstico
testDatabaseConnections()

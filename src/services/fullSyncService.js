import wahaClient from '../config/waha.js';
import WahaContactService from './wahaContactService.js';
import supabase from '../config/supabase.js';
import { BotService } from './botService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import { MessageService } from './messageService.js';
import { MediaService } from './mediaService.js';

const botService = new BotService();
const contactService = new ContactService();
const chatService = new ChatService();
const messageService = new MessageService();
const mediaService = new MediaService();

/**
 * Servicio de sincronización COMPLETA desde WAHA
 * 
 * FASE 1+2 - OPTIMIZACIONES Y CORRECCIONES:
 * 1. Caché de contactos y chats existentes (evita queries individuales)
 * 2. Procesamiento de TODOS los mensajes (no solo nuevos)
 * 3. Normalización de IDs @lid a @c.us (previene duplicados)
 * 4. Corrección de nombres de chat (si tiene nombre del bot)
 * 5. Detección y fusión de chats duplicados
 * 6. Procesamiento paralelo por batches
 */
export class FullSyncService {
  
  constructor() {
    // Caché en memoria para la sesión de sincronización actual
    this.contactsCache = new Map();
    this.chatsCache = new Map();
    this.existingMessagesCache = new Map(); // Cambiado a Map para guardar más info
    this.botPushName = null; // Nombre del bot para detectar nombres incorrectos
  }

  /**
   * Limpia las cachés (llamar al inicio de cada sincronización)
   */
  clearCaches() {
    this.contactsCache.clear();
    this.chatsCache.clear();
    this.existingMessagesCache.clear();
    this.botPushName = null;
  }

  /**
   * OPTIMIZACIÓN: Carga todos los contactos de un bot en caché
   */
  async loadContactsCache(botId) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('bot_id', botId);
    
    this.contactsCache.clear();
    (contacts || []).forEach(c => {
      this.contactsCache.set(c.phone_number, c);
    });
    
    return this.contactsCache.size;
  }

  /**
   * OPTIMIZACIÓN: Carga todos los chats de un bot en caché
   */
  async loadChatsCache(botId) {
    const { data: chats } = await supabase
      .from('chats')
      .select('*')
      .eq('bot_id', botId);
    
    this.chatsCache.clear();
    (chats || []).forEach(c => {
      this.chatsCache.set(c.contact_number, c);
    });
    
    return this.chatsCache.size;
  }

  /**
   * OPTIMIZACIÓN: Carga mensajes existentes de un chat en batch
   * Ahora guarda message_id -> {id, from_me, body} para poder verificar si necesita actualización
   */
  async loadExistingMessagesForChat(chatDbId) {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, message_id, from_me, body, content')
      .eq('chat_id', chatDbId);
    
    (messages || []).forEach(m => {
      if (m.message_id) {
        this.existingMessagesCache.set(m.message_id, {
          id: m.id,
          from_me: m.from_me,
          body: m.body || m.content
        });
      }
    });
    
    return messages?.length || 0;
  }

  /**
   * Verifica si un mensaje existe y obtiene sus datos
   */
  getExistingMessage(messageId) {
    return this.existingMessagesCache.get(messageId) || null;
  }

  /**
   * FASE 2: Verifica si un nombre es el nombre del bot (incorrecto para un contacto)
   */
  isInvalidContactName(name) {
    if (!name || !this.botPushName) return false;
    const normalize = (str) => str?.toLowerCase().replace(/[^\w\s]/g, '').trim();
    return normalize(name) === normalize(this.botPushName);
  }

  /**
   * FASE 2: Normaliza un chatId de @lid a @c.us si tiene remoteJidAlt
   * Si no se puede normalizar, busca en caché o usa el @lid como está (no omite)
   */
  normalizeChatId(chatId, wahaChat = null, messages = null) {
    // Si no es @lid, devolver tal cual
    if (!chatId?.includes('@lid')) {
      return chatId;
    }
    
    const lidNumber = chatId.split('@')[0];
    
    // Intentar obtener el número real desde wahaChat
    let altId = wahaChat?.lastMessage?._data?.key?.remoteJidAlt ||
                wahaChat?._data?.key?.remoteJidAlt ||
                wahaChat?.id?.remoteJidAlt;
    
    // Si no hay altId en wahaChat, buscar en los mensajes
    if (!altId && messages && messages.length > 0) {
      for (const msg of messages) {
        const msgAltId = msg._data?.key?.remoteJidAlt || 
                         msg.from?.replace('@lid', '@c.us');
        if (msgAltId && (msgAltId.includes('@s.whatsapp.net') || msgAltId.includes('@c.us'))) {
          altId = msgAltId;
          break;
        }
      }
    }
    
    if (altId && (altId.includes('@s.whatsapp.net') || altId.includes('@c.us'))) {
      const realNumber = altId.split('@')[0];
      console.log(`   ✅ Normalizado @lid -> @c.us: ${lidNumber} -> ${realNumber}`);
      return `${realNumber}@c.us`;
    }
    
    // Si no se puede normalizar, buscar si ya existe un chat con este @lid en la BD
    const existingChat = this.chatsCache.get(lidNumber);
    if (existingChat) {
      console.log(`   ℹ️ Chat @lid encontrado en caché: ${lidNumber} -> usando chat existente`);
      return existingChat.chat_id || chatId;
    }
    
    // Como último recurso, usar el @lid como está (para no perder datos)
    console.log(`   ⚠️ Chat @lid no normalizable, se usará como está: ${chatId}`);
    return chatId;
  }

  /**
   * FUSIÓN DE DUPLICADOS: Fusiona chats duplicados por contact_number
   * Mueve mensajes del chat duplicado al chat principal y elimina el duplicado
   */
  async mergeDuplicateChats(botId) {
    console.log('\n🔄 ========== FUSIONANDO CHATS DUPLICADOS ==========');
    
    // 1. Obtener todos los chats agrupados por contact_number
    const { data: allChats } = await supabase
      .from('chats')
      .select('id, contact_number, contact_name, chat_id, created_at')
      .eq('bot_id', botId)
      .order('created_at', { ascending: true });
    
    if (!allChats || allChats.length === 0) {
      console.log('   ℹ️ No hay chats para verificar');
      return { merged: 0, messagessMoved: 0 };
    }
    
    // 2. Agrupar por contact_number
    const chatsByNumber = {};
    allChats.forEach(chat => {
      if (!chatsByNumber[chat.contact_number]) {
        chatsByNumber[chat.contact_number] = [];
      }
      chatsByNumber[chat.contact_number].push(chat);
    });
    
    // 3. Encontrar duplicados (grupos con más de 1 chat)
    const duplicateGroups = Object.entries(chatsByNumber)
      .filter(([_, chats]) => chats.length > 1);
    
    if (duplicateGroups.length === 0) {
      console.log('   ✅ No hay chats duplicados');
      return { merged: 0, messagesMoved: 0 };
    }
    
    console.log(`   🔍 Encontrados ${duplicateGroups.length} grupos de chats duplicados`);
    
    let totalMerged = 0;
    let totalMessagesMoved = 0;
    
    // 4. Fusionar cada grupo
    for (const [contactNumber, chats] of duplicateGroups) {
      // El chat principal es el primero (más antiguo)
      const mainChat = chats[0];
      const duplicateChats = chats.slice(1);
      
      console.log(`   📋 Fusionando ${duplicateChats.length} duplicados de "${mainChat.contact_name || contactNumber}" al chat ${mainChat.id}`);
      
      for (const dupChat of duplicateChats) {
        // Mover mensajes del chat duplicado al principal
        const { data: movedMessages, error: moveError } = await supabase
          .from('messages')
          .update({ chat_id: mainChat.id })
          .eq('chat_id', dupChat.id)
          .select('id');
        
        if (moveError) {
          console.error(`   ❌ Error moviendo mensajes: ${moveError.message}`);
          continue;
        }
        
        const movedCount = movedMessages?.length || 0;
        totalMessagesMoved += movedCount;
        
        // Eliminar el chat duplicado
        const { error: deleteError } = await supabase
          .from('chats')
          .delete()
          .eq('id', dupChat.id);
        
        if (deleteError) {
          console.error(`   ❌ Error eliminando chat duplicado: ${deleteError.message}`);
          continue;
        }
        
        totalMerged++;
        console.log(`      ✅ Chat ${dupChat.id} fusionado (${movedCount} mensajes movidos)`);
      }
    }
    
    console.log(`\n   ✅ Fusión completada: ${totalMerged} chats eliminados, ${totalMessagesMoved} mensajes movidos`);
    console.log('==========================================\n');
    
    return { merged: totalMerged, messagesMoved: totalMessagesMoved };
  }

  /**
   * FUSIÓN DE DUPLICADOS: Fusiona contactos duplicados por phone_number
   */
  async mergeDuplicateContacts(botId) {
    console.log('\n🔄 ========== FUSIONANDO CONTACTOS DUPLICADOS ==========');
    
    // 1. Obtener todos los contactos agrupados por phone_number
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('id, phone_number, name, created_at')
      .eq('bot_id', botId)
      .order('created_at', { ascending: true });
    
    if (!allContacts || allContacts.length === 0) {
      console.log('   ℹ️ No hay contactos para verificar');
      return { merged: 0 };
    }
    
    // 2. Agrupar por phone_number
    const contactsByNumber = {};
    allContacts.forEach(contact => {
      if (!contactsByNumber[contact.phone_number]) {
        contactsByNumber[contact.phone_number] = [];
      }
      contactsByNumber[contact.phone_number].push(contact);
    });
    
    // 3. Encontrar duplicados
    const duplicateGroups = Object.entries(contactsByNumber)
      .filter(([_, contacts]) => contacts.length > 1);
    
    if (duplicateGroups.length === 0) {
      console.log('   ✅ No hay contactos duplicados');
      return { merged: 0 };
    }
    
    console.log(`   🔍 Encontrados ${duplicateGroups.length} grupos de contactos duplicados`);
    
    let totalMerged = 0;
    
    // 4. Fusionar cada grupo
    for (const [phoneNumber, contacts] of duplicateGroups) {
      const mainContact = contacts[0];
      const duplicateContacts = contacts.slice(1);
      
      console.log(`   📋 Fusionando ${duplicateContacts.length} duplicados de "${mainContact.name || phoneNumber}"`);
      
      for (const dupContact of duplicateContacts) {
        // Actualizar chats que referencian al contacto duplicado
        await supabase
          .from('chats')
          .update({ contact_id: mainContact.id })
          .eq('contact_id', dupContact.id);
        
        // Eliminar contacto duplicado
        const { error: deleteError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', dupContact.id);
        
        if (deleteError) {
          console.error(`   ❌ Error eliminando contacto duplicado: ${deleteError.message}`);
          continue;
        }
        
        totalMerged++;
      }
    }
    
    console.log(`   ✅ Fusión completada: ${totalMerged} contactos eliminados`);
    console.log('==========================================\n');
    
    return { merged: totalMerged };
  }

  /**
   * CORRECCIÓN DE NOMBRES: Corrige nombres incorrectos en chats y contactos
   */
  async fixIncorrectNames(botId) {
    if (!this.botPushName) {
      console.log('   ℹ️ No se puede corregir nombres sin conocer el nombre del bot');
      return { fixed: 0 };
    }
    
    console.log('\n🔧 ========== CORRIGIENDO NOMBRES INCORRECTOS ==========');
    console.log(`   📛 Buscando chats/contactos con nombre "${this.botPushName}"...`);
    
    let totalFixed = 0;
    
    // 1. Corregir contactos con nombre del bot
    const { data: badContacts } = await supabase
      .from('contacts')
      .select('id, phone_number, name')
      .eq('bot_id', botId)
      .ilike('name', `%${this.botPushName}%`);
    
    for (const contact of (badContacts || [])) {
      // Actualizar nombre a número de teléfono
      await supabase
        .from('contacts')
        .update({ name: contact.phone_number, push_name: contact.phone_number })
        .eq('id', contact.id);
      
      totalFixed++;
      console.log(`   ✅ Contacto corregido: "${contact.name}" -> "${contact.phone_number}"`);
    }
    
    // 2. Corregir chats con nombre del bot
    const { data: badChats } = await supabase
      .from('chats')
      .select('id, contact_number, contact_name')
      .eq('bot_id', botId)
      .ilike('contact_name', `%${this.botPushName}%`);
    
    for (const chat of (badChats || [])) {
      // Actualizar nombre a número de contacto
      await supabase
        .from('chats')
        .update({ contact_name: chat.contact_number, name: chat.contact_number })
        .eq('id', chat.id);
      
      totalFixed++;
      console.log(`   ✅ Chat corregido: "${chat.contact_name}" -> "${chat.contact_number}"`);
    }
    
    console.log(`   ✅ ${totalFixed} nombres corregidos`);
    console.log('==========================================\n');
    
    return { fixed: totalFixed };
  }

  /**
   * OPTIMIZADO + FASE 2: Obtiene contacto desde caché o crea uno nuevo
   * - Usa caché en memoria
   * - Corrige nombres incorrectos (nombre del bot)
   * - Solo consulta WAHA si el contacto no tiene datos completos
   */
  async getOrCreateContactFromWaha(botId, sessionName, chatId, wahaChat = null) {
    try {
      const contactNumber = chatId.split('@')[0];
      
      // 1. Buscar en caché primero
      let existingContact = this.contactsCache.get(contactNumber);
      
      // 2. Verificar si el contacto tiene nombre incorrecto (nombre del bot)
      const hasInvalidName = existingContact && this.isInvalidContactName(existingContact.name);
      
      // 3. Si existe, tiene datos completos y nombre válido, retornarlo
      if (existingContact && existingContact.name && !hasInvalidName && existingContact.profile_picture_url) {
        return existingContact;
      }

      // 4. Preparar datos finales, priorizando datos válidos
      let finalData = {
        name: null,
        push_name: null,
        profile_picture_url: existingContact?.profile_picture_url || null,
        is_business: existingContact?.is_business || false,
        is_enterprise: existingContact?.is_enterprise || false
      };

      // 5. Obtener nombre válido (que NO sea el nombre del bot)
      const wahaChatName = wahaChat?.name;
      
      if (wahaChatName && !this.isInvalidContactName(wahaChatName)) {
        finalData.name = wahaChatName;
        finalData.push_name = wahaChatName;
      } else if (existingContact?.name && !hasInvalidName) {
        finalData.name = existingContact.name;
        finalData.push_name = existingContact.push_name;
      }

      // 6. Consultar WAHA API si falta nombre O foto de perfil
      const needsWahaData = !finalData.name || !finalData.profile_picture_url;
      if (needsWahaData) {
        try {
          const wahaData = await WahaContactService.getFullContactData(sessionName, chatId);
          if (wahaData.name && !this.isInvalidContactName(wahaData.name) && !finalData.name) {
            finalData.name = wahaData.name;
            finalData.push_name = wahaData.push_name || wahaData.name;
          }
          if (wahaData.profile_picture_url && !finalData.profile_picture_url) {
            finalData.profile_picture_url = wahaData.profile_picture_url;
          }
          finalData.is_business = wahaData.is_business || false;
          finalData.is_enterprise = wahaData.is_enterprise || false;
        } catch (wahaError) {
          // Si falla WAHA, continuar con lo que tenemos
        }
      }

      // 7. Fallback: usar número de teléfono como nombre
      if (!finalData.name) {
        finalData.name = contactNumber;
        finalData.push_name = contactNumber;
      }

      // 8. Crear o actualizar contacto
      if (existingContact) {
        // Actualizar si hay cambios significativos (nombre incorrecto, sin nombre, o sin foto)
        const needsUpdate = hasInvalidName || 
                           !existingContact.name ||
                           (!existingContact.profile_picture_url && finalData.profile_picture_url) ||
                           (finalData.profile_picture_url && existingContact.profile_picture_url !== finalData.profile_picture_url);
        
        if (needsUpdate) {
          const { data: updated } = await supabase
            .from('contacts')
            .update({
              name: finalData.name,
              push_name: finalData.push_name,
              profile_picture_url: finalData.profile_picture_url || existingContact.profile_picture_url,
              is_business: finalData.is_business,
              is_enterprise: finalData.is_enterprise,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id)
            .select()
            .single();
          
          if (updated) {
            this.contactsCache.set(contactNumber, updated);
            if (hasInvalidName) {
              console.log(`   🔧 Nombre corregido: "${existingContact.name}" -> "${finalData.name}"`);
            }
          }
          return updated || existingContact;
        }
        return existingContact;
      } else {
        const newContact = await contactService.getOrCreateContact(botId, contactNumber, finalData);
        if (newContact) this.contactsCache.set(contactNumber, newContact);
        return newContact;
      }
    } catch (error) {
      console.error('Error en getOrCreateContactFromWaha:', error);
      return null;
    }
  }

  /**
   * FASE 2: Obtiene o crea chat con corrección de nombre si es necesario
   */
  async getOrCreateChatWithCorrection(botId, chatId, contact, wahaChat = null) {
    try {
      const contactNumber = chatId.split('@')[0];
      
      // 1. Buscar en caché
      let existingChat = this.chatsCache.get(contactNumber);
      
      // 2. Determinar nombre correcto del chat
      const correctName = contact?.name || 
                         (wahaChat?.name && !this.isInvalidContactName(wahaChat.name) ? wahaChat.name : null) ||
                         contactNumber;

      // 3. Si existe, verificar si necesita corrección de nombre
      if (existingChat) {
        const hasInvalidChatName = this.isInvalidContactName(existingChat.contact_name) ||
                                   this.isInvalidContactName(existingChat.name);
        
        if (hasInvalidChatName && correctName !== contactNumber) {
          // Corregir nombre del chat
          const { data: updated } = await supabase
            .from('chats')
            .update({
              contact_name: correctName,
              name: correctName,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingChat.id)
            .select()
            .single();
          
          if (updated) {
            this.chatsCache.set(contactNumber, updated);
            console.log(`   🔧 Nombre de chat corregido: "${existingChat.contact_name}" -> "${correctName}"`);
            return updated;
          }
        }
        return existingChat;
      }

      // 4. Crear nuevo chat
      const newChat = await chatService.getOrCreateChat(
        botId,
        chatId,
        contact?.id,
        { name: correctName }
      );
      
      if (newChat) this.chatsCache.set(contactNumber, newChat);
      return newChat;
    } catch (error) {
      console.error('Error en getOrCreateChatWithCorrection:', error);
      return null;
    }
  }

  /**
   * Procesa multimedia de un mensaje
   */
  async processMediaForMessage(botId, messageId, messageData, sessionName, transcribeAudio = true) {
    try {
      if (!messageData.hasMedia || !messageData.mediaUrl) {
        return null;
      }

      const wahaApiKey = process.env.WAHA_API_KEY;
      const fileName = `${messageData.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const messageType = messageData.type || 'unknown';

      // Descargar y subir a Supabase
      const mediaData = await mediaService.processAndUploadMedia(
        messageData.mediaUrl,
        fileName,
        messageType,
        wahaApiKey
      );

      // Guardar referencia
      const savedMedia = await mediaService.saveMediaFile(botId, messageId, mediaData);

      // Transcribir audio si aplica
      if (transcribeAudio && (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice')) {
        const { TranscriptionService } = await import('./transcriptionService.js');
        const transcriptionService = new TranscriptionService();
        
        transcriptionService.processAudioMessage(
          mediaData.publicUrl,
          messageId,
          botId,
          wahaApiKey
        ).catch(err => console.error('Error transcribiendo:', err.message));
      }

      return savedMedia;
    } catch (error) {
      console.error('Error procesando media:', error);
      return null;
    }
  }

  /**
   * OPTIMIZADO + FASE 2: Sincroniza TODOS los mensajes de un chat
   * - Procesa TODOS los mensajes (nuevos y existentes)
   * - Usa caché para verificación rápida
   * - Actualiza mensajes existentes si tienen datos incorrectos
   * - Corrige from_me si está incorrecto
   */
  async syncChatMessages(sessionName, chatId, options = {}) {
    const { 
      limit = 100, 
      includeMedia = true, 
      transcribeAudio = true,
      bot = null,
      wahaChat = null
    } = options;

    try {
      const currentBot = bot || await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single()
        .then(r => r.data);

      if (!currentBot) throw new Error(`Bot no encontrado: ${sessionName}`);

      // PASO 1: Obtener mensajes desde WAHA PRIMERO (necesario para normalizar @lid)
      const messagesResponse = await wahaClient.get('/api/messages', {
        params: {
          session: sessionName,
          chatId: chatId, // Usar el ID original para WAHA
          limit: Math.min(limit, 500),
          downloadMedia: false,
          includeBody: true,
          includeText: true,
          format: 'json',
          includeQuoted: false
        },
        timeout: 120000
      });

      const messages = messagesResponse.data || [];
      
      if (messages.length === 0) {
        return { total: 0, saved: 0, skipped: 0, updated: 0, media: 0, errors: 0 };
      }

      // PASO 2: Normalizar chatId usando los mensajes (para @lid)
      // Ahora normalizeChatId SIEMPRE retorna un valor (nunca null)
      const normalizedChatId = this.normalizeChatId(chatId, wahaChat, messages);
      const contactNumber = normalizedChatId.split('@')[0];

      const stats = {
        total: messages.length,
        saved: 0,
        skipped: 0,
        updated: 0,
        media: 0,
        errors: 0
      };

      // PASO 3: Obtener/crear contacto con corrección de nombre
      const contact = await this.getOrCreateContactFromWaha(
        currentBot.id, 
        sessionName, 
        normalizedChatId, 
        wahaChat
      );
      
      // PASO 4: Obtener/crear chat con corrección de nombre
      const chat = await this.getOrCreateChatWithCorrection(
        currentBot.id,
        normalizedChatId,
        contact,
        wahaChat
      );

      if (!chat) {
        return stats;
      }

      // Cargar mensajes existentes en caché (batch)
      await this.loadExistingMessagesForChat(chat.id);

      // Procesar TODOS los mensajes
      for (const msg of messages) {
        try {
          // Determinar from_me correcto basándose en el número del bot
          const correctFromMe = msg.from?.split('@')[0] === currentBot.phone_number;
          
          // Obtener contenido correcto
          const correctContent = msg.body || msg.text || msg.caption || msg.content || '';

          // Verificar si el mensaje ya existe
          const existingMsg = this.getExistingMessage(msg.id);

          if (existingMsg) {
            // Mensaje existe - verificar si necesita actualización
            let needsUpdate = false;
            const updateData = {};

            // Verificar si from_me está incorrecto
            if (existingMsg.from_me !== correctFromMe) {
              updateData.from_me = correctFromMe;
              needsUpdate = true;
            }

            // Verificar si el contenido está vacío pero ahora tenemos contenido
            if (!existingMsg.body && correctContent) {
              updateData.body = correctContent;
              updateData.content = correctContent;
              needsUpdate = true;
            }

            if (needsUpdate) {
              await supabase
                .from('messages')
                .update(updateData)
                .eq('id', existingMsg.id);
              stats.updated++;
            } else {
              stats.skipped++;
            }
          } else {
            // Mensaje nuevo - guardar
            msg.fromMe = correctFromMe;
            
            const saved = await messageService.saveMessage(
              currentBot.id, 
              chat.id, 
              contact?.id, 
              msg
            );

            if (saved) {
              stats.saved++;
              
              // Agregar a caché
              this.existingMessagesCache.set(msg.id, {
                id: saved.id,
                from_me: correctFromMe,
                body: correctContent
              });

              // Procesar media en background
              if (includeMedia && msg.hasMedia && msg.mediaUrl) {
                this.processMediaForMessage(currentBot.id, saved.id, msg, sessionName, transcribeAudio)
                  .then(() => stats.media++)
                  .catch(() => {});
              }
            }
          }
        } catch (error) {
          // Si es error de duplicado, no contar como error
          if (error.code !== '23505') {
            stats.errors++;
          } else {
            stats.skipped++;
          }
        }
      }

      return stats;

    } catch (error) {
      console.error(`Error en syncChatMessages (${chatId}):`, error.message);
      return { total: 0, saved: 0, skipped: 0, updated: 0, media: 0, errors: 1 };
    }
  }

  /**
   * OPTIMIZADO + FASE 2: Sincroniza TODOS los mensajes de TODOS los chats
   * - Carga cachés al inicio (contactos, chats)
   * - Obtiene nombre del bot para detectar nombres incorrectos
   * - Procesa en paralelo (batches de 3 chats para estabilidad)
   * - Integra correcciones de Fase 2
   */
  async syncAllMessages(sessionName, options = {}) {
    const { limit = 500, includeMedia = true, transcribeAudio = true } = options;
    const startTime = Date.now();

    try {
      console.log(`\n🚀 ========== SINCRONIZACIÓN COMPLETA (FASE 1+2) ==========`);
      console.log(`Session: ${sessionName}`);

      // 1. Limpiar cachés
      this.clearCaches();

      // 2. Obtener bot
      const { data: bot } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (!bot) throw new Error(`Bot no encontrado: ${sessionName}`);

      // 3. FASE 2: Obtener nombre del bot desde WAHA para detectar nombres incorrectos
      try {
        const sessionInfo = await wahaClient.get(`/api/sessions/${sessionName}`);
        this.botPushName = sessionInfo.data?.me?.pushName || null;
        if (this.botPushName) {
          console.log(`📛 Nombre del bot detectado: "${this.botPushName}" (para corrección de nombres)`);
        }
      } catch (e) {
        console.log(`⚠️ No se pudo obtener nombre del bot desde WAHA`);
      }

      // 4. FASE 3: FUSIÓN Y CORRECCIÓN DE DATOS EXISTENTES
      // Esto se ejecuta ANTES de sincronizar para limpiar duplicados existentes
      console.log('\n📋 FASE DE LIMPIEZA Y CORRECCIÓN...');
      
      // 4.1. Fusionar contactos duplicados
      const contactMergeResult = await this.mergeDuplicateContacts(bot.id);
      
      // 4.2. Fusionar chats duplicados
      const chatMergeResult = await this.mergeDuplicateChats(bot.id);
      
      // 4.3. Corregir nombres incorrectos (nombre del bot en contactos/chats)
      const nameFixResult = await this.fixIncorrectNames(bot.id);

      // 5. Cargar contactos y chats existentes en caché (DESPUÉS de la fusión)
      console.log('📦 Cargando datos existentes en caché...');
      const [contactsCount, chatsCount] = await Promise.all([
        this.loadContactsCache(bot.id),
        this.loadChatsCache(bot.id)
      ]);
      console.log(`   ✅ ${contactsCount} contactos, ${chatsCount} chats en caché`);

      // 6. Obtener chats desde WAHA
      console.log('📊 Obteniendo chats desde WAHA...');
      
      const chatsResponse = await wahaClient.get(`/api/${sessionName}/chats`, {
        params: { 
          limit: 500,
          includeLastMessage: true,
          onlyWithMessages: true
        },
        timeout: 120000
      });

      const wahaChats = chatsResponse.data || [];
      console.log(`   ✅ ${wahaChats.length} chats encontrados en WAHA\n`);

      if (wahaChats.length === 0) {
        return { success: true, stats: { chats: 0, messages: 0, updated: 0, skipped: 0, media: 0, errors: 0 } };
      }

      const globalStats = {
        chats: 0,
        messages: 0,
        updated: 0,
        skipped: 0,
        media: 0,
        errors: 0,
        // Estadísticas de limpieza
        contactsMerged: contactMergeResult.merged || 0,
        chatsMerged: chatMergeResult.merged || 0,
        messagesMoved: chatMergeResult.messagesMoved || 0,
        namesFixed: nameFixResult.fixed || 0
      };

      // 7. Procesar chats en batches (3 en paralelo para estabilidad)
      const BATCH_SIZE = 3;
      const batches = [];
      
      for (let i = 0; i < wahaChats.length; i += BATCH_SIZE) {
        batches.push(wahaChats.slice(i, i + BATCH_SIZE));
      }

      console.log(`📦 Procesando ${wahaChats.length} chats en ${batches.length} lotes...\n`);

      let processedChats = 0;
      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(async (wahaChat) => {
            try {
              const chatId = wahaChat.id?._serialized || wahaChat.id;
              
              const chatStats = await this.syncChatMessages(sessionName, chatId, {
                limit,
                includeMedia,
                transcribeAudio,
                bot,
                wahaChat
              });

              return { success: true, stats: chatStats };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })
        );

        for (const result of batchResults) {
          if (result.success) {
            globalStats.chats++;
            globalStats.messages += result.stats.saved || 0;
            globalStats.updated += result.stats.updated || 0;
            globalStats.skipped += result.stats.skipped || 0;
            globalStats.media += result.stats.media || 0;
            globalStats.errors += result.stats.errors || 0;
          } else {
            globalStats.errors++;
          }
        }

        processedChats += batch.length;
        
        // Log de progreso cada 5 chats
        if (processedChats % 5 === 0 || processedChats === wahaChats.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const newMsgs = globalStats.messages;
          const updatedMsgs = globalStats.updated;
          console.log(`   📊 ${processedChats}/${wahaChats.length} chats | ${newMsgs} nuevos | ${updatedMsgs} actualizados | ${elapsed}s`);
        }

        // Pausa entre batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n✅ ========== COMPLETADO en ${totalTime}s ==========`);
      console.log(`\n📋 FASE DE LIMPIEZA:`);
      console.log(`   Contactos fusionados: ${globalStats.contactsMerged}`);
      console.log(`   Chats fusionados: ${globalStats.chatsMerged}`);
      console.log(`   Mensajes movidos: ${globalStats.messagesMoved}`);
      console.log(`   Nombres corregidos: ${globalStats.namesFixed}`);
      console.log(`\n📊 FASE DE SINCRONIZACIÓN:`);
      console.log(`   Chats procesados: ${globalStats.chats}`);
      console.log(`   Mensajes nuevos: ${globalStats.messages}`);
      console.log(`   Mensajes actualizados: ${globalStats.updated}`);
      console.log(`   Mensajes sin cambios: ${globalStats.skipped}`);
      console.log(`   Media procesada: ${globalStats.media}`);
      console.log(`   Errores: ${globalStats.errors}\n`);

      return {
        success: true,
        stats: globalStats,
        duration: totalTime
      };

    } catch (error) {
      console.error('Error en syncAllMessages:', error);
      throw error;
    }
  }
}

export default new FullSyncService();

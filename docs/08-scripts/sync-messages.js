import axios from 'axios';
import supabase from './src/config/supabase.js';
import { MessageService } from './src/services/messageService.js';

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const messageService = new MessageService();

/**
 * Sincroniza mensajes salientes históricos desde WAHA a Supabase
 * Útil para recuperar mensajes que se enviaron antes de configurar webhooks
 */
async function syncOutgoingMessages(sessionName, botId) {
    console.log(`\n🔄 Iniciando sincronización de mensajes salientes...`);
    console.log(`   Sesión: ${sessionName}`);
    console.log(`   Bot ID: ${botId}\n`);

    try {
        // 1. Obtener todos los chats del bot
        const { data: chats, error: chatsError } = await supabase
            .from('chats')
            .select('id, chat_id, bot_id, contact_id')
            .eq('bot_id', botId);

        if (chatsError) {
            console.error('❌ Error obteniendo chats:', chatsError);
            return;
        }

        console.log(`📊 Chats encontrados: ${chats.length}\n`);

        let totalSynced = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        // 2. Para cada chat, obtener mensajes de WAHA
        for (const chat of chats) {
            try {
                console.log(`\n📱 Procesando chat: ${chat.chat_id}`);

                // Obtener mensajes del chat desde WAHA
                const response = await axios.get(
                    `${WAHA_URL}/api/${sessionName}/chats/${chat.chat_id}/messages`,
                    {
                        headers: { 'X-Api-Key': WAHA_API_KEY },
                        params: {
                            limit: 1000, // Ajustar según necesidad
                            downloadMedia: false // No descargar media para ir más rápido
                        }
                    }
                );

                const messages = response.data;
                console.log(`   Total mensajes en WAHA: ${messages.length}`);

                // 3. Filtrar solo mensajes salientes (fromMe = true)
                const outgoingMessages = messages.filter(msg => msg.fromMe === true);
                console.log(`   Mensajes salientes: ${outgoingMessages.length}`);

                // 4. Guardar cada mensaje saliente si no existe
                for (const msg of outgoingMessages) {
                    try {
                        // Verificar si el mensaje ya existe
                        const { data: existing } = await supabase
                            .from('messages')
                            .select('id')
                            .eq('message_id', msg.id)
                            .maybeSingle();

                        if (existing) {
                            totalSkipped++;
                            continue; // Ya existe, saltar
                        }

                        // Guardar mensaje
                        await messageService.saveMessage(
                            chat.bot_id,
                            chat.id,
                            chat.contact_id,
                            msg
                        );

                        totalSynced++;
                        console.log(`   ✅ Sincronizado: ${msg.id}`);

                    } catch (msgError) {
                        totalErrors++;
                        console.error(`   ❌ Error guardando mensaje ${msg.id}:`, msgError.message);
                    }
                }

            } catch (chatError) {
                totalErrors++;
                console.error(`❌ Error procesando chat ${chat.chat_id}:`, chatError.message);
            }

            // Pequeña pausa para no sobrecargar la API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n📊 ========== RESUMEN DE SINCRONIZACIÓN ==========`);
        console.log(`✅ Mensajes sincronizados: ${totalSynced}`);
        console.log(`⏭️  Mensajes omitidos (ya existían): ${totalSkipped}`);
        console.log(`❌ Errores: ${totalErrors}`);
        console.log(`=================================================\n`);

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

/**
 * Sincroniza mensajes salientes para todos los bots
 */
async function syncAllBots() {
    try {
        const { data: bots, error } = await supabase
            .from('bots')
            .select('id, session_name')
            .eq('status', 'WORKING'); // Solo bots activos

        if (error) {
            console.error('Error obteniendo bots:', error);
            return;
        }

        console.log(`\n🤖 Bots activos encontrados: ${bots.length}\n`);

        for (const bot of bots) {
            await syncOutgoingMessages(bot.session_name, bot.id);
        }

        console.log(`\n✅ Sincronización completa para todos los bots\n`);

    } catch (error) {
        console.error('Error en syncAllBots:', error);
    }
}

// Ejecutar
syncAllBots()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });

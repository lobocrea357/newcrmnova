import axios from 'axios';

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/waha';

/**
 * Configura webhooks en WAHA para capturar TODOS los mensajes (entrantes y salientes)
 */
async function configureWebhooks(sessionName = 'default') {
    console.log(`\n🔧 Configurando webhooks para WAHA...`);
    console.log(`   Sesión: ${sessionName}`);
    console.log(`   URL: ${WAHA_URL}`);
    console.log(`   Webhook URL: ${WEBHOOK_URL}\n`);

    try {
        // 1. Verificar configuración actual
        console.log(`📋 Verificando configuración actual...`);
        const currentConfig = await getCurrentWebhooks(sessionName);

        if (currentConfig) {
            console.log(`\n✅ Configuración actual:`);
            console.log(JSON.stringify(currentConfig, null, 2));
        }

        // 2. Configurar nuevos webhooks
        console.log(`\n🔄 Configurando nuevos webhooks...`);

        const webhookConfig = {
            url: WEBHOOK_URL,
            events: [
                'message.any',      // ⭐ CRÍTICO: Captura TODOS los mensajes (entrantes Y salientes)
                'session.status',   // Estado de la sesión
                'message.ack'       // Confirmaciones de lectura
            ],
            hmac: null,
            retries: 3,
            customHeaders: null
        };

        const response = await axios.post(
            `${WAHA_URL}/api/${sessionName}/webhooks`,
            webhookConfig,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': WAHA_API_KEY
                }
            }
        );

        console.log(`\n✅ Webhooks configurados exitosamente!`);
        console.log(JSON.stringify(response.data, null, 2));

        // 3. Verificar nueva configuración
        console.log(`\n🔍 Verificando nueva configuración...`);
        const newConfig = await getCurrentWebhooks(sessionName);

        if (newConfig && newConfig.events.includes('message.any')) {
            console.log(`\n✅ ¡Configuración correcta! El evento 'message.any' está activo.`);
            console.log(`   Ahora WAHA enviará webhooks para:`);
            console.log(`   📨 Mensajes entrantes (from_me = false)`);
            console.log(`   📤 Mensajes salientes (from_me = true)`);
        } else {
            console.warn(`\n⚠️ Advertencia: El evento 'message.any' no está en la configuración.`);
        }

        return response.data;

    } catch (error) {
        console.error(`\n❌ Error configurando webhooks:`, error.message);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }

        throw error;
    }
}

/**
 * Obtiene la configuración actual de webhooks
 */
async function getCurrentWebhooks(sessionName = 'default') {
    try {
        const response = await axios.get(
            `${WAHA_URL}/api/${sessionName}/webhooks`,
            {
                headers: { 'X-Api-Key': WAHA_API_KEY }
            }
        );

        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log(`   ℹ️ No hay webhooks configurados actualmente`);
            return null;
        }
        throw error;
    }
}

/**
 * Elimina webhooks existentes
 */
async function deleteWebhooks(sessionName = 'default') {
    try {
        console.log(`\n🗑️ Eliminando webhooks existentes...`);

        await axios.delete(
            `${WAHA_URL}/api/${sessionName}/webhooks`,
            {
                headers: { 'X-Api-Key': WAHA_API_KEY }
            }
        );

        console.log(`✅ Webhooks eliminados`);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log(`   ℹ️ No había webhooks para eliminar`);
        } else {
            throw error;
        }
    }
}

/**
 * Configura webhooks para todas las sesiones activas
 */
async function configureAllSessions() {
    try {
        console.log(`\n🔍 Buscando sesiones activas...`);

        const response = await axios.get(
            `${WAHA_URL}/api/sessions`,
            {
                headers: { 'X-Api-Key': WAHA_API_KEY }
            }
        );

        const sessions = response.data;
        console.log(`   Sesiones encontradas: ${sessions.length}\n`);

        for (const session of sessions) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📱 Sesión: ${session.name}`);
            console.log(`   Estado: ${session.status}`);
            console.log(`${'='.repeat(60)}`);

            if (session.status === 'WORKING') {
                await configureWebhooks(session.name);
            } else {
                console.log(`   ⏭️ Omitiendo (no está activa)`);
            }
        }

        console.log(`\n\n✅ Configuración completada para todas las sesiones activas\n`);

    } catch (error) {
        console.error(`\n❌ Error configurando sesiones:`, error.message);
        throw error;
    }
}

/**
 * Prueba la configuración enviando un mensaje de prueba
 */
async function testWebhookConfiguration(sessionName = 'default') {
    console.log(`\n🧪 Probando configuración de webhooks...`);
    console.log(`   Envía un mensaje desde el bot y verifica los logs del servidor Node.js`);
    console.log(`   Deberías ver: "🔔 Webhook recibido [message.any]: FromMe: true"\n`);
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const command = args[0] || 'configure';
    const sessionName = args[1] || 'default';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 CONFIGURADOR DE WEBHOOKS WAHA`);
    console.log(`${'='.repeat(60)}\n`);

    switch (command) {
        case 'configure':
            configureWebhooks(sessionName)
                .then(() => {
                    console.log(`\n✅ Proceso completado exitosamente`);
                    console.log(`\n📝 Próximos pasos:`);
                    console.log(`   1. Envía un mensaje de prueba desde el bot`);
                    console.log(`   2. Verifica los logs del servidor Node.js`);
                    console.log(`   3. Ejecuta el script de sincronización para mensajes históricos:\n`);
                    console.log(`      node src/scripts/sync-outgoing-messages.js\n`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`\n❌ Error fatal:`, error.message);
                    process.exit(1);
                });
            break;

        case 'all':
            configureAllSessions()
                .then(() => {
                    console.log(`\n✅ Proceso completado`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`\n❌ Error fatal:`, error.message);
                    process.exit(1);
                });
            break;

        case 'delete':
            deleteWebhooks(sessionName)
                .then(() => {
                    console.log(`\n✅ Webhooks eliminados`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`\n❌ Error:`, error.message);
                    process.exit(1);
                });
            break;

        case 'check':
            getCurrentWebhooks(sessionName)
                .then(config => {
                    console.log(`\n📋 Configuración actual:`);
                    console.log(JSON.stringify(config, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`\n❌ Error:`, error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`\n❌ Comando desconocido: ${command}`);
            console.log(`\nComandos disponibles:`);
            console.log(`   configure [session]  - Configura webhooks para una sesión (default: 'default')`);
            console.log(`   all                  - Configura webhooks para todas las sesiones activas`);
            console.log(`   check [session]      - Verifica configuración actual`);
            console.log(`   delete [session]     - Elimina webhooks de una sesión\n`);
            process.exit(1);
    }
}

export { configureWebhooks, getCurrentWebhooks, deleteWebhooks, configureAllSessions };

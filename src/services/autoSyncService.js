import wahaClient from '../config/waha.js';
import supabase from '../config/supabase.js';
import botService from './botService.js';
import syncService from './syncService.js';

/**
 * Servicio de Auto-Sincronización Periódica
 * 
 * Este servicio se ejecuta periódicamente para:
 * 1. Verificar que los bots de WAHA existan en Supabase
 * 2. Sincronizar contactos y chats de bots activos
 * 3. Recuperar datos faltantes (ej: después de truncar tablas)
 * 
 * Configuración via variables de entorno:
 * - AUTO_SYNC_ENABLED=true|false (default: true)
 * - AUTO_SYNC_INTERVAL_MINUTES=30 (default: 30 minutos)
 * - AUTO_SYNC_FULL_SYNC=true|false (default: false, solo sync básica)
 */
export class AutoSyncService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.contactSyncIntervalId = null;
    this.lastSyncTime = null;
    this.lastContactSyncTime = null;
    this.syncInProgress = false;
    
    // Configuración desde .env
    this.enabled = process.env.AUTO_SYNC_ENABLED !== 'false'; // Default: true
    this.intervalMinutes = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES) || 30; // Default: 30 min
    this.fullSync = process.env.AUTO_SYNC_FULL_SYNC === 'true'; // Default: false
    this.contactSyncMinutes = 5; // Sincronizar contactos sin nombre cada 5 minutos
  }

  /**
   * Inicia el servicio de auto-sincronización
   */
  start() {
    if (!this.enabled) {
      console.log('⏸️  Auto-sincronización DESHABILITADA (AUTO_SYNC_ENABLED=false)');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️  Auto-sincronización ya está corriendo');
      return;
    }

    console.log(`\n🔄 Auto-Sincronización INICIADA`);
    console.log(`   ⏱️  Intervalo general: cada ${this.intervalMinutes} minutos`);
    console.log(`   👤 Contactos sin nombre: cada ${this.contactSyncMinutes} minutos`);
    console.log(`   🔍 Modo: ${this.fullSync ? 'COMPLETA (bots + contactos + chats)' : 'BÁSICA (solo bots)'}`);

    this.isRunning = true;

    // Primera sincronización inmediata
    setTimeout(() => this.executeSyncCycle(), 5000); // Esperar 5 segundos al inicio
    setTimeout(() => this.enrichContactsWithNullData(), 10000); // Enriquecer contactos a los 10 segundos

    // Programar sincronizaciones periódicas
    this.intervalId = setInterval(
      () => this.executeSyncCycle(),
      this.intervalMinutes * 60 * 1000
    );

    // Enriquecimiento de contactos con datos NULL cada 5 minutos
    this.contactSyncIntervalId = setInterval(
      () => this.enrichContactsWithNullData(),
      this.contactSyncMinutes * 60 * 1000
    );
  }

  /**
   * Detiene el servicio de auto-sincronización
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.contactSyncIntervalId) {
      clearInterval(this.contactSyncIntervalId);
      this.contactSyncIntervalId = null;
    }

    this.isRunning = false;
    console.log('\n⏹️  Auto-sincronización DETENIDA\n');
  }

  /**
   * Ejecuta un ciclo completo de sincronización
   */
  async executeSyncCycle() {
    if (this.syncInProgress) {
      console.log('⏳ Sincronización anterior aún en progreso, omitiendo...');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 CICLO DE AUTO-SINCRONIZACIÓN`);
      console.log(`⏰ ${new Date().toLocaleString()}`);
      console.log(`${'='.repeat(60)}\n`);

      // 1. Sincronizar bots desde WAHA
      console.log('📱 Paso 1: Sincronizando bots desde WAHA...');
      const botsStats = await this.syncBots();
      console.log(`   ✅ Bots: ${botsStats.total} activos en WAHA, ${botsStats.synced} sincronizados\n`);

      // 2. Si está habilitada la sincronización completa, sincronizar contactos y chats
      if (this.fullSync) {
        console.log('📊 Paso 2: Sincronización completa de contactos y chats...');
        const dataStats = await this.syncBotsData(botsStats.activeBots);
        console.log(`   ✅ Sincronizados: ${dataStats.totalContacts} contactos, ${dataStats.totalChats} chats\n`);
      } else {
        console.log('ℹ️  Paso 2: Omitido (AUTO_SYNC_FULL_SYNC=false)\n');
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Ciclo completado en ${duration}s`);
      console.log(`${'='.repeat(60)}\n`);

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('❌ Error en ciclo de sincronización:', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincroniza bots desde WAHA a Supabase
   * Similar a botService.syncBotsWithWaha() pero retorna estadísticas
   */
  async syncBots() {
    try {
      // Obtener todas las sesiones activas en WAHA
      const response = await wahaClient.get('/api/sessions?all=true');
      const wahaSessions = response.data || [];

      const stats = {
        total: wahaSessions.length,
        synced: 0,
        activeBots: []
      };

      // Sincronizar cada sesión
      for (const session of wahaSessions) {
        try {
          const phoneNumber = session.me?.id?.split('@')[0] || session.me?.user || 'pending';
          
          // Obtener o crear bot
          const bot = await botService.getOrCreateBot(session.name, phoneNumber);
          
          // Actualizar estado
          await botService.updateBotStatus(session.name, session.status, {
            engine: session.engine,
            me: session.me
          });

          stats.synced++;

          // Guardar bots activos para sincronización de datos
          if (session.status === 'WORKING') {
            stats.activeBots.push({
              id: bot.id,
              session_name: session.name,
              status: session.status
            });
          }
        } catch (error) {
          console.error(`   ⚠️  Error sincronizando bot ${session.name}:`, error.message);
        }
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo sesiones de WAHA:', error);
      return { total: 0, synced: 0, activeBots: [] };
    }
  }

  /**
   * Sincroniza contactos y chats de bots activos
   */
  async syncBotsData(activeBots) {
    const stats = {
      totalContacts: 0,
      totalChats: 0,
      errors: 0
    };

    for (const bot of activeBots) {
      try {
        console.log(`   🔄 Sincronizando ${bot.session_name}...`);

        // Sincronizar solo si hay campos NULL (no sobrescribir datos existentes)
        const result = await syncService.syncAll(bot.session_name);

        stats.totalContacts += result.contacts?.updated || 0;
        stats.totalChats += result.chats?.updated || 0;

        console.log(`      📞 ${result.contacts?.updated || 0} contactos, 💬 ${result.chats?.updated || 0} chats`);
      } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Verifica si un bot específico existe en Supabase
   */
  async botExistsInSupabase(sessionName) {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id')
        .eq('session_name', sessionName)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error verificando bot en Supabase:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStatus() {
    return {
      enabled: this.enabled,
      isRunning: this.isRunning,
      syncInProgress: this.syncInProgress,
      intervalMinutes: this.intervalMinutes,
      fullSync: this.fullSync,
      lastSyncTime: this.lastSyncTime,
      nextSyncIn: this.isRunning && this.lastSyncTime
        ? Math.round((this.intervalMinutes * 60 * 1000 - (Date.now() - this.lastSyncTime.getTime())) / 1000)
        : null
    };
  }

  /**
   * Enriquece contactos con datos NULL (nombre, foto de perfil)
   */
  async enrichContactsWithNullData() {
    try {
      // Importar el servicio de enriquecimiento
      const { default: contactEnrichmentService } = await import('./contactEnrichmentService.js');
      
      // Ejecutar enriquecimiento
      const result = await contactEnrichmentService.enrichAllContactsWithNullData();
      
      this.lastContactSyncTime = new Date();
      
      return result;

    } catch (error) {
      console.error('❌ Error enriqueciendo contactos:', error.message);
    }
  }

  /**
   * Fuerza una sincronización inmediata (útil para testing)
   */
  async forceSyncNow() {
    if (this.syncInProgress) {
      throw new Error('Ya hay una sincronización en progreso');
    }

    console.log('\n🚀 Sincronización FORZADA iniciada...\n');
    await this.executeSyncCycle();
  }
}

export default new AutoSyncService();

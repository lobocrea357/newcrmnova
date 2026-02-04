/**
 * Inicializador Automático del Sistema de Cron
 * Se ejecuta cuando la aplicación Next.js arranca para configurar el análisis diario
 */

import { initializeDailySalesAnalysis, getCronStatus } from './cronJobs';
import { supabase } from './supabase';

let isInitialized = false;
let initializationPromise = null;

/**
 * Inicializa el sistema de cron automáticamente
 * Solo se ejecuta una vez por sesión de la aplicación
 */
export async function initializeCronSystem() {
  // Evitar inicializaciones múltiples
  if (isInitialized) {
    console.log('🔄 Sistema de cron ya está inicializado');
    return getCronStatus();
  }

  if (initializationPromise) {
    console.log('⏳ Esperando inicialización en progreso...');
    return await initializationPromise;
  }

  initializationPromise = performInitialization();

  try {
    const result = await initializationPromise;
    isInitialized = true;
    return result;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

async function performInitialization() {
  console.log('🚀 Inicializando sistema de análisis diario automático...');

  try {
    // 1. Verificar configuración en base de datos
    const config = await getCronConfiguration();

    if (!config) {
      console.log('⚠️ No se encontró configuración de cron, usando valores por defecto');
      await createDefaultConfiguration();
    }

    // 2. Verificar si el análisis automático está habilitado
    const cronSettings = config?.cron_settings || await getDefaultCronSettings();

    if (!cronSettings.enabled) {
      console.log('📴 Análisis automático deshabilitado en configuración');
      return {
        initialized: false,
        reason: 'Análisis automático deshabilitado',
        status: getCronStatus()
      };
    }

    // 3. Verificar entorno
    if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_CRON_IN_DEV) {
      console.log('🔧 Entorno de desarrollo: cron deshabilitado (use ENABLE_CRON_IN_DEV=true para habilitar)');
      return {
        initialized: false,
        reason: 'Entorno de desarrollo',
        status: getCronStatus()
      };
    }

    // 4. Inicializar sistema de cron
    initializeDailySalesAnalysis();

    // 5. Verificar que se inicializó correctamente
    const status = getCronStatus();

    if (status.is_initialized) {
      console.log('✅ Sistema de análisis diario inicializado correctamente');
      console.log(`⏰ Próxima ejecución programada: ${cronSettings.daily_analysis_time} (${cronSettings.timezone})`);

      // Log de inicialización exitosa
      await logCronEvent('cron_system_initialized', {
        configuration: cronSettings,
        environment: process.env.NODE_ENV,
        initialized_at: new Date().toISOString()
      }, true);

      return {
        initialized: true,
        status: status,
        configuration: cronSettings
      };
    } else {
      throw new Error('Sistema de cron no se inicializó correctamente');
    }

  } catch (error) {
    console.error('💥 Error inicializando sistema de cron:', error);

    // Log de error
    await logCronEvent('cron_initialization_failed', {
      error: error.message,
      stack: error.stack,
      environment: process.env.NODE_ENV
    }, false);

    throw error;
  }
}

/**
 * Obtiene la configuración de cron desde la base de datos
 */
async function getCronConfiguration() {
  try {
    const { data, error } = await supabase
      .from('sales_analysis_config')
      .select('config_key, config_value')
      .in('config_key', ['cron_settings', 'parameters_weights', 'analysis_thresholds']);

    if (error) {
      console.error('Error obteniendo configuración de cron:', error);
      return null;
    }

    // Convertir array a objeto
    const config = {};
    data.forEach(item => {
      config[item.config_key] = item.config_value;
    });

    return config;
  } catch (error) {
    console.error('Error consultando configuración:', error);
    return null;
  }
}

/**
 * Crea la configuración por defecto si no existe
 */
async function createDefaultConfiguration() {
  console.log('🛠️ Creando configuración por defecto...');

  const defaultConfigs = [
    {
      config_key: 'cron_settings',
      config_value: await getDefaultCronSettings(),
      description: 'Configuración del análisis automático diario'
    },
    {
      config_key: 'parameters_weights',
      config_value: {
        venta_confirmada: 10,
        lead_caliente: 8,
        cotizacion_enviada: 6,
        metodo_pago_enviado: 7,
        objeciones_superadas: 8,
        seguimiento_efectivo: 6,
        urgencia_creada: 5,
        valor_agregado: 7
      },
      description: 'Pesos para parámetros de análisis de ventas'
    },
    {
      config_key: 'analysis_thresholds',
      config_value: {
        excelente_threshold: 80,
        bueno_threshold: 70,
        regular_threshold: 60,
        confidence_threshold: 0.7
      },
      description: 'Umbrales de clasificación de rendimiento'
    },
    {
      config_key: 'notification_settings',
      config_value: {
        notify_on_sales: true,
        notify_on_critical_performance: true,
        email_recipients: [],
        whatsapp_notifications: false
      },
      description: 'Configuración de notificaciones automáticas'
    }
  ];

  try {
    for (const config of defaultConfigs) {
      const { error } = await supabase
        .from('sales_analysis_config')
        .upsert(config, { onConflict: 'config_key' });

      if (error) {
        console.error(`Error creando configuración ${config.config_key}:`, error);
      }
    }

    console.log('✅ Configuración por defecto creada');
  } catch (error) {
    console.error('Error creando configuración por defecto:', error);
    throw error;
  }
}

/**
 * Obtiene la configuración de cron por defecto
 */
async function getDefaultCronSettings() {
  return {
    daily_analysis_time: "00:00",
    timezone: "America/Bogota",
    enabled: process.env.NODE_ENV === 'production', // Solo habilitado en producción por defecto
    max_conversations_per_advisor: 20,
    min_messages_per_conversation: 5,
    batch_size: 3,
    retry_attempts: 2,
    timeout_minutes: 15
  };
}

/**
 * Registra eventos del sistema de cron
 */
async function logCronEvent(eventType, eventData, success) {
  try {
    await supabase
      .from('sales_analysis_logs')
      .insert({
        event_type: eventType,
        event_data: eventData,
        success: success,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error guardando log de cron:', error);
    // No lanzar error para no interrumpir la inicialización
  }
}

/**
 * Reinicia el sistema de cron (útil para cambios de configuración)
 */
export async function restartCronSystem() {
  console.log('🔄 Reiniciando sistema de cron...');

  try {
    // Marcar como no inicializado
    isInitialized = false;
    initializationPromise = null;

    // Detener sistema actual si existe
    const { stopDailySalesAnalysis } = await import('./cronJobs');
    stopDailySalesAnalysis();

    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reinicializar
    const result = await initializeCronSystem();

    console.log('✅ Sistema de cron reiniciado exitosamente');
    return result;

  } catch (error) {
    console.error('Error reiniciando sistema de cron:', error);
    throw error;
  }
}

/**
 * Obtiene información detallada del estado del sistema
 */
export function getSystemInfo() {
  const status = getCronStatus();

  return {
    is_initialized: isInitialized,
    initialization_in_progress: initializationPromise !== null,
    cron_status: status,
    environment: process.env.NODE_ENV,
    cron_enabled_in_dev: process.env.ENABLE_CRON_IN_DEV === 'true',
    timestamp: new Date().toISOString()
  };
}

/**
 * Hook para inicialización automática en la aplicación
 * Llamar desde layout.js o middleware
 */
export async function autoInitialize() {
  // Solo auto-inicializar en producción o si está explícitamente habilitado
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_IN_DEV === 'true') {
    try {
      await initializeCronSystem();
    } catch (error) {
      console.error('Error en auto-inicialización de cron:', error);
      // No lanzar error para no romper la aplicación
    }
  }
}

/**
 * Función para ejecutar análisis manual desde la interfaz
 */
export async function triggerManualAnalysis() {
  try {
    const { performDailySalesAnalysis } = await import('./cronJobs');
    const result = await performDailySalesAnalysis();
    return result;
  } catch (error) {
    console.error('Error en análisis manual:', error);
    throw error;
  }
}

// Auto-inicializar si estamos en el servidor
if (typeof window === 'undefined') {
  // Inicializar después de un delay para permitir que la aplicación arranque
  setTimeout(() => {
    autoInitialize().catch(console.error);
  }, 5000);
}

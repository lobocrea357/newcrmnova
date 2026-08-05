import express from 'express';
import supabase from '../config/supabase.js';
import wahaClient from '../config/waha.js';

const router = express.Router();

/**
 * Endpoint de diagnóstico para verificar conectividad
 */
router.get('/status', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Test Supabase
  try {
    console.log('🔍 Probando conexión a Supabase...');
    const start = Date.now();
    const { data, error } = await supabase
      .from('bots')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - start;
    
    if (error) {
      diagnostics.services.supabase = {
        status: 'error',
        error: error.message,
        duration: duration
      };
    } else {
      diagnostics.services.supabase = {
        status: 'ok',
        duration: duration,
        message: 'Conexión exitosa'
      };
    }
  } catch (error) {
    diagnostics.services.supabase = {
      status: 'error',
      error: error.message,
      type: 'connection_failed'
    };
  }

  // Test WAHA (con timeout corto)
  try {
    console.log('🔍 Probando conexión a WAHA...');
    const start = Date.now();
    
    // Timeout muy corto para diagnóstico rápido
    const wahaTestClient = wahaClient.create({
      timeout: 5000 // 5 segundos
    });
    
    const response = await wahaTestClient.get('/api/sessions');
    
    // Obtener versión de WAHA
    let wahaVersion = 'Desconocida';
    let wahaEngine = 'Desconocido';
    let wahaTier = 'Desconocido';
    try {
      const envResponse = await wahaTestClient.get('/api/server/environment');
      if (envResponse.data && envResponse.data.WAHA_VERSION) {
        wahaVersion = envResponse.data.WAHA_VERSION;
      }
      if (envResponse.data && envResponse.data.WHATSAPP_DEFAULT_ENGINE) {
        wahaEngine = envResponse.data.WHATSAPP_DEFAULT_ENGINE;
      }
      // Algunos endpoints devuelven la info en un formato u otro
      // Intentamos con /api/server/version si environment no tiene lo que buscamos
      const versionResponse = await wahaTestClient.get('/api/server/version').catch(() => null);
      if (versionResponse && versionResponse.data) {
        wahaVersion = versionResponse.data.version || wahaVersion;
        wahaTier = versionResponse.data.tier || wahaTier;
      }
    } catch (e) {
      console.warn('No se pudo obtener la versión de WAHA', e.message);
    }
    
    const duration = Date.now() - start;
    
    diagnostics.services.waha = {
      status: 'ok',
      duration: duration,
      sessions: response.data?.length || 0,
      version: wahaVersion,
      engine: wahaEngine,
      tier: wahaTier,
      message: 'Conexión exitosa'
    };
  } catch (error) {
    diagnostics.services.waha = {
      status: 'error',
      error: error.message,
      type: error.code || 'unknown'
    };
  }

  // Determinar estado general
  const allOk = Object.values(diagnostics.services).every(service => service.status === 'ok');
  diagnostics.overall = allOk ? 'healthy' : 'degraded';

  res.json(diagnostics);
});

/**
 * Endpoint para verificar solo Supabase
 */
router.get('/supabase', async (req, res) => {
  try {
    const start = Date.now();
    
    // Test básico
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name, status')
      .limit(5);
    
    if (botsError) throw botsError;
    
    // Test de escritura (insertar y eliminar inmediatamente)
    const testData = {
      session_name: `test_${Date.now()}`,
      status: 'TEST',
      phone_number: '0000000000'
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('bots')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Eliminar el registro de prueba
    await supabase
      .from('bots')
      .delete()
      .eq('id', inserted.id);
    
    const duration = Date.now() - start;
    
    res.json({
      status: 'ok',
      duration: duration,
      bots_count: bots.length,
      read_test: 'passed',
      write_test: 'passed',
      message: 'Supabase funcionando correctamente'
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      code: error.code,
      details: error.details || 'Sin detalles adicionales'
    });
  }
});

export default router;

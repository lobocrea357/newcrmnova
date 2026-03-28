import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rutas
import webhooksRoutes from './routes/webhooks.js';
import botsRoutes from './routes/bots.js';
import messagesRoutes from './routes/messages.js';
import contactsRoutes from './routes/contacts.js';
import chatsRoutes from './routes/chats.js';
import dashboardRoutes from './routes/dashboard.js';
import mediaRoutes from './routes/media.js';
import workersRoutes from './routes/workers.js';
import syncRoutes from './routes/sync.js';
import autoSyncRoutes from './routes/autoSync.js';
import fullSyncRoutes from './routes/fullSync.js';
import diagnosticsRoutes from './routes/diagnostics.js';
import rendimientoRoutes from './routes/rendimiento.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import tasasRoutes from './routes/tasas.js';
import cotizacionesRoutes from './routes/cotizaciones.js';
import vuelosRoutes from './routes/vuelos.js';
import equiposRoutes from './routes/equipos.js';
import rankingsRoutes from './routes/rankings.js';
import agenciasRoutes from './routes/agencias.js';
import sedesRoutes from './routes/sedes.js';

// Importar servicio de auto-sincronización
import autoSyncService from './services/autoSyncService.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rutas
app.use('/webhooks', webhooksRoutes);
app.use('/api/bots', botsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/auto-sync', autoSyncRoutes);
app.use('/api/full-sync', fullSyncRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/rendimiento', rendimientoRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/tasas', tasasRoutes);
app.use('/api/vuelos', vuelosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/agencias', agenciasRoutes);
app.use('/api/sedes', sedesRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM WhatsApp Bot API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CRM WhatsApp Bot API',
    version: '1.0.0',
    endpoints: {
      webhooks: '/webhooks/waha',
      bots: '/api/bots',
      messages: '/api/messages',
      contacts: '/api/contacts',
      chats: '/api/chats',
      dashboard: '/api/dashboard',
      media: '/api/media',
      workers: '/api/workers',
      sync: '/api/sync',
      autoSync: '/api/auto-sync',
      fullSync: '/api/full-sync'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhooks/waha`);
  console.log(`\n⚡ Configuración:`);
  console.log(`   - WAHA URL: ${process.env.WAHA_BASE_URL || 'http://localhost:3000'}`);
  console.log(`   - Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`\n✅ Listo para recibir webhooks de WAHA\n`);
  
  // Iniciar servicio de auto-sincronización
  autoSyncService.start();
});

export default app;

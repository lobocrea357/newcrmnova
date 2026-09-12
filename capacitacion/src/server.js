import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDb } from './db.js';
import apiRouter from './routes/api.js';
import { requireAuth, requireAdmin } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const PORT = process.env.PORT || 4100;
const BASE_PATH = (process.env.BASE_PATH || '/capacitacion').replace(/\/$/, '');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Sessions stored in Postgres so restarts don't log everyone out
const PgSession = connectPgSimple(session);
const sessionMw = session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  name: 'cap_nova_sid',
  secret: process.env.SESSION_SECRET || 'cambia-esto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: BASE_PATH || '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
  },
});

// Everything lives under BASE_PATH (e.g. /capacitacion)
const router = express.Router();
router.use(sessionMw);

// Expose base path to the frontend
router.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.BASE_PATH = ${JSON.stringify(BASE_PATH)};`);
});

// API
router.use('/api', apiRouter);

// Page routes (server-side auth guards)
function sendPage(file) {
  return (req, res) => res.sendFile(path.join(PUBLIC_DIR, file));
}
router.get('/login', sendPage('login.html'));
router.get('/admin', (req, res, next) => {
  if (req.session?.user?.role === 'admin') return sendPage('admin.html')(req, res, next);
  return res.redirect(BASE_PATH + '/login');
});
router.get('/', (req, res, next) => {
  if (req.session?.user) return sendPage('index.html')(req, res, next);
  return res.redirect(BASE_PATH + '/login');
});

// Static assets (css/js/img)
router.use(express.static(PUBLIC_DIR));

// Health
router.get('/health', (req, res) => res.json({ ok: true, service: 'capacitacion-nova' }));

app.use(BASE_PATH, router);

// Redirect bare root to base path (in case someone hits it directly)
app.get('/', (req, res) => res.redirect(BASE_PATH + '/'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  let tries = 0;
  while (true) {
    try {
      await initDb();
      break;
    } catch (e) {
      tries++;
      console.error(`[startup] Falló conexión a DB (intento ${tries}): ${e.message}`);
      if (tries >= 15) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => {
    console.log(`Capacitación Nova escuchando en :${PORT} (base ${BASE_PATH})`);
  });
}

start();

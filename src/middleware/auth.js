/**
 * Autenticación de crm-express.
 *
 * Valida el JWT emitido por el gateway (NestJS) llamando a GET /api/auth/me y
 * cachea el resultado unos segundos. Luego ejecuta el resto de la petición dentro
 * de `requestContext`, para que las consultas al gateway viajen con el token del
 * usuario y el RBAC del gateway se aplique.
 *
 * No se comparte el secreto JWT con express: el gateway es la única autoridad.
 */
import crypto from 'node:crypto';
import { requestContext } from '../lib/requestContext.js';

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.viajesnovatour.com';
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 2_000;
const ADMIN_ROLES = new Set(['super_admin', 'admin']);

/** sha256(token) → { user, exp } */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.exp < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.user;
}

function cacheSet(key, user) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { user, exp: Date.now() + CACHE_TTL_MS });
}

async function resolveUser(token) {
  const key = crypto.createHash('sha256').update(token).digest('hex');
  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await fetch(`${GATEWAY_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`gateway /auth/me respondió ${res.status}`);
  const user = await res.json();
  if (!user?.id) return null;
  cacheSet(key, user);
  return user;
}

function extractToken(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

/** Exige JWT válido de un usuario activo. */
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'No autenticado' });
  }
  let user;
  try {
    user = await resolveUser(token);
  } catch (err) {
    console.error('Auth: error validando token contra el gateway:', err.message);
    return res.status(503).json({ success: false, error: 'Servicio de autenticación no disponible' });
  }
  if (!user) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
  if (user.is_active === false) {
    return res.status(403).json({ success: false, error: 'Usuario desactivado' });
  }
  req.user = { ...user, roleName: user.role?.name || null };
  requestContext.run({ token, user: req.user }, () => next());
}

/** Exige rol admin o super_admin (endpoints operativos). Usar después de requireAuth. */
export function requireAdmin(req, res, next) {
  if (!req.user || !ADMIN_ROLES.has(req.user.roleName)) {
    return res.status(403).json({ success: false, error: 'Requiere rol administrador' });
  }
  next();
}

/** Exige super_admin. Usar después de requireAuth. */
export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.roleName !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: se requiere super_admin' });
  }
  next();
}

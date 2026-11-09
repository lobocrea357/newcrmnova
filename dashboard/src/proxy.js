import { NextResponse } from 'next/server';

/**
 * Exige sesión válida en las rutas /api del dashboard. El token (Bearer) lo pone
 * el interceptor de fetch del navegador; aquí se valida contra el gateway
 * (/api/auth/me) antes de dejar pasar la petición. /api/health queda abierta.
 */
const GATEWAY = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL;
const PUBLIC = new Set(['/api/health']);

// Caché corta para no consultar al gateway en cada petición del mismo usuario.
const cache = new Map();
const TTL_MS = 60_000;

async function isValid(token) {
  const hit = cache.get(token);
  if (hit && hit > Date.now()) return true;
  try {
    const r = await fetch(`${GATEWAY}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!r.ok) return false;
    if (cache.size > 500) cache.clear();
    cache.set(token, Date.now() + TTL_MS);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  if (PUBLIC.has(request.nextUrl.pathname)) return NextResponse.next();
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token || !(await isValid(token))) {
    return NextResponse.json({ error: 'Sesión no válida o vencida. Vuelve a iniciar sesión.' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };

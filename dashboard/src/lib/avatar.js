/**
 * URL pública de un avatar guardado en el bucket `avatars` del storage propio.
 * Acepta una ruta relativa ("uid/foto.jpg") o una URL completa.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function avatarUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}/api/files/avatars/${String(path).replace(/^\/+/, '')}`;
}

/** Iniciales para el avatar sin foto. */
export function initials(name) {
  const parts = String(name || '').trim().split(/[\s._@-]+/).filter(Boolean);
  return ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
}

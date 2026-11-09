/**
 * Cliente para las rutas server-side (app/api/*). Devuelve el mismo apiClient del
 * navegador, respaldado por el gateway NestJS, pero autenticado con el token del
 * usuario que hizo la petición (cabecera Authorization). Así el gateway aplica el
 * RBAC de ese usuario. El proxy (src/proxy.js) ya rechaza peticiones sin sesión.
 *
 * Solo si no hay petición en curso se usa la cuenta de servicio.
 */
import { headers } from 'next/headers';
import { createApiClient, setServerTokenResolver } from './apiClient';

setServerTokenResolver(async () => {
  const h = await headers();
  const auth = h.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;
});

export function createClient(/* url, key, opts */) {
  return createApiClient();
}

export default createClient;

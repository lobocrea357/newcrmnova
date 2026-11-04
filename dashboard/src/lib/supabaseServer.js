/**
 * Shim de `createClient` para las rutas server-side (app/api/*) que antes creaban
 * su propio cliente de Supabase con SERVICE_ROLE_KEY. Devuelve el cliente propio
 * (apiClient) respaldado por el gateway NestJS, que server-side usa login de
 * servicio (SERVICE_EMAIL / SERVICE_PASSWORD). Se ignoran url y key.
 *
 * Así cada ruta solo cambia el origen del import:
 *   - import { createClient } from '@supabase/supabase-js'
 *   + import { createClient } from '@/lib/supabaseServer'
 */
import { createApiClient } from './apiClient';

export function createClient(/* url, key, opts */) {
  return createApiClient();
}

export default createClient;

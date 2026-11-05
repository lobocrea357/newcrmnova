/**
 * Contexto por petición (AsyncLocalStorage).
 *
 * El middleware de auth guarda aquí el JWT del usuario que llama. El cliente del
 * gateway (config/supabase.js) lo usa en lugar de la cuenta de servicio, de modo
 * que el RBAC del gateway (qué ve cada rol) se aplica también a todo lo que
 * express consulta en nombre de ese usuario.
 *
 * Sin contexto (webhooks de WAHA, schedulers, arranque) → cuenta de servicio.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage();

/** Token del usuario de la petición en curso, o null. */
export function currentUserToken() {
  return requestContext.getStore()?.token || null;
}

/** Usuario autenticado de la petición en curso, o null. */
export function currentUser() {
  return requestContext.getStore()?.user || null;
}

/**
 * Ejecuta `fn` fuera del contexto del usuario (como servicio). Necesario para
 * trabajo de larga duración lanzado desde una petición (timers/intervals), que
 * de otro modo heredaría el token del usuario.
 */
export function runAsService(fn) {
  return requestContext.exit(fn);
}

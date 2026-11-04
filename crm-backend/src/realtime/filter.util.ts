/**
 * Replica el matching de filtros de Supabase Realtime en el servidor.
 * Formato del filtro: "columna=op.valor"  (ej: "chat_id=eq.<uuid>", "autorizado_emision=eq.true").
 * Operadores soportados: eq, neq, gt, gte, lt, lte, in.
 */

export interface RealtimeChange {
  table: string;
  schema?: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any | null;
  old: any | null;
  truncated?: boolean;
}

function coerce(val: string): any {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (val !== '' && !isNaN(Number(val))) return Number(val);
  return val;
}

function looseEq(a: any, b: any): boolean {
  if (a === b) return true;
  // comparar string vs number/boolean de forma laxa
  return String(a) === String(b);
}

/** Evalúa un filtro supabase contra la fila relevante del cambio. */
export function filterMatches(filter: string | undefined, change: RealtimeChange): boolean {
  if (!filter) return true;
  const row = change.eventType === 'DELETE' ? change.old : change.new;
  if (!row) return change.truncated === true ? true : false; // sin fila (truncado) → dejamos pasar

  const m = filter.match(/^([^=]+)=([a-z]+)\.(.*)$/);
  if (!m) return true; // filtro no reconocido → no bloquear
  const [, col, op, rawVal] = m;
  const actual = row[col];

  switch (op) {
    case 'eq':
      return looseEq(actual, coerce(rawVal));
    case 'neq':
      return !looseEq(actual, coerce(rawVal));
    case 'gt':
      return Number(actual) > Number(rawVal);
    case 'gte':
      return Number(actual) >= Number(rawVal);
    case 'lt':
      return Number(actual) < Number(rawVal);
    case 'lte':
      return Number(actual) <= Number(rawVal);
    case 'in': {
      const list = rawVal.replace(/^\(/, '').replace(/\)$/, '').split(',').map((s) => coerce(s.trim()));
      return list.some((v) => looseEq(actual, v));
    }
    default:
      return true;
  }
}

/** ¿El evento del cliente ('*', 'INSERT', ...) coincide con el del cambio? */
export function eventMatches(subEvent: string | undefined, eventType: string): boolean {
  if (!subEvent || subEvent === '*') return true;
  return subEvent.toUpperCase() === eventType;
}

/**
 * Limpia strings antes de enviarlos a Postgres:
 *  - surrogates UTF-16 sueltos (p. ej. un emoji cortado por substring) → el
 *    motor de Prisma los rechaza con "InvalidArg" y se pierde la escritura entera.
 *  - byte nulo \u0000 → Postgres no lo admite en text/jsonb.
 * Recorre objetos y arrays en profundidad; no toca otros tipos.
 */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const NUL = /\u0000/g;

export function sanitizeDeep<T>(v: T): T {
  if (typeof v === 'string') return v.replace(LONE_SURROGATE, '').replace(NUL, '') as any;
  if (Array.isArray(v)) return v.map(sanitizeDeep) as any;
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out: any = {};
    for (const [k, x] of Object.entries(v)) out[k] = sanitizeDeep(x);
    return out;
  }
  return v;
}

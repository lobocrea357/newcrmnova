import { Prisma } from '@prisma/client';

/**
 * Prisma exige ISO-8601 completo en columnas DateTime, pero supabase-js/PostgREST
 * aceptaban 'YYYY-MM-DD' o '2026-11-08 21:22:19+00'. Normalizamos esos strings
 * en valores de escritura y filtros, solo para columnas DateTime del modelo.
 */
const dateFields = new Map<string, Set<string>>();
for (const m of Prisma.dmmf.datamodel.models) {
  dateFields.set(m.name, new Set(m.fields.filter((f) => f.type === 'DateTime').map((f) => f.name)));
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(v: any): any {
  if (typeof v !== 'string' || v === '') return v;
  if (DATE_ONLY.test(v)) return `${v}T00:00:00.000Z`;
  const t = Date.parse(v.includes(' ') && !v.includes('T') ? v.replace(' ', 'T') : v);
  return Number.isNaN(t) ? v : new Date(t).toISOString();
}

function fixRow(fields: Set<string>, row: any) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const out: any = { ...row };
  for (const k of Object.keys(out)) if (fields.has(k)) out[k] = toIsoDate(out[k]);
  return out;
}

function fixFilter(fields: Set<string>, f: any) {
  if (!f || !fields.has(f.column)) return f;
  return { ...f, value: Array.isArray(f.value) ? f.value.map(toIsoDate) : toIsoDate(f.value) };
}

/** Normaliza fechas en values / filters / or de un body del gateway. */
export function normalizeDates(model: string, body: any): any {
  const fields = dateFields.get(model);
  if (!fields || !fields.size || !body) return body;
  const out: any = { ...body };
  if (out.values !== undefined) {
    out.values = Array.isArray(out.values) ? out.values.map((r: any) => fixRow(fields, r)) : fixRow(fields, out.values);
  }
  if (Array.isArray(out.filters)) out.filters = out.filters.map((f: any) => fixFilter(fields, f));
  if (Array.isArray(out.or)) out.or = out.or.map((g: any[]) => (Array.isArray(g) ? g.map((f) => fixFilter(fields, f)) : g));
  return out;
}

/**
 * Traductor de un contrato de consulta estilo PostgREST / supabase-js
 * a los argumentos que entiende Prisma (where / select / include / orderBy / take / skip).
 *
 * El frontend (Fase 5) envía estas consultas como JSON, por lo que los valores
 * llegan ya tipados (number/boolean/null/string) y no hace falta coerción.
 */

export type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is';

export interface Filter {
  column: string;
  op: FilterOp;
  value: any;
  /** true cuando viene de supabase `.not(col, op, val)` */
  negate?: boolean;
}

export interface OrderSpec {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

export interface QueryBody {
  select?: string;
  filters?: Filter[];
  /** grupos OR: supabase `.or('a.eq.1,b.eq.2')` → [[{a eq 1},{b eq 2}]] */
  or?: Filter[][];
  order?: OrderSpec[];
  limit?: number;
  offset?: number;
  /** supabase .range(from, to) inclusivo */
  range?: [number, number];
  single?: boolean;
  maybeSingle?: boolean;
  count?: 'exact' | null;
}

/** Convierte un patrón ilike/like ('%x%', 'x%', '%x', 'x') a condición Prisma string. */
function likeCondition(value: any, insensitive: boolean) {
  const mode = insensitive ? { mode: 'insensitive' as const } : {};
  if (typeof value !== 'string') return { equals: value, ...mode };
  const starts = value.startsWith('%');
  const ends = value.endsWith('%');
  const core = value.replace(/^%/, '').replace(/%$/, '');
  if (starts && ends) return { contains: core, ...mode };
  if (ends) return { startsWith: core, ...mode };
  if (starts) return { endsWith: core, ...mode };
  return { equals: value, ...mode };
}

/** Construye la condición Prisma para un único filtro (sin el nombre de columna). */
function opCondition(op: FilterOp, value: any): any {
  switch (op) {
    case 'eq':
      return { equals: value };
    case 'neq':
      return { not: value };
    case 'gt':
      return { gt: value };
    case 'gte':
      return { gte: value };
    case 'lt':
      return { lt: value };
    case 'lte':
      return { lte: value };
    case 'like':
      return likeCondition(value, false);
    case 'ilike':
      return likeCondition(value, true);
    case 'in':
      return { in: Array.isArray(value) ? value : [value] };
    case 'is':
      // supabase `.is(col, null)` / `.is(col, true/false)`
      return { equals: value };
    default:
      return { equals: value };
  }
}

/** Arma el objeto { [col]: condition } para un filtro. */
function filterToWhere(f: Filter): Record<string, any> {
  return { [f.column]: opCondition(f.op, f.value) };
}

export function buildWhere(body: QueryBody): Record<string, any> {
  const where: Record<string, any> = {};
  const AND: any[] = [];
  const NOT: any[] = [];

  for (const f of body.filters || []) {
    if (f.negate) NOT.push(filterToWhere(f));
    else AND.push(filterToWhere(f));
  }

  if (AND.length) where.AND = AND;
  if (NOT.length) where.NOT = NOT;

  // grupos OR (cada grupo es un conjunto de condiciones OR entre sí)
  if (body.or && body.or.length) {
    const orGroups = body.or.map((group) => ({
      OR: group.map((f) =>
        f.negate ? { NOT: filterToWhere(f) } : filterToWhere(f),
      ),
    }));
    // varios .or() encadenados => todos deben cumplirse (AND de grupos OR)
    if (orGroups.length === 1) {
      Object.assign(where, orGroups[0]);
    } else {
      where.AND = [...(where.AND || []), ...orGroups];
    }
  }

  return where;
}

export function buildOrderBy(body: QueryBody): any[] | undefined {
  if (!body.order || !body.order.length) return undefined;
  return body.order.map((o) => ({
    [o.column]:
      o.nullsFirst !== undefined
        ? { sort: o.ascending === false ? 'desc' : 'asc', nulls: o.nullsFirst ? 'first' : 'last' }
        : o.ascending === false
          ? 'desc'
          : 'asc',
  }));
}

export function buildTakeSkip(body: QueryBody): { take?: number; skip?: number } {
  // range inclusivo tiene prioridad (supabase .range(from, to))
  if (body.range && body.range.length === 2) {
    const [from, to] = body.range;
    return { skip: from, take: to - from + 1 };
  }
  const res: { take?: number; skip?: number } = {};
  if (typeof body.limit === 'number') res.take = body.limit;
  if (typeof body.offset === 'number') res.skip = body.offset;
  return res;
}

/* ----------------------- Parser del string `select` ----------------------- */

interface ParsedSelect {
  hasStar: boolean;
  scalars: { name: string; alias?: string }[];
  relations: { name: string; alias?: string; inner: ParsedSelect }[];
}

/** Separa por comas respetando paréntesis anidados. */
function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function parseSelect(select?: string): ParsedSelect | null {
  if (!select) return null;
  const node: ParsedSelect = { hasStar: false, scalars: [], relations: [] };
  for (const token of splitTopLevel(select)) {
    // alias opcional:  alias:expr
    let alias: string | undefined;
    let expr = token;
    const colonIdx = token.indexOf(':');
    const parenIdx = token.indexOf('(');
    if (colonIdx !== -1 && (parenIdx === -1 || colonIdx < parenIdx)) {
      alias = token.slice(0, colonIdx).trim();
      expr = token.slice(colonIdx + 1).trim();
    }
    if (expr === '*') {
      node.hasStar = true;
    } else if (expr.includes('(')) {
      const name = expr.slice(0, expr.indexOf('(')).trim();
      const innerStr = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')'));
      node.relations.push({ name, alias, inner: parseSelect(innerStr)! });
    } else {
      node.scalars.push({ name: expr, alias });
    }
  }
  return node;
}

/**
 * Devuelve { select } o { include } para Prisma a partir del árbol parseado.
 * - Si hay `*` y relaciones → usa include (todos los escalares + relaciones).
 * - Si hay `*` y nada más → undefined (Prisma devuelve todos los escalares).
 * - Si no hay `*` → select explícito.
 */
export function parsedToPrisma(parsed: ParsedSelect | null):
  | { select?: any; include?: any }
  | undefined {
  if (!parsed) return undefined;

  const buildRelation = (rel: { inner: ParsedSelect }) => {
    const nested = parsedToPrisma(rel.inner);
    if (!nested || (nested.select === undefined && nested.include === undefined)) {
      return true; // (*) → traer toda la relación
    }
    return nested;
  };

  if (parsed.hasStar) {
    if (parsed.relations.length === 0) return undefined; // solo escalares
    const include: Record<string, any> = {};
    for (const rel of parsed.relations) include[rel.name] = buildRelation(rel);
    return { include };
  }

  const select: Record<string, any> = {};
  for (const s of parsed.scalars) select[s.name] = true;
  for (const rel of parsed.relations) select[rel.name] = buildRelation(rel);
  if (Object.keys(select).length === 0) return undefined;
  return { select };
}

/** Mapa de alias → nombre real, para renombrar en la respuesta. */
export function aliasMap(parsed: ParsedSelect | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!parsed) return map;
  for (const s of parsed.scalars) if (s.alias && s.alias !== s.name) map[s.name] = s.alias;
  for (const r of parsed.relations) if (r.alias && r.alias !== r.name) map[r.name] = r.alias;
  return map;
}

/** Renombra claves de un registro según el alias map (nivel superior). */
export function applyAliases(row: any, map: Record<string, string>): any {
  if (!row || typeof row !== 'object' || Object.keys(map).length === 0) return row;
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    out[map[k] || k] = v;
  }
  return out;
}

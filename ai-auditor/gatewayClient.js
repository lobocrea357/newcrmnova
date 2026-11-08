/* Copia CommonJS de src/config/supabase.js (crm-express). Mantener en sincronía. */
/**
 * Cliente compatible con supabase-js para crm-express, respaldado por el backend
 * propio (NestJS gateway). Reemplaza al cliente de Supabase sin tocar las ~333
 * llamadas .from()/.storage/.auth.admin/.rpc de las rutas y servicios.
 *
 * Autenticación:
 *  - Dentro de una petición autenticada (middleware/auth.js) se usa el JWT del
 *    USUARIO que llama → el gateway aplica su RBAC (qué ve cada rol).
 *  - Fuera de petición (webhooks de WAHA, schedulers, arranque) se usa la cuenta
 *    de servicio (SERVICE_EMAIL / SERVICE_PASSWORD), con JWT cacheado y re-login
 *    ante un 401.
 *
 * Config (env):
 *   GATEWAY_URL        base del gateway (default https://api.viajesnovatour.com)
 *   SERVICE_EMAIL      email de la cuenta de servicio (admin)
 *   SERVICE_PASSWORD   password de la cuenta de servicio
 */
require('dotenv').config();
// ai-auditor es un proceso de fondo sin usuarios: siempre usa la cuenta de servicio.
const currentUserToken = () => null;

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.viajesnovatour.com';
const SERVICE_EMAIL = process.env.SERVICE_EMAIL;
const SERVICE_PASSWORD = process.env.SERVICE_PASSWORD;

let cachedToken = null;

async function login() {
  const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Service login falló (${res.status}): ${t}`);
  }
  const json = await res.json();
  cachedToken = json.access_token;
  return cachedToken;
}

async function ensureToken() {
  if (cachedToken) return cachedToken;
  if (!SERVICE_EMAIL || !SERVICE_PASSWORD) {
    throw new Error('Faltan SERVICE_EMAIL / SERVICE_PASSWORD para el cliente de servicio');
  }
  return login();
}

/**
 * fetch al gateway. Usa el token del usuario de la petición en curso si existe
 * (salvo `asService`); si no, el de servicio con re-login ante 401.
 */
async function apiFetch(path, { method = 'GET', body, isForm = false, asService = false } = {}) {
  const doFetch = async (token) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload = body;
    if (!isForm) {
      headers['Content-Type'] = 'application/json';
      payload = body !== undefined ? JSON.stringify(body) : undefined;
    }
    return fetch(`${GATEWAY_URL}/api${path}`, { method, headers, body: payload });
  };

  const userToken = asService ? null : currentUserToken();
  let res;
  if (userToken) {
    // Nunca se "escala" a la cuenta de servicio si el token del usuario falla.
    res = await doFetch(userToken);
  } else {
    let token = await ensureToken();
    res = await doFetch(token);
    if (res.status === 401) {
      cachedToken = null;
      token = await login();
      res = await doFetch(token);
    }
  }

  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }
  if (!res.ok) {
    return {
      ok: false,
      error: {
        message: json?.message || res.statusText || 'Error de red',
        code: json?.error || String(res.status),
        status: res.status,
        details: json,
      },
      json,
    };
  }
  return { ok: true, json };
}

/* --------------------------- Query/Mutation builder ------------------------ */

const OP = { eq:'eq', neq:'neq', gt:'gt', gte:'gte', lt:'lt', lte:'lte', like:'like', ilike:'ilike', in:'in', is:'is' };

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._op = 'query';
    this._select = undefined;
    this._filters = [];
    this._or = [];
    this._order = [];
    this._limit = undefined;
    this._offset = undefined;
    this._range = undefined;
    this._single = false;
    this._maybeSingle = false;
    this._count = undefined;
    this._head = false;
    this._values = undefined;
    this._onConflict = undefined;
  }
  select(cols = '*', opts = {}) {
    this._select = cols || '*';
    if (opts.count) this._count = opts.count;
    if (opts.head) this._head = true;
    return this;
  }
  insert(values) { this._op = 'insert'; this._values = values; return this; }
  upsert(values, opts = {}) { this._op = 'upsert'; this._values = values; this._onConflict = opts.onConflict; return this; }
  update(values) { this._op = 'update'; this._values = values; return this; }
  delete() { this._op = 'delete'; return this; }
  _f(column, op, value, negate = false) { this._filters.push({ column, op: OP[op] || op, value, negate }); return this; }
  eq(c,v){return this._f(c,'eq',v);} neq(c,v){return this._f(c,'neq',v);}
  gt(c,v){return this._f(c,'gt',v);} gte(c,v){return this._f(c,'gte',v);}
  lt(c,v){return this._f(c,'lt',v);} lte(c,v){return this._f(c,'lte',v);}
  like(c,v){return this._f(c,'like',v);} ilike(c,v){return this._f(c,'ilike',v);}
  in(c,arr){return this._f(c,'in',arr);} is(c,v){return this._f(c,'is',v);}
  not(c,op,v){return this._f(c,op,v,true);}
  match(obj = {}) { for (const [c,v] of Object.entries(obj)) this._f(c,'eq',v); return this; }
  or(expr) {
    const group = [];
    for (const part of String(expr).split(',')) {
      const m = part.trim().match(/^([^.]+)\.([a-z]+)\.(.*)$/);
      if (m) group.push({ column: m[1], op: OP[m[2]] || m[2], value: m[3] });
    }
    if (group.length) this._or.push(group);
    return this;
  }
  order(column, opts = {}) { this._order.push({ column, ascending: opts.ascending !== false, nullsFirst: opts.nullsFirst }); return this; }
  limit(n) { this._limit = n; return this; }
  range(from, to) { this._range = [from, to]; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  _queryPayload() {
    const p = { select: this._select || '*' };
    if (this._filters.length) p.filters = this._filters;
    if (this._or.length) p.or = this._or;
    if (this._order.length) p.order = this._order;
    if (this._head) p.limit = 0;
    else {
      if (this._limit !== undefined) p.limit = this._limit;
      if (this._offset !== undefined) p.offset = this._offset;
      if (this._range) p.range = this._range;
    }
    if (this._single) p.single = true;
    if (this._maybeSingle) p.maybeSingle = true;
    if (this._count) p.count = this._count;
    return p;
  }

  async _execute() {
    let r;
    const sel = this._select;
    switch (this._op) {
      case 'insert':
        r = await apiFetch(`/data/${this.table}/insert`, { method: 'POST', body: { values: this._values, select: sel, single: this._single } });
        break;
      case 'upsert':
        r = await apiFetch(`/data/${this.table}/upsert`, { method: 'POST', body: { values: this._values, onConflict: this._onConflict, select: sel } });
        break;
      case 'update':
        r = await apiFetch(`/data/${this.table}`, { method: 'PATCH', body: { values: this._values, filters: this._filters, or: this._or.length ? this._or : undefined, select: sel, single: this._single } });
        break;
      case 'delete':
        r = await apiFetch(`/data/${this.table}`, { method: 'DELETE', body: { filters: this._filters, or: this._or.length ? this._or : undefined, select: sel } });
        break;
      default:
        r = await apiFetch(`/data/${this.table}/query`, { method: 'POST', body: this._queryPayload() });
    }
    if (!r.ok) return { data: null, error: r.error, count: null, status: r.error.status };
    const payload = r.json || {};
    return { data: payload.data !== undefined ? payload.data : payload, error: null, count: payload.count ?? null, status: 200 };
  }
  then(onF, onR) { return this._execute().then(onF, onR); }
  catch(onR) { return this._execute().catch(onR); }
}

/* -------------------------------- Storage --------------------------------- */

function storageFrom(bucket) {
  return {
    async upload(path, fileData, opts = {}) {
      try {
        const form = new FormData();
        form.append('path', path);
        // fileData puede ser Buffer, Uint8Array o Blob
        const blob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: opts.contentType || 'application/octet-stream' });
        form.append('file', blob, path.split('/').pop() || 'file');
        const r = await apiFetch(`/files/${bucket}`, { method: 'POST', body: form, isForm: true });
        if (!r.ok) return { data: null, error: r.error };
        return { data: { path, ...(r.json?.data || {}) }, error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    },
    getPublicUrl(path) {
      const base = process.env.STORAGE_PUBLIC_BASE || `${GATEWAY_URL}/api`;
      return { data: { publicUrl: `${base}/files/${bucket}/${path}` } };
    },
    async remove(paths) {
      const r = await apiFetch(`/files/${bucket}`, { method: 'DELETE', body: { paths: Array.isArray(paths) ? paths : [paths] } });
      return r.ok ? { data: null, error: null } : { data: null, error: r.error };
    },
    async download(path) {
      try {
        const token = await ensureToken();
        const res = await fetch(`${GATEWAY_URL}/api/files/${bucket}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return { data: null, error: { message: `download ${res.status}` } };
        const buf = Buffer.from(await res.arrayBuffer());
        return { data: buf, error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    },
  };
}

/* ---------------------------- Auth admin (service) ------------------------- */

const authAdmin = {
  async createUser({ email, password, email_confirm }) {
    const r = await apiFetch('/auth/admin/users', { method: 'POST', body: { email, password, email_confirm } });
    if (!r.ok) return { data: { user: null }, error: r.error };
    return { data: r.json, error: null }; // { user: { id, email } }
  },
  async updateUserById(id, updates) {
    const r = await apiFetch(`/auth/admin/users/${id}`, { method: 'PATCH', body: updates });
    if (!r.ok) return { data: { user: null }, error: r.error };
    return { data: r.json, error: null };
  },
  async deleteUser(id) {
    const r = await apiFetch(`/auth/admin/users/${id}`, { method: 'DELETE' });
    if (!r.ok) return { data: null, error: r.error };
    return { data: r.json, error: null };
  },
  async listUsers() {
    // No expuesto por el gateway (users está protegida). Solo lo usan scripts.
    return { data: { users: [] }, error: null };
  },
};

/* -------------------------------- Cliente --------------------------------- */

const supabase = {
  from(table) { return new QueryBuilder(table); },
  storage: { from: storageFrom },
  auth: { admin: authAdmin },
  async rpc(fn, args = {}) {
    // Funciones SQL internas de express (agregados): el gateway las reserva a
    // admin, así que se ejecutan como servicio. La ruta que las llama ya exige auth.
    const r = await apiFetch(`/data/rpc/${fn}`, { method: 'POST', body: args || {}, asService: true });
    if (!r.ok) return { data: null, error: r.error };
    const payload = r.json || {};
    return { data: payload.data !== undefined ? payload.data : payload, error: null };
  },
};

module.exports = { supabase, createClient: () => supabase };

/**
 * apiClient — cliente compatible con la superficie de supabase-js, pero
 * respaldado por el backend propio NestJS (gateway /api/data, /api/auth y
 * WebSocket /realtime). Permite reemplazar `createClient()` sin tocar los
 * ~216 call sites que usan `supabase.from().select()...`, `supabase.auth.*`
 * y `supabase.channel()`.
 *
 * Config: NEXT_PUBLIC_API_URL (ej. https://api.viajesnovatour.com). El socket
 * se deriva del mismo origen.
 */

import { io } from 'socket.io-client';

const API_URL =
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000';

const TOKEN_KEY = 'nova_access_token';
const USER_KEY = 'nova_user';

/* ----------------------------- almacenamiento ----------------------------- */

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getToken() {
  if (isBrowser()) {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  // en servidor (rutas Next API) permite un token de servicio
  if (typeof process !== 'undefined' && process.env) {
    return process.env.CRM_SERVICE_TOKEN || null;
  }
  return null;
}

function setSession(token, user) {
  if (!isBrowser()) return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

function clearSession() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

function getStoredUser() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ------------------------------- HTTP base -------------------------------- */

async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
    const err = {
      message: json?.message || res.statusText || 'Error de red',
      code: json?.error || String(res.status),
      status: res.status,
      details: json,
    };
    return { ok: false, error: err, json };
  }
  return { ok: true, json };
}

/* --------------------------- Query/Mutation builder ------------------------ */

const OP_MAP = {
  eq: 'eq',
  neq: 'neq',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  like: 'like',
  ilike: 'ilike',
  in: 'in',
  is: 'is',
};

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

  /* ------- selección / conteo ------- */
  select(cols = '*', opts = {}) {
    this._select = cols || '*';
    if (opts.count) this._count = opts.count;
    if (opts.head) this._head = true;
    return this;
  }

  /* ------- mutaciones ------- */
  insert(values) {
    this._op = 'insert';
    this._values = values;
    return this;
  }
  upsert(values, opts = {}) {
    this._op = 'upsert';
    this._values = values;
    this._onConflict = opts.onConflict;
    return this;
  }
  update(values) {
    this._op = 'update';
    this._values = values;
    return this;
  }
  delete() {
    this._op = 'delete';
    return this;
  }

  /* ------- filtros ------- */
  _addFilter(column, op, value, negate = false) {
    this._filters.push({ column, op: OP_MAP[op] || op, value, negate });
    return this;
  }
  eq(c, v) {
    return this._addFilter(c, 'eq', v);
  }
  neq(c, v) {
    return this._addFilter(c, 'neq', v);
  }
  gt(c, v) {
    return this._addFilter(c, 'gt', v);
  }
  gte(c, v) {
    return this._addFilter(c, 'gte', v);
  }
  lt(c, v) {
    return this._addFilter(c, 'lt', v);
  }
  lte(c, v) {
    return this._addFilter(c, 'lte', v);
  }
  like(c, v) {
    return this._addFilter(c, 'like', v);
  }
  ilike(c, v) {
    return this._addFilter(c, 'ilike', v);
  }
  in(c, arr) {
    return this._addFilter(c, 'in', arr);
  }
  is(c, v) {
    return this._addFilter(c, 'is', v);
  }
  /** supabase .not(col, op, value) */
  not(column, op, value) {
    return this._addFilter(column, op, value, true);
  }
  /** supabase .match({col:val,...}) → varios eq */
  match(obj = {}) {
    for (const [c, v] of Object.entries(obj)) this._addFilter(c, 'eq', v);
    return this;
  }
  /** supabase .or('a.eq.1,b.ilike.%x%') */
  or(expr) {
    const group = [];
    for (const part of String(expr).split(',')) {
      const m = part.trim().match(/^([^.]+)\.([a-z]+)\.(.*)$/);
      if (m) group.push({ column: m[1], op: OP_MAP[m[2]] || m[2], value: m[3] });
    }
    if (group.length) this._or.push(group);
    return this;
  }

  /* ------- orden / paginación ------- */
  order(column, opts = {}) {
    this._order.push({
      column,
      ascending: opts.ascending !== false,
      nullsFirst: opts.nullsFirst,
    });
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  range(from, to) {
    this._range = [from, to];
    return this;
  }
  single() {
    this._single = true;
    return this;
  }
  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  /* ------- ejecución ------- */
  _queryPayload() {
    const p = { select: this._select || '*' };
    if (this._filters.length) p.filters = this._filters;
    if (this._or.length) p.or = this._or;
    if (this._order.length) p.order = this._order;
    if (this._head) {
      p.limit = 0;
    } else {
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
        r = await apiFetch(`/data/${this.table}/insert`, {
          method: 'POST',
          body: { values: this._values, select: sel, single: this._single },
        });
        break;
      case 'upsert':
        r = await apiFetch(`/data/${this.table}/upsert`, {
          method: 'POST',
          body: { values: this._values, onConflict: this._onConflict, select: sel },
        });
        break;
      case 'update':
        r = await apiFetch(`/data/${this.table}`, {
          method: 'PATCH',
          body: {
            values: this._values,
            filters: this._filters,
            or: this._or.length ? this._or : undefined,
            select: sel,
            single: this._single,
          },
        });
        break;
      case 'delete':
        r = await apiFetch(`/data/${this.table}`, {
          method: 'DELETE',
          body: {
            filters: this._filters,
            or: this._or.length ? this._or : undefined,
            select: sel,
          },
        });
        break;
      case 'query':
      default:
        r = await apiFetch(`/data/${this.table}/query`, {
          method: 'POST',
          body: this._queryPayload(),
        });
        break;
    }

    if (!r.ok) {
      return { data: null, error: r.error, count: null, status: r.error.status };
    }
    const payload = r.json || {};
    return {
      data: payload.data !== undefined ? payload.data : payload,
      error: null,
      count: payload.count ?? null,
      status: 200,
    };
  }

  // hace el builder "thenable" para soportar await
  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this._execute().catch(onRejected);
  }
}

/* -------------------------------- Auth ------------------------------------ */

function createAuth() {
  const listeners = new Set();
  function notify(event) {
    const session = currentSession();
    for (const cb of listeners) {
      try {
        cb(event, session);
      } catch {
        /* ignore */
      }
    }
  }
  function currentSession() {
    const token = getToken();
    const user = getStoredUser();
    return token && user ? { access_token: token, user } : null;
  }

  return {
    async signInWithPassword({ email, password }) {
      const r = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (!r.ok) {
        return { data: { user: null, session: null }, error: r.error };
      }
      const { access_token, user } = r.json;
      setSession(access_token, user);
      notify('SIGNED_IN');
      return {
        data: { user, session: { access_token, user } },
        error: null,
      };
    },

    async signOut() {
      clearSession();
      notify('SIGNED_OUT');
      return { error: null };
    },

    async getSession() {
      return { data: { session: currentSession() }, error: null };
    },

    async getUser() {
      const token = getToken();
      if (!token) return { data: { user: null }, error: null };
      // valida contra el backend y refresca el perfil almacenado
      const r = await apiFetch('/auth/me');
      if (!r.ok) {
        return { data: { user: null }, error: r.error };
      }
      const user = r.json;
      setSession(token, user);
      return { data: { user }, error: null };
    },

    async refreshSession() {
      const session = currentSession();
      return { data: { session }, error: session ? null : { message: 'No session' } };
    },

    onAuthStateChange(cb) {
      listeners.add(cb);
      // emite el estado inicial como hace supabase
      try {
        cb('INITIAL_SESSION', currentSession());
      } catch {
        /* ignore */
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(cb);
            },
          },
        },
      };
    },
  };
}

/* ------------------------------- Realtime --------------------------------- */

let sharedSocket = null;
let subCounter = 0;

function getSocket() {
  if (sharedSocket) return sharedSocket;
  sharedSocket = io(`${API_URL}/realtime`, {
    transports: ['websocket'],
    autoConnect: true,
    auth: (cb) => cb({ token: getToken() }),
  });
  return sharedSocket;
}

class RealtimeChannel {
  constructor(name) {
    this.name = name;
    this.bindings = []; // { subId, config, cb }
    this._subscribed = false;
  }

  on(type, config, cb) {
    // solo soportamos 'postgres_changes'
    if (type === 'postgres_changes') {
      const subId = `${this.name}:${++subCounter}`;
      this.bindings.push({ subId, config, cb });
    }
    return this;
  }

  subscribe(statusCb) {
    const socket = getSocket();
    const doSubscribe = () => {
      for (const b of this.bindings) {
        socket.emit('subscribe', {
          subId: b.subId,
          table: b.config.table,
          event: b.config.event,
          filter: b.config.filter,
        });
      }
      this._subscribed = true;
      if (statusCb) statusCb('SUBSCRIBED');
    };

    // handler de cambios: enruta por subId al binding correspondiente
    this._changeHandler = ({ subId, payload }) => {
      const b = this.bindings.find((x) => x.subId === subId);
      if (b) b.cb(payload);
    };
    socket.on('change', this._changeHandler);

    if (socket.connected) doSubscribe();
    else socket.once('connect', doSubscribe);

    return this;
  }

  _teardown() {
    const socket = sharedSocket;
    if (!socket) return;
    for (const b of this.bindings) {
      socket.emit('unsubscribe', { subId: b.subId });
    }
    if (this._changeHandler) socket.off('change', this._changeHandler);
    this._subscribed = false;
  }
}

/* -------------------------------- Storage --------------------------------- */
/**
 * Cliente de Storage respaldado por el endpoint /api/files del backend NestJS.
 * Compatible con supabase.storage.from(bucket).upload/getPublicUrl/remove.
 */
function createStorage() {
  return {
    from(bucket) {
      return {
        /** upload(path, file, opts) — file es un File/Blob del navegador */
        async upload(path, file /*, opts */) {
          try {
            const form = new FormData();
            form.append('path', path);
            form.append('file', file);
            const headers = {};
            const token = getToken();
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_URL}/api/files/${bucket}`, {
              method: 'POST',
              headers, // sin Content-Type: el navegador pone el boundary
              body: form,
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
              return {
                data: null,
                error: { message: json?.message || 'Error al subir archivo', status: res.status },
              };
            }
            return { data: { path, ...(json?.data || {}) }, error: null };
          } catch (e) {
            return { data: null, error: { message: e.message } };
          }
        },

        getPublicUrl(path) {
          return { data: { publicUrl: `${API_URL}/api/files/${bucket}/${path}` } };
        },

        async remove(paths) {
          try {
            const res = await apiFetch(`/files/${bucket}`, {
              method: 'DELETE',
              body: { paths: Array.isArray(paths) ? paths : [paths] },
            });
            return res.ok ? { data: null, error: null } : { data: null, error: res.error };
          } catch (e) {
            return { data: null, error: { message: e.message } };
          }
        },
      };
    },
  };
}

/* ------------------------------ Cliente raíz ------------------------------ */

export function createApiClient() {
  const auth = createAuth();
  const storage = createStorage();
  const channels = new Set();

  return {
    from(table) {
      return new QueryBuilder(table);
    },
    auth,
    storage,
    channel(name) {
      const ch = new RealtimeChannel(name);
      channels.add(ch);
      return ch;
    },
    removeChannel(ch) {
      if (ch && typeof ch._teardown === 'function') ch._teardown();
      channels.delete(ch);
      return Promise.resolve({ error: null });
    },
    removeAllChannels() {
      for (const ch of channels) ch._teardown?.();
      channels.clear();
      return Promise.resolve({ error: null });
    },
    // base URL expuesta por si algún helper la necesita
    _apiUrl: API_URL,
  };
}

export default createApiClient;

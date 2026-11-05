import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RBAC del gateway — equivalente server-side de lo que antes imponían Supabase RLS
 * y los filtros del frontend (useBots / isBotVisibleForUser / ROUTES_BY_ROLE).
 *
 * Visibilidad de bots (espejo exacto del frontend):
 *   - super_admin, admin  → todos
 *   - supervisor          → solo sesiones `*_other`
 *   - con bot_session_suffix → sesiones que terminan en el sufijo
 *   - sin sufijo          → todas excepto `*_other`
 *   - sin rol             → ninguno
 *
 * Todo lo que cuelga de un bot (chats, mensajes, media, contactos, evaluaciones…)
 * hereda esa visibilidad. Las escrituras sobre catálogos (roles, permisos, tasas,
 * equipos…) exigen el permiso correspondiente de role_permissions/user_permissions.
 */

export interface UserCtx {
  id: string;
  email: string | null;
  role: string | null;
  ranking: number;
  suffix: string | null;
  equipoId: string | null;
  perms: Set<string>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export type Op = 'insert' | 'update' | 'delete';

/** Filtro Prisma que nunca coincide (OR vacío = falso). */
export const DENY: any = { OR: [] };

const TTL_MS = 30_000;
const ADMIN_ROLES = new Set(['super_admin', 'admin']);

/** Tablas con columna directa hacia el bot. */
const BOT_COL: Record<string, string> = {
  bots: 'id',
  chats: 'bot_id',
  messages: 'bot_id',
  media_files: 'bot_id',
  contacts: 'bot_id',
  tags: 'bot_id',
  bot_stats: 'bot_id',
  webhook_events: 'bot_id',
  conversation_evaluations: 'bot_id',
  performance_analyses: 'bot_id',
};

/** Tablas que llegan al bot a través de una relación to-one. */
const VIA_RELATION: Record<string, (ids: string[]) => any> = {
  conversation_metrics: (ids) => ({ chats: { is: { bot_id: { in: ids } } } }),
  contact_notes: (ids) => ({ contacts: { is: { bot_id: { in: ids } } } }),
  contact_tags: (ids) => ({ contacts: { is: { bot_id: { in: ids } } } }),
};

/** Hijos de vuelos: heredan el alcance del vuelo padre. */
const VUELO_CHILDREN = new Set(['vuelos_adjuntos', 'vuelos_ediciones', 'vuelos_pasajeros', 'anulables', 'deudas_proveedores']);

/**
 * Permisos requeridos para escribir. Lista vacía = solo admin/super_admin.
 * Tablas ausentes = escritura libre para usuarios autenticados (comportamiento previo).
 */
const WRITE_PERMS: Record<string, Record<Op, string[]>> = {
  roles: { insert: ['roles.create'], update: ['roles.edit'], delete: ['roles.delete'] },
  permissions: { insert: ['permissions.create'], update: ['permissions.edit'], delete: ['permissions.delete'] },
  role_permissions: { insert: ['permissions.assign', 'roles.edit'], update: ['permissions.assign', 'roles.edit'], delete: ['permissions.assign', 'roles.edit'] },
  user_permissions: { insert: ['users.manage_permissions', 'permissions.assign'], update: ['users.manage_permissions', 'permissions.assign'], delete: ['users.manage_permissions', 'permissions.assign'] },
  equipos: { insert: ['equipos.create'], update: ['equipos.edit', 'equipos.assign'], delete: ['equipos.delete'] },
  team_members: { insert: ['equipos.assign', 'equipos.edit'], update: ['equipos.assign', 'equipos.edit'], delete: ['equipos.assign', 'equipos.edit'] },
  tasas_conversion: { insert: ['tasas.create', 'tasas.manage'], update: ['tasas.edit', 'tasas.manage'], delete: ['tasas.delete', 'tasas.manage'] },
  tasas_historial: { insert: ['tasas.create', 'tasas.edit', 'tasas.manage'], update: [], delete: [] },
  monedas: { insert: ['monedas.create', 'monedas.manage'], update: ['monedas.edit', 'monedas.manage'], delete: ['monedas.delete', 'monedas.manage'] },
  agencias: { insert: ['agencias.create', 'agencias.manage'], update: ['agencias.edit', 'agencias.manage'], delete: ['agencias.delete', 'agencias.manage'] },
  usuario_agencias: { insert: ['agencias.assign', 'agencias.manage'], update: ['agencias.assign', 'agencias.manage'], delete: ['agencias.assign', 'agencias.manage'] },
  sedes: { insert: ['sedes.create', 'sedes.manage'], update: ['sedes.edit', 'sedes.manage'], delete: ['sedes.delete', 'sedes.manage'] },
  cotizaciones: { insert: ['cotizaciones.create'], update: ['cotizaciones.edit'], delete: ['cotizaciones.delete'] },
  vuelos: {
    insert: ['vuelos.create'],
    update: ['vuelos.edit', 'vuelos.edit_all', 'vuelos.edit_team', 'vuelos.edit_own', 'vuelos.emit', 'vuelos.confirm_payment', 'vuelos.mark_issued'],
    delete: ['vuelos.delete'],
  },
  bots: { insert: [], update: [], delete: [] },
  workers: { insert: [], update: [], delete: [] },
  sales_analysis_config: { insert: [], update: [], delete: [] },
};

/** Campos de profiles que un usuario no puede cambiarse a sí mismo sin users.edit. */
const PROFILE_PROTECTED = ['role_id', 'sede_id', 'equipo_id', 'bot_session_suffix', 'email', 'is_active', 'id'];

/** Campos de `users` que se pueden embeber (nunca password_hash). */
const USERS_SAFE_FIELDS = ['id', 'email', 'full_name', 'created_at'];

/** Tablas cuyo cambio afecta al contexto RBAC → invalidar caché. */
const RBAC_TABLES = new Set(['profiles', 'roles', 'role_permissions', 'user_permissions', 'bots', 'equipos']);

interface RelField { type: string; isList: boolean }

@Injectable()
export class RbacService {
  private readonly logger = new Logger('RBAC');
  private ctxCache = new Map<string, { v: UserCtx; exp: number }>();
  private botsCache: { v: { id: string; session_name: string | null }[]; exp: number } | null = null;
  private teamCache = new Map<string, { v: string[]; exp: number }>();
  private relMap: Map<string, Map<string, RelField>>;

  constructor(private readonly prisma: PrismaService) {
    this.relMap = new Map();
    for (const m of Prisma.dmmf.datamodel.models) {
      const fields = new Map<string, RelField>();
      for (const f of m.fields) {
        if (f.kind === 'object') fields.set(f.name, { type: f.type as string, isList: f.isList });
      }
      this.relMap.set(m.name, fields);
    }
  }

  /* ------------------------------ contexto ------------------------------ */

  invalidate() {
    this.ctxCache.clear();
    this.teamCache.clear();
    this.botsCache = null;
  }

  touch(table: string) {
    if (RBAC_TABLES.has(table)) this.invalidate();
  }

  async getCtx(userId: string): Promise<UserCtx> {
    const hit = this.ctxCache.get(userId);
    if (hit && hit.exp > Date.now()) return hit.v;

    const p = await this.prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role_id: true, equipo_id: true, bot_session_suffix: true, is_active: true,
        roles: { select: { name: true, ranking: true } },
      },
    });

    const perms = new Set<string>();
    if (p?.role_id) {
      const rp = await this.prisma.role_permissions.findMany({
        where: { role_id: p.role_id },
        select: { permissions: { select: { name: true } } },
      });
      rp.forEach((r) => perms.add(r.permissions.name));
    }
    if (p) {
      const up = await this.prisma.user_permissions.findMany({
        where: { user_id: userId },
        select: { granted: true, permissions: { select: { name: true } } },
      });
      for (const u of up) {
        if (u.granted === false) perms.delete(u.permissions.name);
        else perms.add(u.permissions.name);
      }
    }

    // Perfil desactivado = sin rol (no ve nada, no escribe nada).
    const active = p && p.is_active !== false;
    const role = active ? (p?.roles?.name ?? null) : null;
    const ctx: UserCtx = {
      id: userId,
      email: p?.email ?? null,
      role,
      ranking: active ? (p?.roles?.ranking ?? 0) : 0,
      suffix: p?.bot_session_suffix?.trim() || null,
      equipoId: p?.equipo_id ?? null,
      perms: active ? perms : new Set(),
      isAdmin: !!role && ADMIN_ROLES.has(role),
      isSuperAdmin: role === 'super_admin',
    };
    this.ctxCache.set(userId, { v: ctx, exp: Date.now() + TTL_MS });
    return ctx;
  }

  hasPerm(ctx: UserCtx, names: string[]): boolean {
    if (ctx.isAdmin) return true;
    return names.some((n) => ctx.perms.has(n));
  }

  /* --------------------------- alcance de bots --------------------------- */

  private async allBots() {
    if (this.botsCache && this.botsCache.exp > Date.now()) return this.botsCache.v;
    const v = await this.prisma.bots.findMany({ select: { id: true, session_name: true } });
    this.botsCache = { v, exp: Date.now() + TTL_MS };
    return v;
  }

  /** null = sin restricción; array = ids de bots visibles. */
  async visibleBotIds(ctx: UserCtx): Promise<string[] | null> {
    if (ctx.isAdmin) return null;
    if (!ctx.role) return [];
    const isOther = (s: string) => s.endsWith('_other');
    const bots = (await this.allBots()).filter((b) => !!b.session_name);
    const sess = (b: { session_name: string | null }) => String(b.session_name).toLowerCase();

    if (ctx.role === 'supervisor') return bots.filter((b) => isOther(sess(b))).map((b) => b.id);
    if (ctx.suffix) {
      const suf = ctx.suffix.toLowerCase();
      return bots.filter((b) => sess(b).endsWith(suf)).map((b) => b.id);
    }
    return bots.filter((b) => !isOther(sess(b))).map((b) => b.id);
  }

  /** ids de perfiles del equipo del usuario (su equipo + equipos que gerencia). */
  private async teamIds(ctx: UserCtx): Promise<string[]> {
    const hit = this.teamCache.get(ctx.id);
    if (hit && hit.exp > Date.now()) return hit.v;
    const led = await this.prisma.equipos.findMany({ where: { gerente_id: ctx.id }, select: { id: true } });
    const equipos = [...led.map((e) => e.id), ...(ctx.equipoId ? [ctx.equipoId] : [])];
    const members = equipos.length
      ? await this.prisma.profiles.findMany({ where: { equipo_id: { in: equipos } }, select: { id: true } })
      : [];
    const v = Array.from(new Set([ctx.id, ...members.map((m) => m.id)]));
    this.teamCache.set(ctx.id, { v, exp: Date.now() + TTL_MS });
    return v;
  }

  /* ------------------------------ lectura ------------------------------ */

  /** Filtro de alcance de vuelos para LECTURA (null = todos). */
  private async vuelosReadWhere(ctx: UserCtx): Promise<any> {
    if (this.hasPerm(ctx, ['vuelos.view_all'])) return null;
    if (ctx.perms.has('vuelos.view_team')) return { created_by: { in: await this.teamIds(ctx) } };
    if (ctx.perms.has('vuelos.view')) return { created_by: ctx.id };
    return DENY;
  }

  /**
   * Filtro Prisma que se AND-ea a toda lectura de `table`.
   * null = sin restricción.
   */
  async readWhere(ctx: UserCtx, table: string): Promise<any> {
    if (ctx.isAdmin) return null;

    if (table in BOT_COL || table in VIA_RELATION) {
      const ids = await this.visibleBotIds(ctx);
      if (ids === null) return null;
      return table in BOT_COL ? { [BOT_COL[table]]: { in: ids } } : VIA_RELATION[table](ids);
    }
    switch (table) {
      case 'notificaciones':
        return { user_id: ctx.id };
      case 'user_permissions':
        return this.hasPerm(ctx, ['users.manage_permissions', 'permissions.assign', 'permissions.view'])
          ? null
          : { user_id: ctx.id };
      case 'vuelos':
        return this.vuelosReadWhere(ctx);
    }
    if (VUELO_CHILDREN.has(table)) {
      const w = await this.vuelosReadWhere(ctx);
      return w === null ? null : w === DENY ? DENY : { vuelos: { is: w } };
    }
    if (!ctx.role) return DENY;
    return null;
  }

  /* ------------------------------ escritura ------------------------------ */

  /**
   * Verifica el permiso de escritura y devuelve el filtro extra que se AND-ea al
   * where de update/delete (null = sin restricción adicional).
   */
  async writeWhere(ctx: UserCtx, table: string, op: Op, values?: any): Promise<any> {
    if (ctx.isAdmin) {
      if (table === 'profiles' && !ctx.isSuperAdmin && op !== 'insert') {
        // admin no toca perfiles de rango igual o superior (salvo el propio)
        await this.assertRoleAssignable(ctx, values);
        return { OR: [{ id: ctx.id }, { role_id: null }, { roles: { is: { ranking: { lt: ctx.ranking } } } }] };
      }
      if (table === 'profiles' && op === 'insert') await this.assertRoleAssignable(ctx, values);
      return null;
    }
    if (!ctx.role) throw new ForbiddenException('Usuario sin rol: escritura no permitida');

    if (table === 'profiles') return this.profilesWriteWhere(ctx, op, values);

    const req = WRITE_PERMS[table]?.[op];
    if (req && !this.hasPerm(ctx, req)) {
      throw new ForbiddenException(`Sin permiso para ${op} en ${table}`);
    }

    // vuelos: el alcance de edición depende del permiso más amplio que tenga.
    if (table === 'vuelos' && op === 'update') {
      if (this.hasPerm(ctx, ['vuelos.edit_all', 'vuelos.edit', 'vuelos.emit', 'vuelos.confirm_payment', 'vuelos.mark_issued'])) return null;
      if (ctx.perms.has('vuelos.edit_team')) return { created_by: { in: await this.teamIds(ctx) } };
      return { created_by: ctx.id }; // edit_own
    }
    if (table === 'vuelos' && op === 'delete') return null;

    if (table === 'notificaciones' && op !== 'insert') return { user_id: ctx.id };

    // Tablas ligadas a bots: solo se escribe dentro del propio alcance.
    if (table in BOT_COL || table in VIA_RELATION) return this.readWhere(ctx, table);
    if (VUELO_CHILDREN.has(table)) return this.readWhere(ctx, table);
    return null;
  }

  private async profilesWriteWhere(ctx: UserCtx, op: Op, values?: any): Promise<any> {
    if (op === 'insert') {
      if (!this.hasPerm(ctx, ['users.create', 'usuarios.create'])) throw new ForbiddenException('Sin permiso para crear perfiles');
      await this.assertRoleAssignable(ctx, values);
      return null;
    }
    if (op === 'delete') {
      if (!this.hasPerm(ctx, ['users.delete', 'usuarios.delete'])) throw new ForbiddenException('Sin permiso para borrar perfiles');
      return { roles: { is: { ranking: { lt: ctx.ranking } } } };
    }
    // update
    if (this.hasPerm(ctx, ['users.edit', 'usuarios.edit'])) {
      await this.assertRoleAssignable(ctx, values);
      return { OR: [{ id: ctx.id }, { role_id: null }, { roles: { is: { ranking: { lt: ctx.ranking } } } }] };
    }
    const touched = Object.keys(values || {}).filter((k) => PROFILE_PROTECTED.includes(k));
    if (touched.length) throw new ForbiddenException(`No puedes modificar: ${touched.join(', ')}`);
    return { id: ctx.id };
  }

  /** Un no-super_admin solo asigna roles de ranking inferior al suyo (canManageRole). */
  private async assertRoleAssignable(ctx: UserCtx, values: any) {
    if (ctx.isSuperAdmin) return;
    const rows = Array.isArray(values) ? values : values ? [values] : [];
    for (const v of rows) {
      if (!v?.role_id) continue;
      const r = await this.prisma.roles.findUnique({ where: { id: v.role_id }, select: { ranking: true } });
      if (!r || (r.ranking ?? 0) >= ctx.ranking) {
        throw new ForbiddenException('No puedes asignar un rol de rango igual o superior al tuyo');
      }
    }
  }

  /** Para insert/upsert en tablas con alcance: cada fila debe caer dentro de él. */
  async assertRowsInScope(ctx: UserCtx, table: string, values: any) {
    if (ctx.isAdmin) return;
    const rows = Array.isArray(values) ? values : [values];
    if (table in BOT_COL && table !== 'bots') {
      const ids = await this.visibleBotIds(ctx);
      if (ids === null) return;
      for (const r of rows) {
        if (r?.bot_id && !ids.includes(r.bot_id)) throw new ForbiddenException('Bot fuera de tu alcance');
      }
    }
    if (table === 'contact_notes' || table === 'contact_tags') {
      const ids = await this.visibleBotIds(ctx);
      if (ids === null) return;
      const contactIds = rows.map((r) => r?.contact_id).filter(Boolean);
      if (contactIds.length) {
        const ok = await this.prisma.contacts.count({ where: { id: { in: contactIds }, bot_id: { in: ids } } });
        if (ok !== new Set(contactIds).size) throw new ForbiddenException('Contacto fuera de tu alcance');
      }
    }
    if (table === 'notificaciones') return; // se permite notificar a otros usuarios
  }

  /* ----------------------- embeds (relaciones) ----------------------- */

  /**
   * Recorre el árbol select/include de Prisma y aplica el alcance a cada relación:
   *  - relaciones lista hacia tablas con alcance → `where` adicional
   *  - `_count` de relaciones con alcance → cuenta solo lo visible
   *  - relación hacia `users` → solo campos seguros (nunca password_hash)
   */
  async scopeTree(ctx: UserCtx, model: string, tree: any): Promise<any> {
    if (!tree || typeof tree !== 'object') return tree;
    const fields = this.relMap.get(model) || new Map<string, RelField>();
    const out: any = {};
    for (const [key, val] of Object.entries<any>(tree)) {
      if (key === '_count') {
        out._count = await this.scopeCount(ctx, fields, val);
        continue;
      }
      const f = fields.get(key);
      if (!f) { out[key] = val; continue; }

      let node: any = val === true ? {} : { ...val };
      if (f.type === 'users') {
        node = this.safeUsersNode(node);
      } else {
        if (node.select) node.select = await this.scopeTree(ctx, f.type, node.select);
        if (node.include) node.include = await this.scopeTree(ctx, f.type, node.include);
      }
      if (f.isList) {
        const w = await this.readWhere(ctx, f.type);
        if (w) node.where = node.where ? { AND: [node.where, w] } : w;
      }
      out[key] = Object.keys(node).length ? node : true;
    }
    return out;
  }

  private async scopeCount(ctx: UserCtx, fields: Map<string, RelField>, val: any) {
    if (!val?.select) return val;
    const sel: any = {};
    for (const [rel, v] of Object.entries<any>(val.select)) {
      const f = fields.get(rel);
      const w = f ? await this.readWhere(ctx, f.type) : null;
      sel[rel] = w ? { where: v?.where ? { AND: [v.where, w] } : w } : v;
    }
    return { select: sel };
  }

  private safeUsersNode(node: any) {
    const select: any = {};
    const requested = node.select ? Object.keys(node.select) : USERS_SAFE_FIELDS;
    for (const k of requested) if (USERS_SAFE_FIELDS.includes(k)) select[k] = true;
    if (!Object.keys(select).length) select.id = true;
    return { select };
  }

  /** Para `users` como tabla raíz no aplica (no está en ALLOWED_TABLES). */

  /* ----------------------------- realtime ----------------------------- */

  /** ¿Puede este usuario ver esta fila (payload de un cambio realtime)? */
  async rowVisible(ctx: UserCtx, table: string, row: any): Promise<boolean> {
    if (ctx.isAdmin) return true;
    if (!ctx.role || !row) return false;
    if (table in BOT_COL) {
      const ids = await this.visibleBotIds(ctx);
      const v = row[BOT_COL[table]];
      return ids === null || (!!v && ids.includes(v));
    }
    if (table === 'notificaciones') return row.user_id === ctx.id;
    if (table === 'vuelos') {
      const w = await this.vuelosReadWhere(ctx);
      if (w === null) return true;
      if (w === DENY) return false;
      if (typeof w.created_by === 'string') return row.created_by === w.created_by;
      return (w.created_by?.in || []).includes(row.created_by);
    }
    if (table in VIA_RELATION || VUELO_CHILDREN.has(table)) return false; // sin datos para validar
    return true;
  }
}

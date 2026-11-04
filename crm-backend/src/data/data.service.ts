import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryBody,
  buildWhere,
  buildOrderBy,
  buildTakeSkip,
  parseSelect,
  parsedToPrisma,
  aliasMap,
  applyAliases,
} from './query.util';

/**
 * Tablas expuestas por el gateway genérico de datos.
 * Excluye `users` (contiene password_hash) y tablas de auditoría internas.
 * El frontend consume `profiles`, nunca `users`.
 */
export const ALLOWED_TABLES = new Set<string>([
  'agencias',
  'anulables',
  'auditoria_cambios_estado',
  'bookings',
  'bot_stats',
  'bots',
  'chats',
  'contact_notes',
  'contact_tags',
  'contacts',
  'conversation_evaluations',
  'conversation_metrics',
  'cotizaciones',
  'cotizaciones_historial',
  'cotizaciones_pasajeros',
  'daily_sales_reports',
  'deudas_proveedores',
  'equipos',
  'media_files',
  'messages',
  'monedas',
  'notificaciones',
  'pagos_deudas',
  'performance_analyses',
  'performance_improvements',
  'performance_reports',
  'permissions',
  'poc_customer_threads',
  'poc_thread_chat_history',
  'poc_thread_chats',
  'poc_thread_events',
  'poc_thread_metrics',
  'poc_thread_status',
  'profiles',
  'role_permissions',
  'roles',
  'sales_analysis_config',
  'sales_analysis_logs',
  'sedes',
  'tags',
  'tasas_conversion',
  'tasas_historial',
  'team_members',
  'user_permissions',
  'usuario_agencias',
  'vuelos',
  'vuelos_adjuntos',
  'vuelos_ediciones',
  'vuelos_pasajeros',
  'webhook_events',
  'workers',
]);

export interface InsertBody {
  values: any | any[];
  select?: string;
  single?: boolean;
}
export interface UpdateBody {
  values: any;
  filters?: QueryBody['filters'];
  or?: QueryBody['or'];
  select?: string;
  single?: boolean;
}
export interface DeleteBody {
  filters?: QueryBody['filters'];
  or?: QueryBody['or'];
  select?: string;
}
export interface UpsertBody {
  values: any;
  onConflict: string; // columna(s) únicas separadas por coma
  select?: string;
}

@Injectable()
export class DataService {
  private readonly logger = new Logger('Data');
  constructor(private readonly prisma: PrismaService) {}

  private model(table: string): any {
    if (!ALLOWED_TABLES.has(table)) {
      throw new NotFoundException(`Tabla no permitida o inexistente: ${table}`);
    }
    const delegate = (this.prisma as any)[table];
    if (!delegate) {
      throw new NotFoundException(`Modelo Prisma no encontrado: ${table}`);
    }
    return delegate;
  }

  private selectArgs(select?: string) {
    const parsed = parseSelect(select);
    const prismaSel = parsedToPrisma(parsed);
    const amap = aliasMap(parsed);
    return { prismaSel, amap };
  }

  private shape(rows: any[], amap: Record<string, string>) {
    if (Object.keys(amap).length === 0) return rows;
    return rows.map((r) => applyAliases(r, amap));
  }

  async query(table: string, body: QueryBody) {
    const model = this.model(table);
    const where = buildWhere(body);
    const orderBy = buildOrderBy(body);
    const { take, skip } = buildTakeSkip(body);
    const { prismaSel, amap } = this.selectArgs(body.select);

    const args: any = {};
    if (Object.keys(where).length) args.where = where;
    if (orderBy) args.orderBy = orderBy;
    if (take !== undefined) args.take = take;
    if (skip !== undefined) args.skip = skip;
    if (prismaSel?.select) args.select = prismaSel.select;
    if (prismaSel?.include) args.include = prismaSel.include;

    let rows = await model.findMany(args);
    rows = this.shape(rows, amap);

    let count: number | undefined;
    if (body.count === 'exact') {
      count = await model.count(where && Object.keys(where).length ? { where } : {});
    }

    if (body.single) {
      if (rows.length !== 1) {
        throw new BadRequestException(
          `single(): se esperaba 1 fila, se obtuvieron ${rows.length}`,
        );
      }
      return { data: rows[0], count: count ?? null };
    }
    if (body.maybeSingle) {
      return { data: rows[0] ?? null, count: count ?? null };
    }
    return { data: rows, count: count ?? null };
  }

  async insert(table: string, body: InsertBody) {
    const model = this.model(table);
    const { prismaSel, amap } = this.selectArgs(body.select);
    const selectForReturn = prismaSel?.select
      ? { select: prismaSel.select }
      : prismaSel?.include
        ? { include: prismaSel.include }
        : {};

    const arr = Array.isArray(body.values) ? body.values : [body.values];
    const created = await this.prisma.$transaction(
      arr.map((v) => model.create({ data: v, ...selectForReturn })),
    );
    const shaped = this.shape(created, amap);

    if (body.single || !Array.isArray(body.values)) {
      return { data: shaped[0] ?? null };
    }
    return { data: shaped };
  }

  async update(table: string, body: UpdateBody) {
    const model = this.model(table);
    const where = buildWhere({ filters: body.filters, or: body.or });
    if (!Object.keys(where).length) {
      throw new BadRequestException(
        'update() requiere al menos un filtro para evitar updates masivos accidentales',
      );
    }
    await model.updateMany({ where, data: body.values });

    // devolver las filas afectadas (comportamiento de supabase .update().select())
    const { prismaSel, amap } = this.selectArgs(body.select);
    const args: any = { where };
    if (prismaSel?.select) args.select = prismaSel.select;
    if (prismaSel?.include) args.include = prismaSel.include;
    let rows = await model.findMany(args);
    rows = this.shape(rows, amap);

    if (body.single) return { data: rows[0] ?? null };
    return { data: rows };
  }

  async remove(table: string, body: DeleteBody) {
    const model = this.model(table);
    const where = buildWhere({ filters: body.filters, or: body.or });
    if (!Object.keys(where).length) {
      throw new BadRequestException(
        'delete() requiere al menos un filtro para evitar borrados masivos accidentales',
      );
    }
    // capturar filas antes de borrar si se pide select
    let rows: any[] = [];
    if (body.select) {
      const { prismaSel, amap } = this.selectArgs(body.select);
      const args: any = { where };
      if (prismaSel?.select) args.select = prismaSel.select;
      if (prismaSel?.include) args.include = prismaSel.include;
      rows = this.shape(await model.findMany(args), amap);
    }
    const res = await model.deleteMany({ where });
    return { data: rows, count: res.count };
  }

  /**
   * Ejecuta una función Postgres (equivalente a supabase.rpc). Si la función no
   * existe en la BD, devuelve [] (degradación limpia) en vez de fallar — algunas
   * funciones RPC del sistema anterior se perdieron con Supabase.
   */
  async rpc(fn: string, args: Record<string, any> = {}) {
    if (!/^[a-zA-Z0-9_]+$/.test(fn)) {
      throw new BadRequestException('Nombre de función inválido');
    }
    const exists: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 1 FROM pg_proc WHERE proname = $1 LIMIT 1`,
      fn,
    );
    if (!exists || exists.length === 0) {
      this.logger.warn(`rpc('${fn}') no existe en la BD; devolviendo []`);
      return { data: [], error: null };
    }
    const keys = Object.keys(args || {});
    const params = keys.map((_, i) => `$${i + 1}`);
    const named = keys.map((k, i) => `${k} => ${params[i]}`).join(', ');
    const values = keys.map((k) => (args as any)[k]);
    const sql = `SELECT to_jsonb(t) AS row FROM "${fn}"(${named}) t`;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...values);
    return { data: rows.map((r) => r.row), error: null };
  }

  async upsert(table: string, body: UpsertBody) {
    const model = this.model(table);
    const conflictCols = body.onConflict.split(',').map((c) => c.trim());
    // construir el where único a partir de las columnas de conflicto
    const whereUnique: Record<string, any> = {};
    for (const c of conflictCols) whereUnique[c] = body.values[c];

    const { prismaSel, amap } = this.selectArgs(body.select);
    const selectForReturn = prismaSel?.select
      ? { select: prismaSel.select }
      : prismaSel?.include
        ? { include: prismaSel.include }
        : {};

    // Prisma exige que el where sea una clave única. Para conflicto compuesto,
    // usamos la clave compuesta nombrada por Prisma (col1_col2). Si es una sola
    // columna única, el nombre coincide con la columna.
    const whereArg =
      conflictCols.length === 1
        ? { [conflictCols[0]]: body.values[conflictCols[0]] }
        : { [conflictCols.join('_')]: whereUnique };

    const row = await model.upsert({
      where: whereArg,
      update: body.values,
      create: body.values,
      ...selectForReturn,
    });
    return { data: applyAliases(row, amap) };
  }
}

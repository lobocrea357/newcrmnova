import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { sanitizeDeep } from '../common/sanitize';
import {
  AuthUser,
  DataService,
  InsertBody,
  UpdateBody,
  DeleteBody,
  UpsertBody,
} from './data.service';
import { QueryBody } from './query.util';

/**
 * Gateway genérico de datos — reemplaza las ~198 consultas PostgREST del dashboard.
 * Todas las rutas requieren JWT válido.
 *
 *   POST   /api/data/:table/query    → findMany / single / count
 *   POST   /api/data/:table/insert   → create
 *   PATCH  /api/data/:table          → updateMany (+ devuelve filas)
 *   DELETE /api/data/:table          → deleteMany
 *   POST   /api/data/:table/upsert   → upsert
 */
@Controller('data')
@UseGuards(JwtAuthGuard)
export class DataController {
  constructor(private readonly data: DataService) {}

  @Post('rpc/:fn')
  @HttpCode(200)
  rpc(@Param('fn') fn: string, @Body() body: Record<string, any>, @CurrentUser() user: AuthUser) {
    return this.data.rpc(fn, sanitizeDeep(body || {}), user);
  }

  @Post(':table/query')
  @HttpCode(200)
  query(@Param('table') table: string, @Body() body: QueryBody, @CurrentUser() user: AuthUser) {
    return this.data.query(table, sanitizeDeep(body || {}), user);
  }

  @Post(':table/insert')
  @HttpCode(201)
  insert(@Param('table') table: string, @Body() body: InsertBody, @CurrentUser() user: AuthUser) {
    return this.data.insert(table, sanitizeDeep(body), user);
  }

  @Post(':table/upsert')
  @HttpCode(200)
  upsert(@Param('table') table: string, @Body() body: UpsertBody, @CurrentUser() user: AuthUser) {
    return this.data.upsert(table, sanitizeDeep(body), user);
  }

  @Patch(':table')
  @HttpCode(200)
  update(@Param('table') table: string, @Body() body: UpdateBody, @CurrentUser() user: AuthUser) {
    return this.data.update(table, sanitizeDeep(body), user);
  }

  @Delete(':table')
  @HttpCode(200)
  remove(@Param('table') table: string, @Body() body: DeleteBody, @CurrentUser() user: AuthUser) {
    return this.data.remove(table, sanitizeDeep(body || {}), user);
  }
}

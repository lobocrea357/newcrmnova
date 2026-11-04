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
import {
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

  @Post(':table/query')
  @HttpCode(200)
  query(@Param('table') table: string, @Body() body: QueryBody) {
    return this.data.query(table, body || {});
  }

  @Post(':table/insert')
  @HttpCode(201)
  insert(@Param('table') table: string, @Body() body: InsertBody) {
    return this.data.insert(table, body);
  }

  @Post(':table/upsert')
  @HttpCode(200)
  upsert(@Param('table') table: string, @Body() body: UpsertBody) {
    return this.data.upsert(table, body);
  }

  @Patch(':table')
  @HttpCode(200)
  update(@Param('table') table: string, @Body() body: UpdateBody) {
    return this.data.update(table, body);
  }

  @Delete(':table')
  @HttpCode(200)
  remove(@Param('table') table: string, @Body() body: DeleteBody) {
    return this.data.remove(table, body || {});
  }
}

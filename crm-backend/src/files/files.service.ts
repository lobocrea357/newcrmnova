import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import * as path from 'path';

/**
 * Almacenamiento de archivos en disco (volumen Docker), reemplaza Supabase Storage.
 * Estructura: <STORAGE_ROOT>/<bucket>/<ruta...>
 *
 * Config (env):
 *   STORAGE_ROOT               raíz en disco (default /data/storage)
 *   STORAGE_RETENTION_DAYS     días de retención global (default 14)
 *   STORAGE_EXEMPT_BUCKETS     buckets sin expiración, separados por coma (default "avatars")
 *   STORAGE_RETENTION_<BUCKET> override por bucket (mayúsculas, guiones→_). 0 = sin expiración.
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger('Files');
  readonly root = process.env.STORAGE_ROOT || '/data/storage';
  readonly defaultDays = Number(process.env.STORAGE_RETENTION_DAYS || 14);
  readonly exempt = new Set(
    (process.env.STORAGE_EXEMPT_BUCKETS || 'avatars')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  /** Valida bucket y ruta, devuelve la ruta absoluta segura (anti path traversal). */
  private resolveSafe(bucket: string, relPath: string): string {
    if (!/^[a-zA-Z0-9._-]+$/.test(bucket)) {
      throw new BadRequestException('Nombre de bucket inválido');
    }
    const clean = (relPath || '').replace(/^\/+/, '');
    const bucketDir = path.join(this.root, bucket);
    const abs = path.join(bucketDir, clean);
    const normalized = path.normalize(abs);
    if (!normalized.startsWith(bucketDir + path.sep) && normalized !== bucketDir) {
      throw new BadRequestException('Ruta inválida');
    }
    return normalized;
  }

  async save(bucket: string, relPath: string, buffer: Buffer): Promise<{ path: string; size: number }> {
    if (!relPath) throw new BadRequestException('Falta la ruta del archivo (path)');
    const abs = this.resolveSafe(bucket, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    return { path: relPath.replace(/^\/+/, ''), size: buffer.length };
  }

  /** Devuelve stream + metadatos para servir el archivo, o null si no existe. */
  async openForServe(bucket: string, relPath: string) {
    const abs = this.resolveSafe(bucket, relPath);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isFile()) return null;
      return { stream: createReadStream(abs), size: stat.size, filename: path.basename(abs) };
    } catch {
      return null;
    }
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    for (const p of paths || []) {
      try {
        const abs = this.resolveSafe(bucket, p);
        await fs.unlink(abs);
      } catch {
        /* ignora archivos ausentes */
      }
    }
  }

  /** Retención (días) efectiva de un bucket. 0 o negativo = sin expiración. */
  retentionDaysFor(bucket: string): number {
    if (this.exempt.has(bucket)) return 0;
    const key = `STORAGE_RETENTION_${bucket.toUpperCase().replace(/-/g, '_')}`;
    const override = process.env[key];
    if (override !== undefined) return Number(override);
    return this.defaultDays;
  }

  /** Borra archivos vencidos en todos los buckets no exentos. Devuelve nº borrados. */
  async purgeExpired(): Promise<number> {
    let deleted = 0;
    let buckets: string[] = [];
    try {
      const entries = await fs.readdir(this.root, { withFileTypes: true });
      buckets = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return 0; // raíz aún no existe
    }

    const now = Date.now();
    for (const bucket of buckets) {
      const days = this.retentionDaysFor(bucket);
      if (!days || days <= 0) continue; // exento / sin expiración
      const maxAgeMs = days * 24 * 60 * 60 * 1000;
      const bucketDir = path.join(this.root, bucket);
      deleted += await this.purgeDir(bucketDir, now, maxAgeMs);
    }
    if (deleted) this.logger.log(`Retención: ${deleted} archivo(s) vencido(s) borrado(s)`);
    return deleted;
  }

  /** Recorre recursivamente borrando archivos vencidos y directorios vacíos. */
  private async purgeDir(dir: string, now: number, maxAgeMs: number): Promise<number> {
    let deleted = 0;
    let entries: any[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return 0;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        deleted += await this.purgeDir(full, now, maxAgeMs);
        try {
          const rest = await fs.readdir(full);
          if (rest.length === 0) await fs.rmdir(full);
        } catch {
          /* ignore */
        }
      } else if (e.isFile()) {
        try {
          const stat = await fs.stat(full);
          if (now - stat.mtimeMs > maxAgeMs) {
            await fs.unlink(full);
            deleted++;
          }
        } catch {
          /* ignore */
        }
      }
    }
    return deleted;
  }
}

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { FilesService } from './files.service';

/**
 * Ejecuta la limpieza de archivos vencidos: una vez al arrancar y luego cada
 * 24 h. La retención por bucket la decide FilesService (avatars exento por defecto).
 */
@Injectable()
export class RetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Retention');
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = 24 * 60 * 60 * 1000;

  constructor(private readonly files: FilesService) {}

  async onModuleInit() {
    this.logger.log(
      `Retención activa: ${this.files.defaultDays} días (exentos: ${[...this.files.exempt].join(', ') || 'ninguno'})`,
    );
    // primera pasada diferida para no bloquear el arranque
    setTimeout(() => this.run(), 15000);
    this.timer = setInterval(() => this.run(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async run() {
    try {
      await this.files.purgeExpired();
    } catch (err: any) {
      this.logger.error(`Error en limpieza de retención: ${err.message}`);
    }
  }
}

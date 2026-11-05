import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Client } from 'pg';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeChange } from './filter.util';

/**
 * Mantiene una conexión Postgres dedicada en modo LISTEN sobre el canal
 * 'crm_realtime' (poblado por los triggers). Reenvía cada notificación al
 * RealtimeGateway. Reintenta la conexión si se cae.
 */
@Injectable()
export class PgListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PgListener');
  private client: Client | null = null;
  private stopped = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private readonly gateway: RealtimeGateway) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      await this.client?.end();
    } catch {
      /* ignore */
    }
  }

  private async connect() {
    if (this.stopped) return;
    try {
      this.client = new Client({ connectionString: process.env.DATABASE_URL });
      this.client.on('notification', (msg) => this.handle(msg.payload));
      this.client.on('error', (err) => {
        this.logger.error(`Error de conexión LISTEN: ${err.message}`);
        this.scheduleReconnect();
      });
      await this.client.connect();
      await this.client.query('LISTEN crm_realtime');
      this.logger.log('Escuchando canal crm_realtime');
    } catch (err: any) {
      this.logger.error(`No se pudo conectar para LISTEN: ${err.message}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.client?.end();
      } catch {
        /* ignore */
      }
      await this.connect();
    }, 3000);
  }

  private handle(raw?: string) {
    if (!raw) return;
    try {
      const change = JSON.parse(raw) as RealtimeChange;
      this.gateway
        .broadcastChange(change)
        .catch((e) => this.logger.error(`broadcast falló: ${e?.message}`));
    } catch (err: any) {
      this.logger.warn(`Payload NOTIFY inválido: ${err.message}`);
    }
  }
}

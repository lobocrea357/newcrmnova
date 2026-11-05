import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RealtimeChange, filterMatches, eventMatches } from './filter.util';
import { RbacService } from '../rbac/rbac.service';

interface Subscription {
  subId: string;
  table: string;
  event?: string;
  filter?: string;
}

/**
 * Gateway WebSocket que reemplaza Supabase Realtime.
 *
 * Protocolo (namespace /realtime):
 *   cliente → 'subscribe'   { subId, table, event?, filter? }
 *   cliente → 'unsubscribe' { subId }
 *   servidor → 'change'     { subId, payload: { eventType, new, old, table } }
 *   servidor → 'subscribed' { subId }   (ack)
 *
 * El JWT se pasa en el handshake: io(url, { auth: { token } }).
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('Realtime');

  /** socketId → (subId → Subscription) */
  private subs = new Map<string, Map<string, Subscription>>();
  /** socketId → userId (del JWT del handshake) */
  private owners = new Map<string, string>();

  constructor(
    private readonly jwt: JwtService,
    private readonly rbac: RbacService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      const payload = this.jwt.verify(token);
      (client.data as any).userId = payload.sub;
      this.owners.set(client.id, payload.sub);
      this.subs.set(client.id, new Map());
    } catch {
      this.logger.warn(`Conexión rechazada (JWT inválido): ${client.id}`);
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.subs.delete(client.id);
    this.owners.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: Subscription,
  ) {
    const map = this.subs.get(client.id);
    if (!map || !body?.subId || !body?.table) return { ok: false };
    map.set(body.subId, {
      subId: body.subId,
      table: body.table,
      event: body.event,
      filter: body.filter,
    });
    client.emit('subscribed', { subId: body.subId });
    return { ok: true, subId: body.subId };
  }

  @SubscribeMessage('unsubscribe')
  onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { subId: string },
  ) {
    this.subs.get(client.id)?.delete(body?.subId);
    return { ok: true };
  }

  /**
   * Llamado por PgListenerService con cada cambio recibido de Postgres.
   * Además del filtro pedido por el cliente, aplica el alcance RBAC del usuario
   * del socket: un asesor solo recibe eventos de sus bots, sus notificaciones, etc.
   */
  async broadcastChange(change: RealtimeChange) {
    const row = (change as any).new ?? (change as any).old;
    for (const [socketId, map] of this.subs) {
      const matching = [...map.values()].filter(
        (sub) =>
          sub.table === change.table &&
          eventMatches(sub.event, change.eventType) &&
          filterMatches(sub.filter, change),
      );
      if (!matching.length) continue;

      const userId = this.owners.get(socketId);
      if (!userId) continue;
      try {
        const ctx = await this.rbac.getCtx(userId);
        if (!(await this.rbac.rowVisible(ctx, change.table, row))) continue;
      } catch (e) {
        this.logger.warn(`RBAC realtime falló para ${socketId}: ${(e as Error).message}`);
        continue;
      }
      for (const sub of matching) {
        this.server.to(socketId).emit('change', { subId: sub.subId, payload: change });
      }
    }
  }
}

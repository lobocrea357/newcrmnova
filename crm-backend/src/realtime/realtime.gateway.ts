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

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      const payload = this.jwt.verify(token);
      (client.data as any).userId = payload.sub;
      this.subs.set(client.id, new Map());
    } catch {
      this.logger.warn(`Conexión rechazada (JWT inválido): ${client.id}`);
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.subs.delete(client.id);
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

  /** Llamado por PgListenerService con cada cambio recibido de Postgres. */
  broadcastChange(change: RealtimeChange) {
    for (const [socketId, map] of this.subs) {
      for (const sub of map.values()) {
        if (sub.table !== change.table) continue;
        if (!eventMatches(sub.event, change.eventType)) continue;
        if (!filterMatches(sub.filter, change)) continue;
        this.server.to(socketId).emit('change', { subId: sub.subId, payload: change });
      }
    }
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { PgListenerService } from './pg-listener.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me',
    }),
  ],
  providers: [RealtimeGateway, PgListenerService],
})
export class RealtimeModule {}

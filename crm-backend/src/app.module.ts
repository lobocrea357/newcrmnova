import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DataModule } from './data/data.module';
import { RealtimeModule } from './realtime/realtime.module';
import { FilesModule } from './files/files.module';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { ok: true, service: 'crm-api', ts: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DataModule,
    RealtimeModule,
    FilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

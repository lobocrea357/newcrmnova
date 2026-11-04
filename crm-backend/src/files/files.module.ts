import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { RetentionService } from './retention.service';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || 'change-me' }),
  ],
  controllers: [FilesController],
  providers: [FilesService, RetentionService],
})
export class FilesModule {}

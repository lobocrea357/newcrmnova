import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

// Columnas BIGINT (p. ej. media_files.file_size) llegan de Prisma como BigInt, que
// JSON.stringify no sabe serializar. Número si cabe sin perder precisión, si no texto.
(BigInt.prototype as any).toJSON = function () {
  return this <= BigInt(Number.MAX_SAFE_INTEGER) && this >= BigInt(Number.MIN_SAFE_INTEGER)
    ? Number(this)
    : this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`CRM API (NestJS) escuchando en :${port}`);
}
bootstrap();

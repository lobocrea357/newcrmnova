import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Convierte errores de Prisma en respuestas HTTP legibles en vez de 500 opacos.
 * - Validación (columna/arg desconocido) → 400
 * - P2025 (no encontrado) → 404
 * - P2002 (unique) → 409
 * - P2003 (FK) → 400
 */
@Catch(
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientKnownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Prisma');

  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error de base de datos';

    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message.split('\n').filter(Boolean).pop() || 'Consulta inválida';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Registro no encontrado';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Valor duplicado (${(exception.meta?.target as string[])?.join(', ') ?? 'único'})`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Violación de clave foránea';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Error Prisma ${exception.code}`;
      }
    }

    this.logger.warn(`${status} ${message}`);
    res.status(status).json({ statusCode: status, message, error: 'PrismaError' });
  }
}

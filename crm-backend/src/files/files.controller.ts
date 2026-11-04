import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  private publicUrl(req: Request, bucket: string, p: string): string {
    const base =
      process.env.STORAGE_PUBLIC_BASE ||
      `${req.protocol}://${req.get('host')}/api`;
    return `${base}/files/${bucket}/${p}`;
  }

  /** Subida: multipart/form-data con campo `file` y campo `path`. */
  @Post(':bucket')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async upload(
    @Param('bucket') bucket: string,
    @Body('path') relPath: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file")');
    const saved = await this.files.save(bucket, relPath, file.buffer);
    return {
      data: {
        path: saved.path,
        size: saved.size,
        publicUrl: this.publicUrl(req, bucket, saved.path),
      },
      error: null,
    };
  }

  /** Servir archivo (público). */
  @Get(':bucket/*')
  async serve(
    @Param('bucket') bucket: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const relPath = (req.params as any)[0] as string;
    const opened = await this.files.openForServe(bucket, relPath);
    if (!opened) throw new NotFoundException('Archivo no encontrado');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    opened.stream.pipe(res);
  }

  /** Borrado (requiere JWT): body { paths: string[] }. */
  @Delete(':bucket')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('bucket') bucket: string,
    @Body('paths') paths: string[],
  ) {
    await this.files.remove(bucket, Array.isArray(paths) ? paths : [paths].filter(Boolean));
    return { data: null, error: null };
  }
}

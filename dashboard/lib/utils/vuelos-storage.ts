import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'vuelos-adjuntos';

export function getStoragePath(vuelo_id: string, tipo_adjunto: 'COMPROBANTE_PAGO' | 'PASAPORTE', filename: string): string {
  const folder = tipo_adjunto === 'COMPROBANTE_PAGO' ? 'comprobantes' : 'pasaportes';
  return `${folder}/${vuelo_id}/${filename}`;
}

export async function uploadAdjunto(
  supabase: ReturnType<typeof createClient>,
  vuelo_id: string,
  tipo_adjunto: 'COMPROBANTE_PAGO' | 'PASAPORTE',
  file: File
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedFilename}`;
  const path = getStoragePath(vuelo_id, tipo_adjunto, filename);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path: path,
  };
}

export async function deleteAdjunto(
  supabase: ReturnType<typeof createClient>,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

export async function getAdjuntoUrl(
  supabase: ReturnType<typeof createClient>,
  path: string
): Promise<string> {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export const ALLOWED_FILE_TYPES = {
  COMPROBANTE_PAGO: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  PASAPORTE: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
};

export const MAX_FILE_SIZE_MB = 10;

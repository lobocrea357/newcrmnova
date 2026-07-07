import { supabase } from '../config/supabase.js';

/**
 * Subir comprobante de pago
 */
export async function subirComprobantePago(file, deudaId, userId) {
  try {
    // LOGGING DIAGNÓSTICO (comentado)
    // console.log('🔍 [STORAGE storageService] Archivo recibido para subir:', {
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   size: file.size
    // });

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/pjpeg'];
    // console.log('🔍 [STORAGE storageService] Tipos permitidos:', allowedTypes);
    // console.log('🔍 [STORAGE storageService] Tipo está en lista permitida:', allowedTypes.includes(file.mimetype));

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Tipo de archivo no permitido. Solo PDF, PNG, JPG.');
    }

    // Validar tamaño (max 10MB según configuración del bucket)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 10MB.');
    }

    // Generar nombre único
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${deudaId}/${Date.now()}.${fileExt}`;

    // console.log('🔍 [STORAGE storageService] Intentando subir a Supabase:', {
    //   bucket: 'comprobantes-deudas',
    //   fileName,
    //   fileExt,
    //   contentType: file.mimetype,
    //   hasBuffer: !!file.buffer,
    //   bufferSize: file.buffer?.length
    // });

    // Subir archivo con contentType explícito (usar file.buffer de multer memoryStorage)
    const { data, error } = await supabase
      .storage
      .from('comprobantes-deudas')
      .upload(fileName, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype
      });

    // console.log('🔍 [STORAGE storageService] Resultado upload Supabase:', {
    //   success: !error,
    //   data: data ? 'upload exitoso' : null,
    //   error: error ? error.message : null
    // });

    if (error) throw error;

    // Obtener URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('comprobantes-deudas')
      .getPublicUrl(fileName);

    console.log(`✅ Comprobante subido: ${publicUrl}`);
    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    throw error;
  }
}

/**
 * Eliminar comprobante
 */
export async function eliminarComprobante(path) {
  try {
    const { error } = await supabase
      .storage
      .from('comprobantes-deudas')
      .remove([path]);

    if (error) throw error;

    console.log(`✅ Comprobante eliminado: ${path}`);
    return true;
  } catch (error) {
    console.error('Error eliminando comprobante:', error);
    throw error;
  }
}

export default {
  subirComprobantePago,
  eliminarComprobante
};

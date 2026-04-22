import { supabase } from '../config/supabase.js';

/**
 * Subir comprobante de pago
 */
export async function subirComprobantePago(file, deudaId, userId) {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo PDF, PNG, JPG.');
    }

    // Validar tamaño (max 10MB según configuración del bucket)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 10MB.');
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${deudaId}/${Date.now()}.${fileExt}`;

    // Subir archivo
    const { data, error } = await supabase
      .storage
      .from('comprobantes-deudas')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

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

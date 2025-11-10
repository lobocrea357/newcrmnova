import supabase from '../config/supabase.js';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export class MediaService {
  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'whatsapp';
  }

  /**
   * Descarga un archivo desde WAHA
   */
  async downloadFromWaha(mediaUrl, wahaApiKey) {
    try {
      // Reemplazar localhost con el nombre del servicio Docker
      const fixedUrl = mediaUrl.replace('localhost', 'waha').replace('127.0.0.1', 'waha');
      
      console.log(`📥 Descargando desde WAHA: ${fixedUrl}`);
      
      const response = await axios.get(fixedUrl, {
        headers: {
          'X-Api-Key': wahaApiKey
        },
        responseType: 'arraybuffer',
        timeout: 30000, // 30 segundos
        maxContentLength: 50 * 1024 * 1024 // 50MB max
      });

      console.log(`✅ Descargado: ${response.data.length} bytes, tipo: ${response.headers['content-type']}`);

      return {
        buffer: response.data,
        contentType: response.headers['content-type'] || 'application/octet-stream',
        size: response.data.length
      };
    } catch (error) {
      console.error('❌ Error descargando desde WAHA:', error.message);
      throw error;
    }
  }

  /**
   * Sube un archivo al bucket de Supabase
   */
  async uploadToSupabase(buffer, fileName, contentType, folder = 'media') {
    try {
      // Limpiar nombre de archivo
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const filePath = `${folder}/${timestamp}_${cleanFileName}`;

      console.log(`📤 Subiendo a Supabase Storage: ${filePath}`);
      console.log(`   Tamaño: ${buffer.length} bytes`);
      console.log(`   Tipo: ${contentType}`);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Error de Supabase Storage:', error);
        throw error;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log(`✅ Archivo subido exitosamente`);
      console.log(`   URL: ${publicUrlData.publicUrl}`);

      return {
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
        size: buffer.length
      };
    } catch (error) {
      console.error('❌ Error subiendo a Supabase:', error);
      throw error;
    }
  }

  /**
   * Procesa y sube multimedia desde WAHA a Supabase
   */
  async processAndUploadMedia(mediaUrl, fileName, messageType, wahaApiKey) {
    try {
      console.log(`\n🎬 ========== PROCESANDO MULTIMEDIA ==========`);
      console.log(`URL: ${mediaUrl}`);
      console.log(`Tipo: ${messageType}`);
      console.log(`Archivo: ${fileName}`);

      // PASO 1: Descargar desde WAHA
      const { buffer, contentType, size } = await this.downloadFromWaha(mediaUrl, wahaApiKey);

      // PASO 2: Determinar carpeta según tipo
      let folder = 'media';
      let extension = '';
      
      if (messageType === 'image' || contentType.startsWith('image/')) {
        folder = 'images';
        extension = contentType.split('/')[1] || 'jpg';
      } else if (messageType === 'video' || contentType.startsWith('video/')) {
        folder = 'videos';
        extension = contentType.split('/')[1] || 'mp4';
      } else if (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice' || contentType.startsWith('audio/')) {
        folder = 'audios';
        extension = contentType.split('/')[1] || 'ogg';
      } else if (messageType === 'document' || contentType.includes('application/')) {
        folder = 'documents';
        extension = contentType.split('/')[1] || 'pdf';
      }

      // Agregar extensión si no la tiene
      if (!fileName.includes('.')) {
        fileName = `${fileName}.${extension}`;
      }

      console.log(`📁 Carpeta destino: ${folder}`);

      // PASO 3: Subir a Supabase
      const uploadResult = await this.uploadToSupabase(buffer, fileName, contentType, folder);

      console.log(`✅ ========== MULTIMEDIA PROCESADA ==========\n`);

      return {
        ...uploadResult,
        originalUrl: mediaUrl,
        contentType,
        size,
        folder
      };
    } catch (error) {
      console.error('❌ Error procesando multimedia:', error);
      throw error;
    }
  }

  /**
   * Guarda información del archivo en la base de datos
   */
  async saveMediaFile(botId, messageId, mediaData) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .insert([
          {
            bot_id: botId,
            message_id: messageId,
            file_url: mediaData.publicUrl,
            file_name: mediaData.path.split('/').pop(),
            mimetype: mediaData.contentType,
            file_size: mediaData.size,
            metadata: {
              original_url: mediaData.originalUrl,
              folder: mediaData.folder,
              uploaded_at: new Date().toISOString()
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error guardando media file:', error);
      throw error;
    }
  }

  /**
   * Obtiene archivos multimedia de un mensaje
   */
  async getMediaByMessage(messageId) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo media files:', error);
      throw error;
    }
  }

  /**
   * Obtiene archivos multimedia de un bot
   */
  async getMediaByBot(botId, type = null, limit = 50) {
    try {
      let query = supabase
        .from('media_files')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.ilike('mimetype', `${type}/%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo media files del bot:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo del storage y la base de datos
   */
  async deleteMedia(mediaId) {
    try {
      // Obtener información del archivo
      const { data: mediaFile, error: fetchError } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) throw fetchError;

      // Extraer path del URL
      const urlParts = mediaFile.file_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (storageError) console.error('Error eliminando del storage:', storageError);

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('Error eliminando media:', error);
      throw error;
    }
  }
}

export default new MediaService();

import OpenAI from 'openai';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import supabase from '../config/supabase.js';

export class TranscriptionService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('⚠️  OpenAI API Key no configurada. La transcripción de audio no funcionará.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Descarga un archivo de audio desde una URL
   */
  async downloadAudio(audioUrl, wahaApiKey) {
    try {
      const response = await axios.get(audioUrl, {
        headers: {
          'X-Api-Key': wahaApiKey
        },
        responseType: 'arraybuffer'
      });

      return {
        buffer: Buffer.from(response.data),
        contentType: response.headers['content-type']
      };
    } catch (error) {
      console.error('Error descargando audio:', error);
      throw error;
    }
  }

  /**
   * Convierte buffer a stream (requerido por OpenAI)
   */
  bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  /**
   * Transcribe un audio usando OpenAI Whisper
   */
  async transcribeAudio(audioBuffer, language = 'es') {
    try {
      if (!this.openai) {
        throw new Error('OpenAI API Key no configurada');
      }

      // Crear stream desde el buffer
      const audioStream = this.bufferToStream(audioBuffer);
      
      // Crear FormData con el audio
      const formData = new FormData();
      formData.append('file', audioStream, {
        filename: 'audio.ogg',
        contentType: 'audio/ogg'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', 'json');

      // Llamar a la API de OpenAI usando axios directamente
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openai.apiKey}`,
            ...formData.getHeaders()
          }
        }
      );

      return {
        text: response.data.text,
        language: language,
        duration: response.data.duration || null
      };
    } catch (error) {
      console.error('Error transcribiendo audio:', error);
      throw error;
    }
  }

  /**
   * Procesa un audio: descarga, transcribe y guarda
   */
  async processAudioMessage(audioUrl, messageId, botId, wahaApiKey) {
    try {
      console.log(`🎤 Procesando audio para mensaje: ${messageId}`);

      // Descargar audio
      const { buffer } = await this.downloadAudio(audioUrl, wahaApiKey);

      // Transcribir
      const transcription = await this.transcribeAudio(buffer);

      console.log(`✅ Audio transcrito: "${transcription.text.substring(0, 50)}..."`);

      // Actualizar mensaje con la transcripción
      await this.saveTranscription(messageId, transcription);

      return transcription;
    } catch (error) {
      console.error('Error procesando audio:', error);
      
      // Si falla, guardar el error en metadata
      await this.saveTranscriptionError(messageId, error.message);
      
      throw error;
    }
  }

  /**
   * Guarda la transcripción en el mensaje
   */
  async saveTranscription(messageId, transcription) {
    try {
      // Obtener mensaje actual
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Actualizar metadata con la transcripción
      const metadata = message.metadata || {};
      metadata.transcription = transcription.text; // Guardar solo el texto
      metadata.transcription_language = transcription.language;
      metadata.transcription_duration = transcription.duration;
      metadata.transcribed_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          metadata,
          // También guardar en el campo content si está vacío
          content: message.content || `[Audio] ${transcription.text}`
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

      console.log(`💾 Transcripción guardada en BD`);

      return transcription;
    } catch (error) {
      console.error('Error guardando transcripción:', error);
      throw error;
    }
  }

  /**
   * Guarda error de transcripción
   */
  async saveTranscriptionError(messageId, errorMessage) {
    try {
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', messageId)
        .single();

      if (fetchError) return;

      const metadata = message.metadata || {};
      metadata.transcription_error = {
        error: errorMessage,
        attempted_at: new Date().toISOString()
      };

      await supabase
        .from('messages')
        .update({ metadata })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error guardando error de transcripción:', error);
    }
  }

  /**
   * Obtiene transcripciones de un bot
   */
  async getTranscriptions(botId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, message_id, content, metadata, timestamp, from_number')
        .eq('bot_id', botId)
        .not('metadata->transcription', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(msg => ({
        id: msg.id,
        message_id: msg.message_id,
        from_number: msg.from_number,
        timestamp: msg.timestamp,
        transcription: msg.metadata.transcription,
        content: msg.content
      }));
    } catch (error) {
      console.error('Error obteniendo transcripciones:', error);
      throw error;
    }
  }
}

export default new TranscriptionService();

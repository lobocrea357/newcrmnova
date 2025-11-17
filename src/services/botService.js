import supabase from '../config/supabase.js';
import wahaClient from '../config/waha.js';

export class BotService {
  /**
   * Obtiene o crea un bot en la base de datos
   */
  async getOrCreateBot(sessionName, phoneNumber = null) {
    try {
      // Buscar bot existente (sin .single() para evitar error si no existe)
      const { data: existingBots, error: searchError } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName);

      if (searchError) throw searchError;

      // Si existe, retornar el primero
      if (existingBots && existingBots.length > 0) {
        console.log(`🔍 Bot existente encontrado: ${sessionName}`);
        return existingBots[0];
      }

      // Crear nuevo bot
      console.log(`➕ Creando nuevo bot: ${sessionName}`);
      const { data: newBot, error: createError } = await supabase
        .from('bots')
        .insert([
          {
            session_name: sessionName,
            phone_number: phoneNumber || 'pending',
            status: 'disconnected',
            engine: 'NOWEB',
            name: sessionName
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      console.log(`✅ Bot creado exitosamente: ${sessionName} (ID: ${newBot.id})`);
      return newBot;
    } catch (error) {
      console.error('Error en getOrCreateBot:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un bot
   */
  async updateBotStatus(sessionName, status, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('bots')
        .update({
          status,
          last_seen: new Date().toISOString(),
          metadata
        })
        .eq('session_name', sessionName)
        .select();

      if (error) throw error;
      
      // Verificar si se actualizó algún registro
      if (!data || data.length === 0) {
        console.warn(`⚠️ No se encontró bot para actualizar: ${sessionName}`);
        return null;
      }

      console.log(`📝 Estado actualizado: ${sessionName} -> ${status}`);
      return data[0];
    } catch (error) {
      console.error('Error en updateBotStatus:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los bots
   */
  async getAllBots() {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getAllBots:', error);
      throw error;
    }
  }

  /**
   * Sincroniza el estado de los bots con WAHA
   */
  async syncBotsWithWaha() {
    try {
      const response = await wahaClient.get('/api/sessions?all=true');
      const wahaSessions = response.data;

      for (const session of wahaSessions) {
        const phoneNumber = session.me?.id?.split('@')[0] || session.me?.user || 'pending';
        await this.getOrCreateBot(session.name, phoneNumber);
        await this.updateBotStatus(session.name, session.status, {
          engine: session.engine,
          me: session.me
        });
      }

      return wahaSessions;
    } catch (error) {
      console.error('Error en syncBotsWithWaha:', error);
      throw error;
    }
  }
}

export default new BotService();

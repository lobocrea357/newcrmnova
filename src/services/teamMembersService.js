import { supabase } from '../config/supabase.js';

class TeamMembersService {
  /**
   * Obtiene todos los team members activos
   * @returns {Promise<Array>}
   */
  async getAll() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene solo los números de teléfono (para filtrado rápido)
   * @returns {Promise<Array<string>>}
   */
  async getPhoneNumbers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('phone_number');

    if (error) throw error;
    return (data || []).map(tm => tm.phone_number);
  }

  /**
   * Verifica si un teléfono está en la lista de team members
   * @param {string} phoneNumber - Número de teléfono a verificar
   * @returns {Promise<boolean>}
   */
  async isTeamMember(phoneNumber) {
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) {
      console.error('[TeamMembers] Error verificando teléfono:', error);
      return false; // En caso de error, no bloquear el flujo
    }

    return data !== null;
  }

  /**
   * Crea un nuevo team member
   * @param {Object} data - { phone_number, full_name }
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Validaciones
    if (!data.phone_number || !data.full_name) {
      throw new Error('phone_number y full_name son requeridos');
    }

    // Verificar que no exista
    const exists = await this.isTeamMember(data.phone_number);
    if (exists) {
      throw new Error('Este número de teléfono ya está registrado como team member');
    }

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        phone_number: data.phone_number,
        full_name: data.full_name
      })
      .select()
      .single();

    if (error) throw error;
    return teamMember;
  }

  /**
   * Actualiza el nombre de un team member
   * @param {string} id - UUID del team member
   * @param {Object} data - { full_name }
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    if (!data.full_name) {
      throw new Error('full_name es requerido');
    }

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update({
        full_name: data.full_name
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return teamMember;
  }

  /**
   * Elimina un team member permanentemente
   * @param {string} id - UUID del team member
   * @returns {Promise<void>}
   */
  async delete(id) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export default new TeamMembersService();

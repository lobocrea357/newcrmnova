import { supabase } from '../config/supabase.js'

async function validarPermisosEdicionVuelo(vueloId, userId, userRole) {
  try {
    const { data: vuelo, error } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', vueloId)
      .single()
    
    if (error || !vuelo) {
      throw new Error('Vuelo no encontrado')
    }
    
    if (vuelo.estado === 'EMITIDO' && userRole !== 'super_admin') {
      throw new Error('Solo super admin puede editar vuelos emitidos')
    }
    
    if (userRole === 'super_admin') {
      return { 
        permitido: true, 
        sinLimite: true,
        vuelo 
      }
    }
    
    if (userRole === 'admin') {
      return { 
        permitido: true, 
        sinLimite: true,
        vuelo 
      }
    }
    
    if (userRole === 'gerente') {
      const { data: equipos } = await supabase
        .from('equipos')
        .select('id')
        .eq('gerente_id', userId)
        .eq('is_active', true)
      
      const equipoIds = (equipos || []).map(e => e.id)
      
      const { data: creador } = await supabase
        .from('profiles')
        .select('equipo_id')
        .eq('id', vuelo.created_by)
        .single()
      
      if (creador && equipoIds.includes(creador.equipo_id)) {
        return { 
          permitido: true, 
          sinLimite: true,
          vuelo 
        }
      }
    }
    
    if (vuelo.created_by === userId) {
      const edicionesDisponibles = vuelo.ediciones_disponibles ?? 3
      if (edicionesDisponibles <= 0) {
        throw new Error('Has agotado tus ediciones para este vuelo')
      }
      return { 
        permitido: true, 
        sinLimite: false,
        vuelo 
      }
    }
    
    throw new Error('No tienes permisos para editar este vuelo')
    
  } catch (error) {
    console.error('Error validando permisos de edición:', error)
    throw error
  }
}

async function guardarHistorialEdicion(vueloId, userId, razonEdicion, vueloAnterior) {
  try {
    const { error } = await supabase
      .from('vuelos_historial')
      .insert({
        vuelo_id: vueloId,
        usuario_id: userId,
        razon_edicion: razonEdicion,
        datos_anteriores: vueloAnterior,
        fecha_edicion: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error guardando historial de edición:', error)
    }
    
  } catch (error) {
    console.error('Error en guardado de historial:', error)
  }
}

export default {
  validarPermisosEdicionVuelo,
  guardarHistorialEdicion
}

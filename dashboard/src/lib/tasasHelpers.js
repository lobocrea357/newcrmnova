import { supabase } from './supabase'
import { TASAS_API } from '../config/apiConfig'

/**
 * Obtener todas las monedas activas
 */
export async function obtenerMonedas() {
  const { data, error } = await supabase
    .from('monedas')
    .select('*')
    .eq('activa', true)
    .order('codigo')
  
  if (error) throw error
  return data || []
}

/**
 * Obtener todas las tasas de conversión
 */
export async function obtenerTasasConversion() {
  const { data, error } = await supabase
    .from('tasas_conversion')
    .select(`
      *,
      moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(id, codigo, nombre, simbolo),
      moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(id, codigo, nombre, simbolo)
    `)
    .eq('activa', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Obtener tasa de conversión entre dos monedas
 */
export async function obtenerTasa(codigoOrigen, codigoDestino) {
  if (codigoOrigen === codigoDestino) return 1.0

  // Buscar conversión directa
  const { data: directa, error: error1 } = await supabase
    .from('tasas_conversion')
    .select(`
      tasa,
      moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(codigo),
      moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(codigo)
    `)
    .eq('moneda_origen.codigo', codigoOrigen)
    .eq('moneda_destino.codigo', codigoDestino)
    .eq('activa', true)
    .single()

  if (!error1 && directa) return directa.tasa

  // Buscar conversión inversa
  const { data: inversa, error: error2 } = await supabase
    .from('tasas_conversion')
    .select(`
      tasa,
      moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(codigo),
      moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(codigo)
    `)
    .eq('moneda_origen.codigo', codigoDestino)
    .eq('moneda_destino.codigo', codigoOrigen)
    .eq('activa', true)
    .single()

  if (!error2 && inversa) return 1.0 / inversa.tasa

  throw new Error(`No se encontró tasa de conversión entre ${codigoOrigen} y ${codigoDestino}`)
}

/**
 * Crear nueva conversión (usa backend para historial automático)
 */
export async function crearConversion(origenId, destinoId, tasa, descripcion, userId) {
  try {
    const response = await fetch(TASAS_API.crear, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origenId,
        destinoId,
        tasa: parseFloat(tasa),
        descripcion,
        userId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear conversión')
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('Error en crearConversion:', error)
    throw error
  }
}

/**
 * Actualizar tasa de conversión (usa backend para historial automático)
 */
export async function actualizarTasa(id, tasa, userId) {
  try {
    const response = await fetch(TASAS_API.actualizar, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        tasa: parseFloat(tasa),
        userId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al actualizar tasa')
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('Error en actualizarTasa:', error)
    throw error
  }
}

/**
 * Eliminar conversión (usa backend para historial automático)
 */
export async function eliminarConversion(id, userId) {
  try {
    const response = await fetch(TASAS_API.eliminar(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al eliminar conversión')
    }

  } catch (error) {
    console.error('Error en eliminarConversion:', error)
    throw error
  }
}

/**
 * Obtener historial de cambios (solo admin)
 */
export async function obtenerHistorialTasas() {
  const { data, error } = await supabase
    .from('tasas_historial')
    .select(`
      *,
      moneda_origen:monedas!tasas_historial_moneda_origen_id_fkey(codigo, nombre, simbolo),
      moneda_destino:monedas!tasas_historial_moneda_destino_id_fkey(codigo, nombre, simbolo),
      modificado_por_usuario:profiles(id, full_name, email)
    `)
    .order('fecha_cambio', { ascending: false })
    .limit(100)
  
  if (error) throw error
  return data || []
}

/**
 * Crear nueva moneda
 */
export async function crearMoneda(codigo, nombre, simbolo) {
  const { data, error } = await supabase
    .from('monedas')
    .insert([{
      codigo: codigo.toUpperCase(),
      nombre,
      simbolo,
      activa: true
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

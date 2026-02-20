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
  // Primero obtener tasas
  const { data: tasas, error: errorTasas } = await supabase
    .from('tasas_conversion')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending: false })
  
  if (errorTasas) throw errorTasas

  if (!tasas || tasas.length === 0) return []

  // Obtener información de monedas
  const monedaIds = [...new Set([...tasas.map(t => t.moneda_origen_id), ...tasas.map(t => t.moneda_destino_id)])]
  
  const { data: monedas, error: errorMonedas } = await supabase
    .from('monedas')
    .select('id, codigo, nombre, simbolo')
    .in('id', monedaIds)
    .eq('activa', true)

  if (errorMonedas) throw errorMonedas

  // Combinar datos
  return tasas.map(tasa => ({
    ...tasa,
    moneda_origen: monedas.find(m => m.id === tasa.moneda_origen_id),
    moneda_destino: monedas.find(m => m.id === tasa.moneda_destino_id)
  }))
}

/**
 * Obtener tasa de conversión entre dos monedas
 */
export async function obtenerTasa(codigoOrigen, codigoDestino) {
  if (codigoOrigen === codigoDestino) return 1.0

  console.log(`🔍 Buscando tasa: ${codigoOrigen} → ${codigoDestino}`)

  // Primero obtener IDs de las monedas
  const { data: monedas, error: errorMonedas } = await supabase
    .from('monedas')
    .select('id, codigo')
    .in('codigo', [codigoOrigen, codigoDestino])
    .eq('activa', true)

  if (errorMonedas) {
    console.error('❌ Error obteniendo monedas:', errorMonedas)
    throw errorMonedas
  }

  if (!monedas || monedas.length < 2) {
    throw new Error(`No se encontraron las monedas ${codigoOrigen} o ${codigoDestino}`)
  }

  const monedaOrigen = monedas.find(m => m.codigo === codigoOrigen)
  const monedaDestino = monedas.find(m => m.codigo === codigoDestino)

  if (!monedaOrigen || !monedaDestino) {
    throw new Error(`No se encontraron las monedas requeridas`)
  }

  console.log(`📍 IDs: Origen=${monedaOrigen.id}, Destino=${monedaDestino.id}`)

  // Buscar conversión directa
  const { data: directa, error: error1 } = await supabase
    .from('tasas_conversion')
    .select('tasa')
    .eq('moneda_origen_id', monedaOrigen.id)
    .eq('moneda_destino_id', monedaDestino.id)
    .eq('activa', true)
    .single()

  if (!error1 && directa) {
    console.log(`✅ Tasa directa encontrada: ${directa.tasa}`)
    return directa.tasa
  }

  console.log(`⚠️ No hay tasa directa, buscando inversa...`)

  // Buscar conversión inversa
  const { data: inversa, error: error2 } = await supabase
    .from('tasas_conversion')
    .select('tasa')
    .eq('moneda_origen_id', monedaDestino.id)
    .eq('moneda_destino_id', monedaOrigen.id)
    .eq('activa', true)
    .single()

  if (!error2 && inversa) {
    const tasaInversa = 1.0 / inversa.tasa
    console.log(`✅ Tasa inversa calculada: 1/${inversa.tasa} = ${tasaInversa}`)
    return tasaInversa
  }

  console.log(`❌ No se encontró tasa entre ${codigoOrigen} y ${codigoDestino}`)
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
  // Primero obtener historial
  const { data: historial, error: errorHistorial } = await supabase
    .from('tasas_historial')
    .select('*')
    .order('fecha_cambio', { ascending: false })
    .limit(100)
  
  if (errorHistorial) throw errorHistorial

  if (!historial || historial.length === 0) return []

  // Obtener información de monedas
  const monedaIds = [...new Set([...historial.map(h => h.moneda_origen_id), ...historial.map(h => h.moneda_destino_id)])]
  
  const { data: monedas, error: errorMonedas } = await supabase
    .from('monedas')
    .select('id, codigo, nombre, simbolo')
    .in('id', monedaIds)
    .eq('activa', true)

  if (errorMonedas) throw errorMonedas

  // Obtener información de usuarios
  const userIds = [...new Set(historial.map(h => h.modificado_por).filter(Boolean))]
  
  const { data: usuarios, error: errorUsuarios } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (errorUsuarios) throw errorUsuarios

  // Combinar datos
  return historial.map(item => ({
    ...item,
    moneda_origen: monedas.find(m => m.id === item.moneda_origen_id),
    moneda_destino: monedas.find(m => m.id === item.moneda_destino_id),
    modificado_por_usuario: usuarios.find(u => u.id === item.modificado_por)
  }))
}

/**
 * Crear nueva moneda
 */
export async function crearMoneda(codigo, nombre, simbolo) {
  try {
    const response = await fetch(TASAS_API.crearMoneda, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codigo: codigo.toUpperCase(),
        nombre,
        simbolo
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear moneda')
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('Error en crearMoneda:', error)
    throw error
  }
}

/**
 * Actualizar moneda existente
 */
export async function actualizarMoneda(id, codigo, nombre, simbolo) {
  try {
    const response = await fetch(TASAS_API.actualizarMoneda, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        codigo: codigo.toUpperCase(),
        nombre,
        simbolo
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al actualizar moneda')
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('Error en actualizarMoneda:', error)
    throw error
  }
}

/**
 * Eliminar (desactivar) moneda
 */
export async function eliminarMoneda(id) {
  try {
    const response = await fetch(TASAS_API.eliminarMoneda(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al eliminar moneda')
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('Error en eliminarMoneda:', error)
    throw error
  }
}

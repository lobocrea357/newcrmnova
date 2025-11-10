import supabase from '../config/supabase.js'

/**
 * Sincroniza workers desde WAHA a Supabase
 * Los workers en WAHA se obtienen de la configuración de servidores
 */
async function syncWorkersFromWAHA(workersData) {
  try {
    console.log('🔄 Sincronizando workers desde WAHA:', workersData)

    const results = []

    for (const worker of workersData) {
      // Insertar o actualizar worker
      const { data, error } = await supabase
        .from('workers')
        .upsert({
          name: worker.name,
          email: worker.email || `${worker.name.toLowerCase().replace(/\s+/g, '')}@worker.local`,
          role: worker.role || 'agent',
          status: worker.status || 'active',
          phone_number: worker.phone_number || null,
          avatar_url: worker.avatar_url || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email',
          returning: 'representation'
        })

      if (error) {
        console.error('❌ Error al sincronizar worker:', worker.name, error)
        results.push({ worker: worker.name, success: false, error: error.message })
      } else {
        console.log('✅ Worker sincronizado:', worker.name)
        results.push({ worker: worker.name, success: true, data })
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('❌ Error en syncWorkersFromWAHA:', error)
    throw error
  }
}

/**
 * Asigna un bot a un worker
 */
async function assignBotToWorker(botId, workerEmail) {
  try {
    // Buscar el worker por email
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id')
      .eq('email', workerEmail)
      .single()

    if (workerError || !worker) {
      throw new Error(`Worker no encontrado: ${workerEmail}`)
    }

    // Asignar el bot al worker
    const { data, error } = await supabase
      .from('bots')
      .update({ worker_id: worker.id, updated_at: new Date().toISOString() })
      .eq('id', botId)

    if (error) {
      throw error
    }

    console.log('✅ Bot asignado al worker:', botId, '→', workerEmail)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error al asignar bot a worker:', error)
    throw error
  }
}

/**
 * Asigna un bot a un worker por nombre de sesión
 */
async function assignBotToWorkerBySession(sessionName, workerEmail) {
  try {
    // Buscar el bot por session_name
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id')
      .eq('session_name', sessionName)
      .single()

    if (botError || !bot) {
      throw new Error(`Bot no encontrado: ${sessionName}`)
    }

    return await assignBotToWorker(bot.id, workerEmail)
  } catch (error) {
    console.error('❌ Error al asignar bot a worker por sesión:', error)
    throw error
  }
}

/**
 * Obtiene todos los workers
 */
async function getAllWorkers() {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ Error al obtener workers:', error)
    throw error
  }
}

/**
 * Obtiene un worker por email
 */
async function getWorkerByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ Error al obtener worker:', error)
    throw error
  }
}

export {
  syncWorkersFromWAHA,
  assignBotToWorker,
  assignBotToWorkerBySession,
  getAllWorkers,
  getWorkerByEmail
}

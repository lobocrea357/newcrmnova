import express from 'express'
import * as workerService from '../services/workerService.js'

const router = express.Router()

/**
 * POST /api/workers/sync
 * Sincroniza workers desde WAHA u otro sistema
 * Body: { workers: [{ name, email, role, status, phone_number, avatar_url }] }
 */
router.post('/sync', async (req, res) => {
  try {
    const { workers } = req.body

    if (!workers || !Array.isArray(workers)) {
      return res.status(400).json({
        error: 'Se requiere un array de workers'
      })
    }

    const result = await workerService.syncWorkersFromWAHA(workers)
    
    res.json({
      message: 'Workers sincronizados',
      ...result
    })
  } catch (error) {
    console.error('Error en POST /api/workers/sync:', error)
    res.status(500).json({
      error: 'Error al sincronizar workers',
      details: error.message
    })
  }
})

/**
 * POST /api/workers/assign-bot
 * Asigna un bot a un worker
 * Body: { botId, workerEmail } o { sessionName, workerEmail }
 */
router.post('/assign-bot', async (req, res) => {
  try {
    const { botId, sessionName, workerEmail } = req.body

    if (!workerEmail) {
      return res.status(400).json({
        error: 'Se requiere workerEmail'
      })
    }

    if (!botId && !sessionName) {
      return res.status(400).json({
        error: 'Se requiere botId o sessionName'
      })
    }

    let result
    if (sessionName) {
      result = await workerService.assignBotToWorkerBySession(sessionName, workerEmail)
    } else {
      result = await workerService.assignBotToWorker(botId, workerEmail)
    }

    res.json({
      message: 'Bot asignado al worker exitosamente',
      ...result
    })
  } catch (error) {
    console.error('Error en POST /api/workers/assign-bot:', error)
    res.status(500).json({
      error: 'Error al asignar bot a worker',
      details: error.message
    })
  }
})

/**
 * GET /api/workers
 * Obtiene todos los workers
 */
router.get('/', async (req, res) => {
  try {
    const workers = await workerService.getAllWorkers()
    
    res.json({
      workers,
      total: workers.length
    })
  } catch (error) {
    console.error('Error en GET /api/workers:', error)
    res.status(500).json({
      error: 'Error al obtener workers',
      details: error.message
    })
  }
})

/**
 * GET /api/workers/:email
 * Obtiene un worker por email
 */
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params
    const worker = await workerService.getWorkerByEmail(email)
    
    if (!worker) {
      return res.status(404).json({
        error: 'Worker no encontrado'
      })
    }

    res.json(worker)
  } catch (error) {
    console.error('Error en GET /api/workers/:email:', error)
    res.status(500).json({
      error: 'Error al obtener worker',
      details: error.message
    })
  }
})

export default router

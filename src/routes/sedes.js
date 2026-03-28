import { Router } from 'express';
import {
  getSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede,
  getUsersBySede,
  assignUserToSede,
  removeUserFromSede
} from '../services/sedesService.js';

const router = Router();

// GET /api/sedes - Listar todas las sedes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await getSedes();
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sedes/:id - Obtener sede por ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await getSedeById(req.params.id);
    if (error) return res.status(404).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sedes - Crear nueva sede
router.post('/', async (req, res) => {
  try {
    const { nombre, codigo, direccion, ciudad, pais, telefono } = req.body;
    if (!nombre || !codigo) {
      return res.status(400).json({ success: false, error: 'Nombre y código son requeridos' });
    }
    const { data, error } = await createSede({ nombre, codigo, direccion, ciudad, pais, telefono });
    if (error) return res.status(400).json({ success: false, error });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/sedes/:id - Actualizar sede
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await updateSede(req.params.id, req.body);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/sedes/:id - Eliminar (desactivar) sede
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await deleteSede(req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sedes/:id/users - Obtener usuarios de una sede
router.get('/:id/users', async (req, res) => {
  try {
    const { data, error } = await getUsersBySede(req.params.id);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sedes/:id/users - Asignar usuario a sede
router.post('/:id/users', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId es requerido' });
    }
    const { data, error } = await assignUserToSede(userId, req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/sedes/:id/users/:userId - Remover usuario de sede
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const { data, error } = await removeUserFromSede(req.params.userId);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

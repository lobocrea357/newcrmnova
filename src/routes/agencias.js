import { Router } from 'express';
import {
  getAgencias,
  getAgenciaById,
  createAgencia,
  updateAgencia,
  deleteAgencia,
  getUsersByAgencia,
  getAgenciasByUserId,
  assignUserToAgencia,
  removeUserFromAgencia,
  setPrimaryAgencia,
  getUsuariosDisponiblesParaAgencia
} from '../services/agenciasService.js';

const router = Router();

// GET /api/agencias - Listar todas las agencias
router.get('/', async (req, res) => {
  try {
    const { data, error } = await getAgencias();
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agencias/:id - Obtener agencia por ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await getAgenciaById(req.params.id);
    if (error) return res.status(404).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agencias - Crear nueva agencia
router.post('/', async (req, res) => {
  try {
    const { nombre, codigo, descripcion, logo_url, color_primario } = req.body;
    if (!nombre || !codigo) {
      return res.status(400).json({ success: false, error: 'Nombre y código son requeridos' });
    }
    const { data, error } = await createAgencia({ nombre, codigo, descripcion, logo_url, color_primario });
    if (error) return res.status(400).json({ success: false, error });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/agencias/:id - Actualizar agencia
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await updateAgencia(req.params.id, req.body);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/agencias/:id - Eliminar (desactivar) agencia
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await deleteAgencia(req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agencias/:id/users - Obtener usuarios de una agencia
router.get('/:id/users', async (req, res) => {
  try {
    const { data, error } = await getUsersByAgencia(req.params.id);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agencias/user/:userId - Obtener agencias de un usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await getAgenciasByUserId(req.params.userId);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agencias/:id/users - Asignar usuario a agencia
router.post('/:id/users', async (req, res) => {
  try {
    const { userId, isPrimary } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId es requerido' });
    }
    const createdBy = req.headers['x-user-id'] || null;
    const { data, error } = await assignUserToAgencia(userId, req.params.id, isPrimary, createdBy);
    if (error) return res.status(400).json({ success: false, error });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/agencias/:id/users/:userId - Remover usuario de agencia
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const { data, error } = await removeUserFromAgencia(req.params.userId, req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/agencias/:id/users/:userId/primary - Establecer agencia primaria
router.patch('/:id/users/:userId/primary', async (req, res) => {
  try {
    const { data, error } = await setPrimaryAgencia(req.params.userId, req.params.id);
    if (error) return res.status(400).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agencias/:id/usuarios-disponibles - Usuarios disponibles para asignar
router.get('/:id/usuarios-disponibles', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getUsuariosDisponiblesParaAgencia(id);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

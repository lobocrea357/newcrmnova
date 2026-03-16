import express from 'express';
import {
  getEquipos,
  getUsuariosSinEquipo,
  createEquipo,
  updateEquipo,
  asignarUsuarioAEquipo,
  removerUsuarioDeEquipo,
  deleteEquipo
} from '../services/equiposService.js';

const router = express.Router();

/** GET /api/equipos - Todos los equipos con miembros */
router.get('/', async (req, res) => {
  const { data, error } = await getEquipos();
  if (error) return res.status(500).json({ error });
  res.json({ data });
});

/** GET /api/equipos/sin-equipo - Usuarios sin equipo */
router.get('/sin-equipo', async (req, res) => {
  const { data, error } = await getUsuariosSinEquipo();
  if (error) return res.status(500).json({ error });
  res.json({ data });
});

/** POST /api/equipos - Crear equipo */
router.post('/', async (req, res) => {
  const { nombre, descripcion, color, gerenteId } = req.body;
  if (!nombre || !gerenteId) {
    return res.status(400).json({ error: 'nombre y gerenteId son requeridos' });
  }
  const { data, error } = await createEquipo({ nombre, descripcion, color, gerenteId });
  if (error) return res.status(500).json({ error });
  res.status(201).json({ data });
});

/** PUT /api/equipos/:id - Actualizar equipo */
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, color, gerenteId } = req.body;
  const { data, error } = await updateEquipo(req.params.id, { nombre, descripcion, color, gerenteId });
  if (error) return res.status(500).json({ error });
  res.json({ data });
});

/** PATCH /api/equipos/asignar - Asignar usuario a equipo */
router.patch('/asignar', async (req, res) => {
  const { userId, equipoId } = req.body;
  if (!userId || !equipoId) {
    return res.status(400).json({ error: 'userId y equipoId son requeridos' });
  }
  const { data, error } = await asignarUsuarioAEquipo(userId, equipoId);
  if (error) return res.status(500).json({ error });
  res.json({ data });
});

/** PATCH /api/equipos/remover/:userId - Remover usuario de su equipo */
router.patch('/remover/:userId', async (req, res) => {
  const { data, error } = await removerUsuarioDeEquipo(req.params.userId);
  if (error) return res.status(500).json({ error });
  res.json({ data });
});

/** DELETE /api/equipos/:id - Eliminar equipo */
router.delete('/:id', async (req, res) => {
  const { error } = await deleteEquipo(req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Equipo eliminado correctamente' });
});

export default router;

import express from 'express';
import {
  getEquipos,
  getUsuariosSinEquipo,
  createEquipo,
  updateEquipo,
  asignarUsuarioAEquipo,
  removerUsuarioDeEquipo,
  deleteEquipo,
  canManageTeam,
  getTeamsFilteredByUser
} from '../services/equiposService.js';

const router = express.Router();

/** GET /api/equipos - Todos los equipos con miembros (filtrado por rol) */
router.get('/', async (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  if (!currentUserId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const { data, error } = await getTeamsFilteredByUser(currentUserId);
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
  const currentUserId = req.headers['x-user-id'];
  const { nombre, descripcion, color, gerenteId } = req.body;
  if (!nombre || !gerenteId) {
    return res.status(400).json({ error: 'nombre y gerenteId son requeridos' });
  }

  // Validar que el usuario puede crear equipos (solo super_admin y admin)
  if (currentUserId) {
    const canCreate = await canManageTeam(currentUserId, null);
    if (!canCreate) {
      return res.status(403).json({ 
        error: 'No tienes permisos para crear equipos' 
      });
    }
  }

  const { data, error } = await createEquipo({ nombre, descripcion, color, gerenteId });
  if (error) return res.status(500).json({ error });
  res.status(201).json({ data });
});

/** PUT /api/equipos/:id - Actualizar equipo */
router.put('/:id', async (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  const teamId = req.params.id;
  const { nombre, descripcion, color, gerenteId } = req.body;

  // Validar que el usuario puede gestionar este equipo
  if (currentUserId && teamId) {
    const canManage = await canManageTeam(currentUserId, teamId);
    if (!canManage) {
      return res.status(403).json({ 
        error: 'No puedes editar este equipo' 
      });
    }
  }

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
  const currentUserId = req.headers['x-user-id'];
  const teamId = req.params.id;

  // Validar que el usuario puede gestionar este equipo
  if (currentUserId && teamId) {
    const canManage = await canManageTeam(currentUserId, teamId);
    if (!canManage) {
      return res.status(403).json({ 
        error: 'No puedes eliminar este equipo' 
      });
    }
  }

  const { error } = await deleteEquipo(req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Equipo eliminado correctamente' });
});

export default router;

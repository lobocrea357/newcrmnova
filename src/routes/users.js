import express from 'express';
import * as userService from '../services/userService.js';

const router = express.Router();

/**
 * GET / - Obtener todos los usuarios
 * Query params: userId (opcional, para filtrado jerárquico)
 */
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.query.userId || req.headers['x-user-id'];
    const { data, error } = await userService.getUsers(currentUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en GET /api/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /roles - Obtener todos los roles disponibles
 * Query params: userId (opcional, para filtrado jerárquico)
 */
router.get('/roles', async (req, res) => {
  try {
    const currentUserId = req.query.userId || req.headers['x-user-id'];
    const { data, error } = await userService.getRoles(currentUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en GET /api/users/roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /:id - Obtener un usuario por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await userService.getUserById(id);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en GET /api/users/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST / - Crear un nuevo usuario
 * Body: { email, password, fullName, roleId }
 * Headers: x-user-id (ID del usuario que crea)
 */
router.post('/', async (req, res) => {
  try {
    const { email, password, fullName, roleId } = req.body;
    const createdBy = req.headers['x-user-id'];

    if (!email || !password || !fullName || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: email, password, fullName, roleId'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const { data, error } = await userService.createUser({
      email,
      password,
      fullName,
      roleId
    }, createdBy);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /:id - Actualizar un usuario
 * Body: { email?, password?, fullName?, roleId? }
 * Headers: x-user-id (ID del usuario que actualiza)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, fullName, roleId } = req.body;
    const updatedBy = req.headers['x-user-id'];

    if (!email && !password && !fullName && !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const { data, error } = await userService.updateUser(id, {
      email,
      password,
      fullName,
      roleId
    }, updatedBy);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en PUT /api/users/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /:id/status - Activar/Desactivar un usuario
 * Body: { isActive: boolean }
 * Headers: x-user-id (ID del usuario que cambia el estado)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const changedBy = req.headers['x-user-id'];

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo isActive debe ser un booleano'
      });
    }

    const { data, error } = await userService.toggleUserStatus(id, isActive, changedBy);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error en PATCH /api/users/:id/status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

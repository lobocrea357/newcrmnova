import express from 'express';
import * as roleService from '../services/roleService.js';

const router = express.Router();

/**
 * GET / - Obtener todos los roles
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await roleService.getRoles();

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
    console.error('Error en GET /api/roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /permissions - Obtener todos los permisos disponibles
 */
router.get('/permissions', async (req, res) => {
  try {
    const { data, error } = await roleService.getAvailablePermissions();

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
    console.error('Error en GET /api/roles/permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /:id - Obtener un rol por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await roleService.getRoleById(id);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en GET /api/roles/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /:id/users - Obtener usuarios asignados a un rol
 */
router.get('/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await roleService.getUsersByRole(id);

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
    console.error('Error en GET /api/roles/:id/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST / - Crear un nuevo rol
 * Body: { name, description, permissions, ranking }
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, permissions, ranking } = req.body;
    const currentUserId = req.headers['x-user-id'];

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del rol es requerido'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del rol debe tener al menos 2 caracteres'
      });
    }

    // Validación jerárquica: verificar que puede crear rol con este ranking
    if (currentUserId && ranking !== undefined) {
      const canManage = await roleService.canManageRole(currentUserId, ranking);
      if (!canManage) {
        return res.status(403).json({
          success: false,
          error: 'No puedes crear roles con ranking igual o superior al tuyo'
        });
      }
    }

    const { data, error } = await roleService.createRole({
      name: name.trim(),
      description: description?.trim() || '',
      permissions: permissions || []
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Rol creado exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /:id - Actualizar un rol
 * Body: { name?, description?, permissions? }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    if (!name && !description && permissions === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    if (name && name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del rol debe tener al menos 2 caracteres'
      });
    }

    const { data, error } = await roleService.updateRole(id, {
      name: name?.trim(),
      description: description?.trim(),
      permissions
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en PUT /api/roles/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /:id/permissions - Asignar permisos a un rol
 * Body: { permissions: string[] }
 */
router.patch('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Los permisos deben ser un array'
      });
    }

    const { data, error } = await roleService.assignPermissionsToRole(id, permissions);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data,
      message: 'Permisos asignados exitosamente'
    });
  } catch (error) {
    console.error('Error en PATCH /api/roles/:id/permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /:id - Eliminar un rol
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await roleService.deleteRole(id);

    if (error) {
      return res.status(400).json({
        success: false,
        error
      });
    }

    res.json({
      success: true,
      data,
      message: 'Rol eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en DELETE /api/roles/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

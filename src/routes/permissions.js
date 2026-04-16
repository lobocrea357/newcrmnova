const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/auth');
const permissionsService = require('../services/permisosService.js');

// Apply super admin middleware to all permission routes
router.use(requireSuperAdmin);

// Placeholder routes for permissions management
// These will be implemented in later phases
router.get('/', (req, res) => {
  res.json({ message: 'Permissions endpoint - super admin only' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create permission endpoint - super admin only' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update permission endpoint - super admin only' });
});

router.delete('/:id', async (req, res) => {
  try {
    const permissionId = req.params.id;

    if (!await permissionsService.canDeletePermission(permissionId)) {
      return res.status(403).json({
        error: 'No puedes eliminar permisos esenciales del sistema'
      });
    }

    res.json({
      success: true,
      message: 'Permission deleted'
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      error: 'Error al eliminar permiso'
    });
  }
});

module.exports = router;

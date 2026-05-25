import { Router } from 'express';
import teamMembersService from '../services/teamMembersService.js';

const router = Router();

/**
 * GET /api/team-members
 * Lista todos los team members
 */
router.get('/', async (req, res) => {
  try {
    const teamMembers = await teamMembersService.getAll();
    res.json({
      success: true,
      data: teamMembers,
      meta: { count: teamMembers.length }
    });
  } catch (error) {
    console.error('[TeamMembers API] Error fetching:', error);
    res.status(500).json({
      success: false,
      error: 'FetchError',
      message: 'Error obteniendo team members',
      details: error.message
    });
  }
});

/**
 * POST /api/team-members
 * Crea un nuevo team member
 */
router.post('/', async (req, res) => {
  try {
    const teamMember = await teamMembersService.create(req.body);
    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('[TeamMembers API] Error creating:', error);
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: error.message
    });
  }
});

/**
 * PATCH /api/team-members/:id
 * Actualiza el nombre de un team member
 */
router.patch('/:id', async (req, res) => {
  try {
    const teamMember = await teamMembersService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('[TeamMembers API] Error updating:', error);
    res.status(400).json({
      success: false,
      error: 'UpdateError',
      message: error.message
    });
  }
});

/**
 * DELETE /api/team-members/:id
 * Elimina un team member permanentemente
 */
router.delete('/:id', async (req, res) => {
  try {
    await teamMembersService.delete(req.params.id);
    res.json({
      success: true,
      message: 'Team member eliminado correctamente'
    });
  } catch (error) {
    console.error('[TeamMembers API] Error deleting:', error);
    res.status(400).json({
      success: false,
      error: 'DeleteError',
      message: error.message
    });
  }
});

export default router;

/**
 * projectController.js
 *
 * Handles Project CRUD operations.
 *
 * Assumes:
 *  - authMiddleware has run → req.user.id is the authenticated user's ID
 *  - requireWorkspaceMember or requireProjectAccess has run → req.membership is set
 */

const prisma = require('../lib/prisma');

const ALLOWED_UPDATE_KEYS = ['name', 'description'];

// ─── POST /api/v1/workspaces/:workspaceId/projects ───────────────────────────

async function createProject(req, res) {
  const { workspaceId } = req.params;
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Project name is required.' });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Project name must not exceed 100 characters.' });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ success: false, message: 'Description must be a string.' });
  }

  const formattedDescription =
    typeof description === 'string' ? description.trim() || null : null;

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: formattedDescription,
        workspaceId,
      },
    });

    return res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (err) {
    console.error('[projectController] createProject error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── GET /api/v1/workspaces/:workspaceId/projects ────────────────────────────

async function listWorkspaceProjects(req, res) {
  const { workspaceId } = req.params;

  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (err) {
    console.error('[projectController] listWorkspaceProjects error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── GET /api/v1/projects/:projectId ─────────────────────────────────────────

async function getProject(req, res) {
  // req.project is already verified and populated by requireProjectAccess
  return res.status(200).json({
    success: true,
    data: { project: req.project },
  });
}

// ─── PATCH /api/v1/projects/:projectId ───────────────────────────────────────

async function updateProject(req, res) {
  const { name, description } = req.body;

  if (req.body.workspaceId !== undefined) {
    return res.status(400).json({ success: false, message: 'Cannot change workspace ID.' });
  }

  const bodyKeys = Object.keys(req.body);
  const invalidKeys = bodyKeys.filter((k) => !ALLOWED_UPDATE_KEYS.includes(k));

  if (invalidKeys.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid field(s) in update body: ${invalidKeys.join(', ')}.`,
    });
  }

  if (bodyKeys.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one field must be provided to update.' });
  }

  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project name must be a non-empty string.' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Project name must not exceed 100 characters.' });
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') {
      return res.status(400).json({ success: false, message: 'Description must be a string or null.' });
    }
    updateData.description =
      description === null ? null : description.trim() || null;
  }

  try {
    const updated = await prisma.project.update({
      where: { id: req.project.id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: { project: updated },
    });
  } catch (err) {
    console.error('[projectController] updateProject error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── DELETE /api/v1/projects/:projectId ──────────────────────────────────────

async function deleteProject(req, res) {
  try {
    await prisma.project.delete({
      where: { id: req.project.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    console.error('[projectController] deleteProject error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = {
  createProject,
  listWorkspaceProjects,
  getProject,
  updateProject,
  deleteProject,
};

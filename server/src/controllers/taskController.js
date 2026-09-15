/**
 * taskController.js
 *
 * Handles Task CRUD operations and assignments.
 *
 * Assumes:
 *  - authMiddleware has run → req.user.id is the authenticated user's ID
 *  - requireProjectAccess or requireTaskAccess has run → req.membership, req.project, (and req.task) are set
 */

const prisma = require('../lib/prisma');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ALLOWED_UPDATE_KEYS = ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'];

const SAFE_USER_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
  },
};

// ─── POST /api/v1/projects/:projectId/tasks ──────────────────────────────────

async function createTask(req, res) {
  const { projectId } = req.params;
  const { title, description, priority, dueDate, assigneeId, status } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({ success: false, message: 'Task title must not exceed 200 characters.' });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ success: false, message: 'Description must be a string.' });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}.`,
    });
  }

  let formattedDueDate = null;
  if (dueDate !== undefined && dueDate !== null) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dueDate format.' });
    }
    formattedDueDate = parsedDate;
  }

  if (assigneeId) {
    if (typeof assigneeId !== 'string') {
      return res.status(400).json({ success: false, message: 'Assignee ID must be a string.' });
    }

    // Verify assignee belongs to the same workspace as the project
    const assigneeMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: assigneeId,
          workspaceId: req.project.workspaceId,
        },
      },
    });

    if (!assigneeMembership) {
      return res.status(400).json({
        success: false,
        message: 'Assignee must be a member of the project workspace.',
      });
    }
  }

  const formattedDescription =
    typeof description === 'string' ? description.trim() || null : null;

  try {
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: formattedDescription,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: formattedDueDate,
        projectId,
        creatorId: req.user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
    });

    return res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    console.error('[taskController] createTask error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── GET /api/v1/projects/:projectId/tasks ───────────────────────────────────

async function listProjectTasks(req, res) {
  const { projectId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (err) {
    console.error('[taskController] listProjectTasks error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── GET /api/v1/tasks/:taskId ───────────────────────────────────────────────

async function getTask(req, res) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.task.id },
      include: {
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
    });

    return res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    console.error('[taskController] getTask error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── PATCH /api/v1/tasks/:taskId ─────────────────────────────────────────────

async function updateTask(req, res) {
  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  if (req.body.projectId !== undefined) {
    return res.status(400).json({ success: false, message: 'Cannot change project ID.' });
  }

  if (req.body.creatorId !== undefined) {
    return res.status(400).json({ success: false, message: 'Cannot change creator ID.' });
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

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Task title must be a non-empty string.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Task title must not exceed 200 characters.' });
    }
    updateData.title = title.trim();
  }

  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') {
      return res.status(400).json({ success: false, message: 'Description must be a string or null.' });
    }
    updateData.description =
      description === null ? null : description.trim() || null;
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
      });
    }
    updateData.status = status;
  }

  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}.`,
      });
    }
    updateData.priority = priority;
  }

  if (dueDate !== undefined) {
    if (dueDate === null) {
      updateData.dueDate = null;
    } else {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid dueDate format.' });
      }
      updateData.dueDate = parsedDate;
    }
  }

  if (assigneeId !== undefined) {
    if (assigneeId === null) {
      updateData.assigneeId = null;
    } else {
      if (typeof assigneeId !== 'string') {
        return res.status(400).json({ success: false, message: 'Assignee ID must be a string.' });
      }

      // Verify assignee belongs to the same workspace as the task's project
      const assigneeMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: assigneeId,
            workspaceId: req.project.workspaceId,
          },
        },
      });

      if (!assigneeMembership) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a member of the project workspace.',
        });
      }

      updateData.assigneeId = assigneeId;
    }
  }

  try {
    const updated = await prisma.task.update({
      where: { id: req.task.id },
      data: updateData,
      include: {
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
    });

    return res.status(200).json({
      success: true,
      data: { task: updated },
    });
  } catch (err) {
    console.error('[taskController] updateTask error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── DELETE /api/v1/tasks/:taskId ────────────────────────────────────────────

async function deleteTask(req, res) {
  try {
    await prisma.task.delete({
      where: { id: req.task.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    console.error('[taskController] deleteTask error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = {
  createTask,
  listProjectTasks,
  getTask,
  updateTask,
  deleteTask,
};

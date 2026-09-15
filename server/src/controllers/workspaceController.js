/**
 * workspaceController.js
 *
 * Handles workspace and workspace-member CRUD operations.
 *
 * Assumes:
 *  - authMiddleware has run → req.user.id is the authenticated user's ID
 *  - requireWorkspaceMember has run (where applicable) → req.membership is set
 */

const prisma = require('../lib/prisma');

// Valid roles that can be assigned to members (OWNER is set only at creation).
const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER'];
const ALL_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];

function isUniqueConstraintError(err) {
  return Boolean(err && err.code === 'P2002');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip passwordHash from a User record.
 */
function safeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * Convert a workspace name into a URL-safe slug.
 * e.g. "My Workspace!" → "my-workspace"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric (keep spaces and hyphens)
    .replace(/[\s-]+/g, '-')          // collapse whitespace/hyphens to single hyphen
    .replace(/^-+|-+$/g, '');         // trim leading/trailing hyphens
}

/**
 * Generate a unique slug. If the base slug is taken, appends a numeric suffix.
 * Tries base, base-2, base-3, … up to base-99.
 */
async function generateUniqueSlug(name) {
  const base = slugify(name);
  if (!base) throw new Error('Workspace name produces an empty slug.');

  // Try the bare slug first, then suffixed variants.
  const candidate = base;
  const existing = await prisma.workspace.findUnique({ where: { slug: candidate } });
  if (!existing) return candidate;

  for (let i = 2; i <= 99; i++) {
    const suffixed = `${base}-${i}`;
    const taken = await prisma.workspace.findUnique({ where: { slug: suffixed } });
    if (!taken) return suffixed;
  }

  // Extremely unlikely — append a timestamp fragment as last resort.
  return `${base}-${Date.now()}`;
}

// ─── POST /api/v1/workspaces ──────────────────────────────────────────────────

async function createWorkspace(req, res) {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Workspace name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Workspace name must not exceed 100 characters.' });
  }

  let slug;
  try {
    slug = await generateUniqueSlug(name.trim());
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Atomically create workspace + owner membership.
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: name.trim(), slug },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        },
      });

      return { workspace, membership };
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return res.status(409).json({
        success: false,
        message: 'A workspace with this slug already exists.',
      });
    }
    throw err;
  }

  return res.status(201).json({
    success: true,
    data: {
      workspace: result.workspace,
      membership: result.membership,
    },
  });
}

// ─── GET /api/v1/workspaces ───────────────────────────────────────────────────

async function listWorkspaces(req, res) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.id },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  });

  const data = memberships.map((m) => ({
    workspace: m.workspace,
    role: m.role,
    membershipId: m.id,
    joinedAt: m.createdAt,
  }));

  return res.status(200).json({ success: true, data });
}

// ─── GET /api/v1/workspaces/:workspaceId ─────────────────────────────────────
// requireWorkspaceMember has already verified membership and set req.membership.

async function getWorkspace(req, res) {
  const { workspace, role } = req.membership;

  return res.status(200).json({
    success: true,
    data: { workspace, role },
  });
}

// ─── POST /api/v1/workspaces/:workspaceId/members ────────────────────────────

async function addMember(req, res) {
  const { email, role } = req.body;
  const { workspaceId } = req.params;
  const callerRole = req.membership.role; // OWNER or ADMIN (MEMBER is blocked by route middleware)

  // Validate role input.
  if (!role || !ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`,
    });
  }

  // ADMIN cannot assign OWNER — only OWNER and ADMIN can reach here, but
  // if role is OWNER that must be blocked.
  if (role === 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Cannot assign the OWNER role. There can only be one owner.',
    });
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find the target user.
  const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'No user with that email exists.' });
  }

  // Check for existing membership.
  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUser.id, workspaceId } },
  });
  if (existingMembership) {
    return res.status(409).json({ success: false, message: 'User is already a member of this workspace.' });
  }

  let membership;
  try {
    membership = await prisma.workspaceMember.create({
      data: { userId: targetUser.id, workspaceId, role },
      include: { user: true },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this workspace.',
      });
    }
    throw err;
  }

  return res.status(201).json({
    success: true,
    data: {
      membership: {
        id: membership.id,
        workspaceId: membership.workspaceId,
        role: membership.role,
        user: safeUser(membership.user),
        createdAt: membership.createdAt,
      },
    },
  });
}

// ─── GET /api/v1/workspaces/:workspaceId/members ─────────────────────────────

async function listMembers(req, res) {
  const { workspaceId } = req.params;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const data = members.map((m) => ({
    id: m.id,
    workspaceId: m.workspaceId,
    role: m.role,
    user: safeUser(m.user),
    joinedAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  return res.status(200).json({ success: true, data });
}

// ─── PATCH /api/v1/workspaces/:workspaceId/members/:userId ───────────────────

async function updateMemberRole(req, res) {
  const { workspaceId, userId: targetUserId } = req.params;
  const { role: newRole } = req.body;

  // Only OWNER may change roles (enforced by route middleware too).
  // Validate the new role — only ADMIN/MEMBER are allowed targets.
  if (!newRole || !ASSIGNABLE_ROLES.includes(newRole)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`,
    });
  }

  // Cannot use this endpoint to change your own role (OWNER cannot demote self).
  if (targetUserId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role through this endpoint.',
    });
  }

  // Find the target membership.
  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  if (!targetMembership) {
    return res.status(404).json({ success: false, message: 'Member not found in this workspace.' });
  }

  // Prevent touching the OWNER record via this endpoint.
  if (targetMembership.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Cannot change the role of the workspace owner.',
    });
  }

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role: newRole },
    include: { user: true },
  });

  return res.status(200).json({
    success: true,
    data: {
      membership: {
        id: updated.id,
        workspaceId: updated.workspaceId,
        role: updated.role,
        user: safeUser(updated.user),
        updatedAt: updated.updatedAt,
      },
    },
  });
}

// ─── DELETE /api/v1/workspaces/:workspaceId/members/:userId ──────────────────

async function removeMember(req, res) {
  const { workspaceId, userId: targetUserId } = req.params;
  const callerRole = req.membership.role;

  // Prevent OWNER from removing themselves.
  if (targetUserId === req.user.id && callerRole === 'OWNER') {
    return res.status(400).json({
      success: false,
      message: 'The workspace owner cannot remove themselves.',
    });
  }

  // Find the target membership.
  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  if (!targetMembership) {
    return res.status(404).json({ success: false, message: 'Member not found in this workspace.' });
  }

  // OWNER membership can never be deleted, even if data is inconsistent.
  if (targetMembership.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'The workspace owner cannot be removed.',
    });
  }

  // Role-based removal rules.
  if (callerRole === 'ADMIN') {
    // ADMIN can only remove MEMBERs.
    if (targetMembership.role !== 'MEMBER') {
      return res.status(403).json({
        success: false,
        message: 'ADMINs can only remove MEMBERs.',
      });
    }
  } else if (callerRole === 'MEMBER') {
    // MEMBER cannot remove anyone.
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to remove members.',
    });
  }
  // OWNER can remove ADMIN/MEMBER (OWNER records are guarded above).

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  return res.status(200).json({ success: true, message: 'Member removed successfully.' });
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  listMembers,
  updateMemberRole,
  removeMember,
};

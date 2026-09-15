require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./src/lib/prisma');

async function seedDemo() {
  console.log('Seeding demo accounts and workspace...');

  const passwordHash = await bcrypt.hash('HiveDemo@123', 12);

  // 1. Create or find demo users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@hive.demo' },
    update: { passwordHash },
    create: {
      name: 'Demo Owner',
      email: 'owner@hive.demo',
      passwordHash,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hive.demo' },
    update: { passwordHash },
    create: {
      name: 'Demo Admin',
      email: 'admin@hive.demo',
      passwordHash,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@hive.demo' },
    update: { passwordHash },
    create: {
      name: 'Demo Member',
      email: 'member@hive.demo',
      passwordHash,
    },
  });

  // 2. Create or find demo workspace
  let workspace = await prisma.workspace.findUnique({
    where: { slug: 'hive-demo-workspace' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Hive Demo Workspace',
        slug: 'hive-demo-workspace',
      },
    });
  }

  // 3. Upsert memberships
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: ownerUser.id, workspaceId: workspace.id } },
    update: { role: 'OWNER' },
    create: { userId: ownerUser.id, workspaceId: workspace.id, role: 'OWNER' },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: adminUser.id, workspaceId: workspace.id } },
    update: { role: 'ADMIN' },
    create: { userId: adminUser.id, workspaceId: workspace.id, role: 'ADMIN' },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: memberUser.id, workspaceId: workspace.id } },
    update: { role: 'MEMBER' },
    create: { userId: memberUser.id, workspaceId: workspace.id, role: 'MEMBER' },
  });

  // 4. Create demo project if none exists
  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Website Redesign & Launch',
        description: 'Collaborative project for updating Hive branding, UI components, and launch roadmap.',
        workspaceId: workspace.id,
      },
    });

    // Create sample tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Design Tailwind Color Palette',
          description: 'Establish consistent primary and slate neutral color scales.',
          status: 'DONE',
          priority: 'HIGH',
          projectId: project.id,
          creatorId: ownerUser.id,
          assigneeId: adminUser.id,
        },
        {
          title: 'Build Interactive Kanban Board',
          description: 'Implement 3-column layout with status updates and task details.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          projectId: project.id,
          creatorId: ownerUser.id,
          assigneeId: memberUser.id,
        },
        {
          title: 'Add Role-Based Access Control UI',
          description: 'Gate member management and project deletion controls based on member role.',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: adminUser.id,
          assigneeId: memberUser.id,
        },
      ],
    });
  }

  console.log('Demo seed completed successfully!');
  await prisma.$disconnect();
}

seedDemo().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

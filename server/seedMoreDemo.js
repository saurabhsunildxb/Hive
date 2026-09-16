require('dotenv').config();

const prisma = require('./src/lib/prisma');

const projects = [
  {
    name: 'Mobile App Development',
    description: 'Planning and development of the next Hive mobile experience.',
  },
  {
    name: 'Marketing & Growth',
    description: 'Marketing campaigns, content strategy, and product growth initiatives.',
  },
  {
    name: 'Product Roadmap',
    description: 'Upcoming features, improvements, and long-term product planning.',
  },
  {
    name: 'Engineering Infrastructure',
    description: 'Backend reliability, performance, deployment, and developer tooling.',
  },
];

const taskTemplates = [
  ['Create mobile navigation system', 'IN_PROGRESS', 'HIGH'],
  ['Design onboarding screens', 'DONE', 'MEDIUM'],
  ['Implement push notifications', 'TODO', 'URGENT'],
  ['Build profile settings screen', 'TODO', 'MEDIUM'],
  ['Add dark mode support', 'DONE', 'LOW'],
  ['Test authentication flow', 'DONE', 'HIGH'],
  ['Create API integration layer', 'IN_PROGRESS', 'HIGH'],
  ['Optimize image loading', 'TODO', 'LOW'],

  ['Prepare product launch campaign', 'IN_PROGRESS', 'URGENT'],
  ['Design social media assets', 'DONE', 'MEDIUM'],
  ['Write launch announcement', 'DONE', 'HIGH'],
  ['Create email campaign', 'TODO', 'HIGH'],
  ['Analyze competitor products', 'IN_PROGRESS', 'MEDIUM'],
  ['Plan developer outreach', 'TODO', 'LOW'],
  ['Create product demo video', 'TODO', 'HIGH'],
  ['Track campaign performance', 'IN_PROGRESS', 'MEDIUM'],

  ['Define Q4 feature roadmap', 'DONE', 'URGENT'],
  ['Prioritize customer feedback', 'IN_PROGRESS', 'HIGH'],
  ['Design task filtering system', 'DONE', 'MEDIUM'],
  ['Add calendar integration', 'TODO', 'HIGH'],
  ['Improve workspace permissions', 'IN_PROGRESS', 'HIGH'],
  ['Design analytics dashboard', 'TODO', 'MEDIUM'],
  ['Plan team activity feed', 'TODO', 'LOW'],
  ['Document upcoming releases', 'DONE', 'LOW'],

  ['Optimize database queries', 'IN_PROGRESS', 'URGENT'],
  ['Add API rate limiting', 'TODO', 'HIGH'],
  ['Improve error logging', 'DONE', 'MEDIUM'],
  ['Set up production monitoring', 'TODO', 'HIGH'],
  ['Review authentication security', 'DONE', 'URGENT'],
  ['Optimize Socket.IO events', 'IN_PROGRESS', 'HIGH'],
  ['Improve deployment pipeline', 'TODO', 'MEDIUM'],
  ['Write backend API documentation', 'DONE', 'LOW'],
];

async function seedMoreDemo() {
  console.log('Adding additional Hive demo data...');

  const owner = await prisma.user.findUnique({
    where: { email: 'owner@hive.demo' },
  });

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@hive.demo' },
  });

  const member = await prisma.user.findUnique({
    where: { email: 'member@hive.demo' },
  });

  if (!owner || !admin || !member) {
    throw new Error('Demo users not found. Run seedDemo.js first.');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'hive-demo-workspace' },
  });

  if (!workspace) {
    throw new Error('Demo workspace not found. Run seedDemo.js first.');
  }

  const users = [owner, admin, member];

  for (const projectData of projects) {
    let project = await prisma.project.findFirst({
      where: {
        workspaceId: workspace.id,
        name: projectData.name,
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          ...projectData,
          workspaceId: workspace.id,
        },
      });

      console.log(`Created project: ${project.name}`);
    } else {
      console.log(`Project already exists: ${project.name}`);
    }

    const projectIndex = projects.findIndex(
      (p) => p.name === projectData.name
    );

    const start = projectIndex * 8;
    const projectTasks = taskTemplates.slice(start, start + 8);

    for (let i = 0; i < projectTasks.length; i++) {
      const [title, status, priority] = projectTasks[i];

      const existingTask = await prisma.task.findFirst({
        where: {
          projectId: project.id,
          title,
        },
      });

      if (existingTask) continue;

      const assignee = users[i % users.length];
      const creator = users[(i + 1) % users.length];

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + i + 2);

      const task = await prisma.task.create({
        data: {
          title,
          description: `${title}. This task is part of the ${project.name} project.`,
          status,
          priority,
          projectId: project.id,
          creatorId: creator.id,
          assigneeId: assignee.id,
          dueDate,
        },
      });

      if (i < 3) {
        await prisma.comment.create({
          data: {
            content: `Working on "${title}". Initial progress looks good.`,
            taskId: task.id,
            userId: assignee.id,
          },
        });

        await prisma.comment.create({
          data: {
            content: `Reviewed this task and added it to the current sprint.`,
            taskId: task.id,
            userId: creator.id,
          },
        });
      }
    }
  }

  console.log('Additional demo data completed successfully!');
  await prisma.$disconnect();
}

seedMoreDemo().catch(async (err) => {
  console.error('Seed error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
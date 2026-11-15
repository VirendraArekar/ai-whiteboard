import { PrismaClient, BoardRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const saltRounds = 10;
  const demoPasswordHash = await bcrypt.hash('password123', saltRounds);
  const virendraPasswordHash = await bcrypt.hash('Password123!', saltRounds);

  // 1. Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      passwordHash: demoPasswordHash,
      name: 'Demo User',
    },
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
    },
  });
  console.log(`✅ Demo user seeded: ${demoUser.email} (password: password123)`);

  // 2. Upsert Virendra User
  const virendraUser = await prisma.user.upsert({
    where: { email: 'virendra@example.com' },
    update: {
      passwordHash: virendraPasswordHash,
      name: 'Virendra Arekar',
    },
    create: {
      name: 'Virendra Arekar',
      email: 'virendra@example.com',
      passwordHash: virendraPasswordHash,
    },
  });
  console.log(`✅ Virendra user seeded: ${virendraUser.email} (password: Password123!)`);

  // 3. Create Sample Whiteboard for Demo User if not exists
  const existingBoards = await prisma.whiteboard.findMany({
    where: { ownerId: demoUser.id },
  });

  if (existingBoards.length === 0) {
    const board = await prisma.whiteboard.create({
      data: {
        title: 'Project Brainstorm & Architecture',
        description: 'Collaborative board featuring AI notes, architecture diagrams, and metrics',
        ownerId: demoUser.id,
        members: {
          create: [
            {
              userId: demoUser.id,
              role: BoardRole.OWNER,
            },
            {
              userId: virendraUser.id,
              role: BoardRole.EDITOR,
            },
          ],
        },
        elements: {
          create: [
            {
              type: 'sticky',
              positionX: 100,
              positionY: 120,
              width: 200,
              height: 180,
              zIndex: 1,
              createdById: demoUser.id,
              data: {
                text: 'Welcome to AI Whiteboard! 🚀\nDouble-click any element to edit or use the AI Assistant panel on the right.',
                color: '#FEF08A',
                fontSize: 14,
              },
            },
            {
              type: 'sticky',
              positionX: 340,
              positionY: 120,
              width: 200,
              height: 180,
              zIndex: 2,
              createdById: demoUser.id,
              data: {
                text: 'Features:\n• Infinite Canvas & Pan/Zoom\n• Freehand Drawing & Shapes\n• Live Real-time Collaboration\n• Google Gemini AI Tools',
                color: '#BAE6FD',
                fontSize: 14,
              },
            },
            {
              type: 'shape',
              positionX: 100,
              positionY: 340,
              width: 180,
              height: 100,
              zIndex: 3,
              createdById: demoUser.id,
              data: {
                shapeType: 'rectangle',
                fillColor: '#E8F5E9',
                strokeColor: '#2D6A4F',
                strokeWidth: 2,
                label: 'Client (React 19 + Vite)',
              },
            },
            {
              type: 'shape',
              positionX: 360,
              positionY: 340,
              width: 180,
              height: 100,
              zIndex: 4,
              createdById: demoUser.id,
              data: {
                shapeType: 'rectangle',
                fillColor: '#EFF6FF',
                strokeColor: '#1D4ED8',
                strokeWidth: 2,
                label: 'NestJS Backend API',
              },
            },
            {
              type: 'connector',
              positionX: 280,
              positionY: 390,
              width: 80,
              height: 2,
              zIndex: 5,
              createdById: demoUser.id,
              data: {
                lineType: 'arrow',
                strokeColor: '#4B5563',
                strokeWidth: 2,
                label: 'REST & WebSocket',
              },
            },
            {
              type: 'chart',
              positionX: 580,
              positionY: 120,
              width: 320,
              height: 240,
              zIndex: 6,
              createdById: demoUser.id,
              data: {
                chartType: 'bar',
                title: 'Sprint Velocity by Epic',
                labels: ['Auth', 'Canvas', 'AI Assistant', 'Realtime'],
                values: [42, 85, 96, 78],
                colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D'],
              },
            },
          ],
        },
      },
    });

    console.log(`✅ Sample whiteboard created with ID: ${board.id}`);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

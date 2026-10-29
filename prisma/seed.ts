import { PrismaClient, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.log('跳过 seed：请先注册账号，然后设置 SEED_USER_ID 环境变量');
    return;
  }

  console.log(`Seeding demo data for user ${userId}...`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyTasks = [
    { title: '工程问题 15 题', completed: true },
    { title: '资料分析 20 题', completed: false },
    { title: '言语理解 20 题', completed: false },
  ];

  for (const t of dailyTasks) {
    await prisma.task.upsert({
      where: { id: `${userId}-${t.title}` },
      update: {},
      create: {
        id: `${userId}-${t.title}`,
        userId,
        title: t.title,
        type: TaskType.DAILY,
        date: today,
        completed: t.completed,
      },
    });
    console.log(`  ✓ Daily: ${t.title}`);
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
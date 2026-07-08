// test.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const iqbal = await prisma.user.findFirst({ where: { username: 'Iqbal' } });
  const userWhere = {
    OR: [
      { id: iqbal.id },
      { adminId: iqbal.id }
    ]
  };
  console.log("userWhere:", JSON.stringify(userWhere));
  const users = await prisma.user.findMany({ where: userWhere });
  console.log("Users returned:", users.map(u => u.username));
}

test().catch(console.error).finally(() => prisma.$disconnect());

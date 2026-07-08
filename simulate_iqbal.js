const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const iqbal = await prisma.user.findFirst({ where: { username: 'Iqbal' } });
  console.log("Iqbal id:", iqbal.id);

  const userWhere = {
    OR: [
      { id: iqbal.id },
      { adminId: iqbal.id }
    ]
  };

  const users = await prisma.user.findMany({
    where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
    orderBy: { createdAt: 'desc' }
  });

  console.log("Iqbal's users page sees:");
  console.log(users.map(u => u.username));
}

main().finally(() => process.exit(0));

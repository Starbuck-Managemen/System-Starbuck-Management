import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
  console.log("USERS:", users);
  
  const routers = await prisma.router.findMany({ select: { id: true, name: true, userId: true } });
  console.log("ROUTERS:", routers);
}

main().finally(() => process.exit(0));

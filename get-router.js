const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const routers = await prisma.router.findMany();
  console.log(JSON.stringify(routers, null, 2));
}

main().finally(() => prisma.$disconnect());

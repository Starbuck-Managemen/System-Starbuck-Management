const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany();
  console.log("Profiles:");
  console.table(profiles);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

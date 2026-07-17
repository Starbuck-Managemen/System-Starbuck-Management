const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.router.findMany().then(r => console.log(r)).finally(() => prisma.$disconnect());

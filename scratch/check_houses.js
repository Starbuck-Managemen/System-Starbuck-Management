const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const houses = await prisma.rentalHouse.findMany();
    console.log(houses);
}
main();

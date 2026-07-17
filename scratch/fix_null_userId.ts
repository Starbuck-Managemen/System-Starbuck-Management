import prisma from '../src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  }) || await prisma.user.findFirst();

  if (!user) {
    console.log("Tidak ada user ditemukan.");
    return;
  }

  console.log("Menggunakan user sebagai fallback:", user.username || user.email || user.id);

  const pRes = await prisma.$executeRaw`UPDATE "Profile" SET "userId" = ${user.id} WHERE "userId" IS NULL`;
  console.log(`Updated ${pRes} Profiles`);

  const tRes = await prisma.$executeRaw`UPDATE "Transaction" SET "userId" = ${user.id} WHERE "userId" IS NULL`;
  console.log(`Updated ${tRes} Transactions`);

  const vRes = await prisma.$executeRaw`UPDATE "Voucher" SET "userId" = ${user.id} WHERE "userId" IS NULL`;
  console.log(`Updated ${vRes} Vouchers`);

  const rRes = await prisma.$executeRaw`UPDATE "Router" SET "userId" = ${user.id} WHERE "userId" IS NULL`;
  console.log(`Updated ${rRes} Routers`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

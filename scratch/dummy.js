const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    console.log('NO_PROFILE');
    return;
  }
  const order = await prisma.hotspotOrder.create({
    data: {
      routerId: profile.routerId,
      profileId: profile.id,
      customerName: 'Testing Pembeli',
      customerPhone: '081234567890',
      amount: 15000,
      status: 'SUCCESS',
      voucherCode: 'TEST-123'
    }
  });
  console.log('ORDER_ID:' + order.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.hotspotOrder.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (order) {
    console.log(`HOTSPOT ORDER ID: ${order.id}`);
  } else {
    console.log("No hotspot orders found.");
  }

  const payment = await prisma.rentalPayment.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (payment) {
    console.log(`RENTAL PAYMENT TOKEN: ${payment.paymentToken}`);
  } else {
    console.log("No rental payments found.");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

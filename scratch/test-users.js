const { RouterOSClient } = require("routeros-client");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const router = await prisma.router.findFirst();
  const client = new RouterOSClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password || "",
  });

  await client.connect();
  const users = await client.api().menu("/ip/hotspot/user").get();
  console.log("Raw user 0:", users[0]);
  client.close();
}

main().catch(console.error);

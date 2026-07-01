const { RouterOSClient } = require("routeros-client");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const router = await prisma.router.findFirst();
  if (!router) {
    console.log("No router");
    return;
  }
  const client = new RouterOSClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password || "",
    timeout: 10,
  });

  await client.connect();
  const profiles = await client.api().menu("/ip/hotspot/user/profile").get();
  console.log(JSON.stringify(profiles, null, 2));
  
  const active = await client.api().menu("/ip/hotspot/active").get();
  console.log("Active count:", active.length);
  
  client.close();
}

main().catch(console.error);

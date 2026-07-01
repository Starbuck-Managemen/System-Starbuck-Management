const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RouterOSClient } = require("routeros-client");

async function main() {
  const router = await prisma.router.findFirst();
  console.log("Router", router);
  if(!router) return;

  const client = new RouterOSClient({
    host: router.host,
    port: router.port,
    user: router.username,
    password: router.password,
    timeout: 10
  });

  try {
    await client.connect();
    const menu = client.api().menu("/interface");
    console.log("Connected");
    
    // Attempt 1: once=""
    try {
        const t1 = await menu.exec("monitor-traffic", { interface: "bridge1-hotspot", once: "" });
        console.log("T1", t1);
    } catch(e) { console.log("T1 error", e) }

    // Attempt 2: once=true
    try {
        const t2 = await menu.exec("monitor-traffic", { interface: "bridge1-hotspot", once: true });
        console.log("T2", t2);
    } catch(e) { console.log("T2 error", e) }
    
  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}
main();

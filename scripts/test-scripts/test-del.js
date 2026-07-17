const { PrismaClient } = require('@prisma/client');
const { RouterOSClient } = require('routeros-client');
const prisma = new PrismaClient();

async function test() {
    const routers = await prisma.router.findMany();
    const router = routers[0];
    console.log("Router:", router.host);
    
    const client = new RouterOSClient({
        host: router.host,
        port: router.apiPort,
        user: router.username,
        password: router.password || "",
        timeout: 10,
        keepalive: true
    });
    
    await client.connect();
    console.log("Connected!");
    
    const menu = client.api().menu("/ip/hotspot/user");
    const users = await menu.get();
    const target = users.find(u => u.name === "72GW");
    console.log("Target User:", target);
    
    if (target) {
        try {
            await menu.remove(target['.id'] || target.id);
            console.log("Deleted successfully!");
        } catch(e) {
            console.log("Error deleting:", e.message);
        }
    }
    client.close();
}
test().catch(console.error);

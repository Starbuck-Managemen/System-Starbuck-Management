const { Client } = require('pg');
const { RouterOSClient } = require('routeros-client');
const { enrichVoucher } = require('./src/lib/mikrotikUtils.ts');

async function main() {
    const dbUrl = "postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    const res = await client.query("SELECT * FROM \"Router\" WHERE host LIKE '%idn25%' LIMIT 1");
    const router = res.rows[0];
    await client.end();
    
    const rosClient = new RouterOSClient({
        host: router.host,
        port: router.apiPort,
        user: router.username,
        password: router.password || "",
        timeout: 10,
        keepalive: true
    });
    
    await rosClient.connect();
    const menu = rosClient.api().menu("/ip/hotspot/user");
    const users = await menu.get();
    
    // Find an unused 1-JAM-FREE voucher
    const target = users.find(u => u.profile === "1-JAM-FREE" && u.uptime === "0s");
    console.log("RAW FROM MIKROTIK:", target);
    
    const priceMap = new Map();
    const enriched = enrichVoucher(target, priceMap);
    console.log("ENRICHED:", enriched);
    
    rosClient.close();
}

main().catch(console.error);

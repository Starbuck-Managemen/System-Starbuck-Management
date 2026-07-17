const { Client } = require('pg');
const { RouterOSClient } = require('routeros-client');

async function main() {
    const dbUrl = "postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    const res = await client.query("SELECT * FROM \"Router\" WHERE host LIKE '%idn25%' LIMIT 1");
    const router = res.rows[0];
    await client.end();
    
    if (!router) {
        console.log("Router not found.");
        return;
    }
    
    console.log(`Connecting to router: ${router.host}...`);
    
    const rosClient = new RouterOSClient({
        host: router.host,
        port: router.apiPort,
        user: router.username,
        password: router.password || "",
        timeout: 10,
        keepalive: true
    });
    
    try {
        await rosClient.connect();
        
        console.log("Connected! Running /ping address=8.8.8.8 count=4...");
        // In routeros-client, if you want to stream data or run a command with count, use the channel
        const stream = rosClient.api().menu("/ping").where("address", "8.8.8.8").where("count", "4").stream();
        
        stream.on("data", (data) => {
            console.log(`Reply: time=${data.time} status=${data.status || 'OK'}`);
        });
        
        stream.on("error", (err) => {
            console.error("Ping error:", err);
        });
        
        stream.on("done", () => {
            console.log("Ping completed.");
            rosClient.close();
        });
        
    } catch (e) {
        console.error("Error connecting:", e);
        rosClient.close();
    }
}

main().catch(console.error);

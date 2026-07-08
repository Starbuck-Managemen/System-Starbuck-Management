const { RouterOSClient } = require("routeros-client");
const { Client } = require("pg");

async function main() {
  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  await pgClient.connect();
  const res = await pgClient.query('SELECT host, "apiPort", username, password FROM "Router" LIMIT 1');
  await pgClient.end();
  
  if (!res.rows[0]) return;
  const router = res.rows[0];

  const client = new RouterOSClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password || "",
    timeout: 10
  });

  try {
    await client.connect();
    console.log("Connected to API");
    
    try {
      const p1 = await client.rosApi.write('/ping', ['=address=8.8.8.8', '=count=2']);
      console.log("P1 Success:", p1);
    } catch(e) { console.log("P1 Error:", e.message); }
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    client.close();
  }
}

main();

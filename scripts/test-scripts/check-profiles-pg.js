const { Client } = require('pg');
const connectionString = "postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function queryProfiles() {
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query('SELECT name, price, "routerId" FROM "Profile"');
  console.table(res.rows);
  await client.end();
}

queryProfiles().catch(console.error);

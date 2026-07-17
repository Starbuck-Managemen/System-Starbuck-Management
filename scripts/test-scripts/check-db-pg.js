const { Client } = require('pg');
const connectionString = "postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function queryTables() {
  const client = new Client({ connectionString });
  await client.connect();
  let res = await client.query('SELECT id, name FROM "Router"');
  console.log("Routers:");
  console.table(res.rows);
  
  res = await client.query('SELECT COUNT(*) FROM "Profile"');
  console.log("Profiles count:", res.rows[0].count);
  await client.end();
}

queryTables().catch(console.error);

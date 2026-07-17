require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const res = await client.query("UPDATE \"User\" SET role = 'SUPERADMIN' WHERE role = 'ADMIN' OR role = 'Administrator'");
  console.log('Fixed Users to SUPERADMIN:', res.rowCount);

  await client.end();
}

run();

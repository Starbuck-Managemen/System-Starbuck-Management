require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT id, username, name, role FROM "User"');
  console.log('All users:', res.rows);
  await client.end();
}

run();

require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const resUser = await client.query("UPDATE \"User\" SET role = 'USER' WHERE role = 'User'");
  console.log('Fixed Users:', resUser.rowCount);

  const resAdmin = await client.query("UPDATE \"User\" SET role = 'ADMIN' WHERE role = 'Administrator'");
  console.log('Fixed Admins:', resAdmin.rowCount);

  await client.end();
}

run();

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name, username, email, role FROM "User"');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);

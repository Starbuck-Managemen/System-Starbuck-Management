const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  const client = await pool.connect();
  try {
    const resUsers = await client.query('SELECT id, username, email, role FROM "User"');
    console.log("USERS:");
    console.table(resUsers.rows);

    const resRouters = await client.query('SELECT id, name, "userId" FROM "Router"');
    console.log("ROUTERS:");
    console.table(resRouters.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();

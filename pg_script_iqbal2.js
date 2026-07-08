const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  const client = await pool.connect();
  try {
    const resUsers = await client.query('SELECT username, "adminId" FROM "User"');
    console.table(resUsers.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();

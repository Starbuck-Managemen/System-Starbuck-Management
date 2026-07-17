const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pcztcriqmkyjochmdvnn:iVX16YwN44PM6MZM@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('UPDATE "Router" SET "userId" = $1 WHERE id = $2', ['cmrbkr5nr0005f65uixavt0bx', 'cmr0br66b0001ssmnrgv0dt9o']);
    console.log("Router transferred to ADMIN!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();

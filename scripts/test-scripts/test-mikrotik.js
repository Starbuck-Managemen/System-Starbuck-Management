const { RouterOSClient } = require("routeros-client");

async function test() {
  const client = new RouterOSClient({
    host: 'idn24.tunnel.id',
    port: 3096,
    user: 'admin',
    password: '',
    timeout: 10,
    keepalive: true
  });
  
  try {
    await client.connect();
    console.log("SUCCESS");
    client.close();
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}
test();

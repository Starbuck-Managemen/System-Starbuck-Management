const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat bucknet-manager-v2/wa-server.js`, (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('data', d => data += d).on('close', () => {
      // Replace POST with GET for the cron route
      data = data.replace(/fetch\('http:\/\/127\.0\.0\.1:3000\/api\/cron\/wa-reminder', {\s*method: 'POST'/g, "fetch('http://127.0.0.1:3000/api/cron/wa-reminder', {\n            method: 'GET'");
      
      // Write it back
      conn.exec(`cat > bucknet-manager-v2/wa-server.js`, (err2, stream2) => {
        if (err2) throw err2;
        stream2.write(data);
        stream2.end();
        stream2.on('close', () => {
          console.log('Successfully updated wa-server.js');
          // Restart PM2
          conn.exec('pm2 restart bucknet-manager', (err3, stream3) => {
             stream3.on('close', () => conn.end()).on('data', d => process.stdout.write(d));
          });
        });
      });
    });
  });
}).on('error', err => {
  console.error(err);
}).connect({
  host: '103.49.238.231',
  port: 22,
  username: 'Kiki',
  privateKey: fs.readFileSync('id_ed25519_bucknet'),
  readyTimeout: 99999
});

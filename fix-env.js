const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat bucknet-manager-v2/.env`, (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('data', d => data += d).on('close', () => {
      // Fix the missing newline
      data = data.replace('AUTH_SECRET="xrNTV3au6vTforss7sw_QZ6JBMd6HShZFeBMurXB7xE"NEXTAUTH_URL', 'AUTH_SECRET="xrNTV3au6vTforss7sw_QZ6JBMd6HShZFeBMurXB7xE"\nNEXTAUTH_URL');
      
      // Replace old IP with new IP and port 3000
      data = data.replace(/http:\/\/103\.183\.75\.243/g, 'http://103.49.238.231:3000');
      
      // Write it back
      conn.exec(`cat > bucknet-manager-v2/.env`, (err2, stream2) => {
        if (err2) throw err2;
        stream2.write(data);
        stream2.end();
        stream2.on('close', () => {
          console.log('Successfully updated .env');
          // Restart PM2
          conn.exec('pm2 restart all', (err3, stream3) => {
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

const { Client } = require('ssh2');

const conn = new Client();
const cmd = process.argv[2];
const user = process.argv[3] || 'ubuntu';

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
      process.exit(code);
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
  process.exit(1);
}).connect({
  host: '103.172.205.131',
  port: 22,
  username: user,
  password: 'Kiki3096',
  readyTimeout: 99999
});

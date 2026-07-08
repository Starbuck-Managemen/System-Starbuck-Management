const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Ready');
  conn.end();
}).on('error', (err) => {
  console.log('Connection error:', err);
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('Server asked for keyboard-interactive');
  finish(['Kiki3096']);
}).connect({
  host: '103.49.238.89',
  port: 22,
  username: 'ubuntu',
  password: 'Kiki3096',
  tryKeyboard: true,
  readyTimeout: 99999
});

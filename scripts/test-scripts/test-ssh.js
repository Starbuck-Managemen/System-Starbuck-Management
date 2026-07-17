const { exec } = require('child_process');

exec('ssh -i id_rsa_bucknet Kiki@103.49.238.231 "cat /etc/iptables/rules.v4"', (err, stdout, stderr) => {
    if (err) {
        console.error("Error executing SSH:", err);
        return;
    }
    console.log("Stdout:", stdout);
    if (stderr) console.error("Stderr:", stderr);
});

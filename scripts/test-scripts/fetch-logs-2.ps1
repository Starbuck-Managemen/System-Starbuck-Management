$server = "Kiki@103.49.238.231"
Write-Host "Mengambil out log dari VPS..."
ssh $server "cat /home/Kiki/.pm2/logs/bucknet-out.log | tail -n 150" > e:\PEMUDA\PROJECT\bucknet-manager-v2\vps-out.log
Write-Host "Mengambil error log (stderr) dari VPS..."
ssh $server "cat /home/Kiki/.pm2/logs/bucknet-error.log | tail -n 150" 2>&1 > e:\PEMUDA\PROJECT\bucknet-manager-v2\vps-error2.log
Write-Host "Log berhasil diambil!"

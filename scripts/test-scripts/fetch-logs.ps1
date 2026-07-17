$server = "Kiki@103.49.238.231"
Write-Host "Mengambil error log dari VPS..."
ssh $server "cat /home/Kiki/.pm2/logs/bucknet-error.log | tail -n 150" > e:\PEMUDA\PROJECT\bucknet-manager-v2\vps-error.log
Write-Host "Log berhasil diambil dan disimpan ke vps-error.log!"

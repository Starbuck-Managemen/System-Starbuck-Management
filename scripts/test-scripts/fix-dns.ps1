$server = "Kiki@103.49.238.231"
Write-Host "Memperbaiki sistem DNS (Resolusi Domain) di VPS..." -ForegroundColor Yellow

$sshCommand = @"
sudo systemctl restart systemd-resolved
echo 'Ping Test ke Google:'
ping -c 2 google.com
pm2 restart all
echo 'Selesai! Silakan refresh web Anda.'
"@

ssh -t $server $sshCommand

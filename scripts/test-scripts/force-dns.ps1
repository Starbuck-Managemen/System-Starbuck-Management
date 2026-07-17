$server = "Kiki@103.49.238.231"
Write-Host "Memaksa (Hardcode) DNS Google di VPS..." -ForegroundColor Yellow

$sshCommand = @"
sudo rm -f /etc/resolv.conf
echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf
echo 'nameserver 1.1.1.1' | sudo tee -a /etc/resolv.conf
pm2 restart all
echo 'Selesai! Silakan refresh web Anda.'
"@

ssh -t $server $sshCommand

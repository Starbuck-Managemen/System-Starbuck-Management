$server = "Kiki@103.49.238.231"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Membuka Gembok Keamanan VPS..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Silakan masukkan password VPS Anda jika diminta." -ForegroundColor Yellow

$sshCommand = @"
sudo iptables -I FORWARD 1 -d 192.168.42.0/24 -j ACCEPT
sudo iptables -I FORWARD 1 -s 192.168.42.0/24 -j ACCEPT
sudo netfilter-persistent save
echo ''
echo 'GEMBOK BERHASIL DIBUKA 100%!'
"@

ssh -t $server $sshCommand
Write-Host "Selesai! Silakan coba akses kembali." -ForegroundColor Green

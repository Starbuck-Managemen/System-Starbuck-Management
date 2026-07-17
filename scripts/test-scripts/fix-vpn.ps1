$server = "Kiki@103.49.238.231"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Memperbaiki Jalur VPN Pribadi..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Silakan masukkan password VPS Anda jika diminta." -ForegroundColor Yellow

$sshCommand = @"
sudo iptables -t nat -D PREROUTING -p tcp --dport 8110 -j DNAT --to-destination 192.168.43.10:8110 2>/dev/null || true
sudo iptables -t nat -D PREROUTING -p tcp --dport 8221 -j DNAT --to-destination 192.168.43.10:8221 2>/dev/null || true
sudo iptables -t nat -D PREROUTING -p tcp --dport 8222 -j DNAT --to-destination 192.168.43.10:8222 2>/dev/null || true
sudo iptables -t nat -D PREROUTING -p tcp --dport 8291 -j DNAT --to-destination 192.168.43.10:8291 2>/dev/null || true
sudo iptables -t nat -D PREROUTING -p tcp --dport 3244 -j DNAT --to-destination 192.168.43.10:8728 2>/dev/null || true

sudo iptables -t nat -A PREROUTING -p tcp --dport 8110 -j DNAT --to-destination 192.168.42.10:8110
sudo iptables -t nat -A PREROUTING -p tcp --dport 8221 -j DNAT --to-destination 192.168.42.10:8221
sudo iptables -t nat -A PREROUTING -p tcp --dport 8222 -j DNAT --to-destination 192.168.42.10:8222
sudo iptables -t nat -A PREROUTING -p tcp --dport 8291 -j DNAT --to-destination 192.168.42.10:8291
sudo iptables -t nat -A PREROUTING -p tcp --dport 3244 -j DNAT --to-destination 192.168.42.10:8728

sudo netfilter-persistent save
echo ''
echo 'PERBAIKAN BERHASIL 100%!'
"@

ssh -t $server $sshCommand
Write-Host "Perbaikan Selesai! Silakan coba akses kembali." -ForegroundColor Green

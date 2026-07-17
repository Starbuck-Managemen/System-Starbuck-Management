$server = "Kiki@103.49.238.231"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Mengizinkan Akses Firewall Real-time untuk Node.js..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Silakan masukkan password VPS Anda jika diminta." -ForegroundColor Yellow

$sshCommand = @"
# Membuat file konfigurasi sudoers khusus untuk Kiki agar bisa membaca iptables tanpa password
echo 'Kiki ALL=(ALL) NOPASSWD: /sbin/iptables, /usr/sbin/iptables' | sudo tee /etc/sudoers.d/bucknet-iptables > /dev/null

# Mengamankan file agar tidak bisa diedit sembarangan
sudo chmod 0440 /etc/sudoers.d/bucknet-iptables

echo ''
echo '========================================='
echo 'PENGATURAN IZIN FIREWALL SELESAI!'
echo '========================================='
"@

ssh -t $server $sshCommand
Write-Host "Selesai! Sekarang aplikasi web bisa menarik data tunnel secara live." -ForegroundColor Green
pause

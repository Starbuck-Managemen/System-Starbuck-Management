$server = "Kiki@103.49.238.231"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Membangun Server VPN Pribadi (L2TP) di VPS..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Silakan masukkan password VPS Anda jika diminta (ketik lalu tekan enter, hurufnya memang tidak muncul di layar)." -ForegroundColor Yellow
Write-Host "Proses ini akan memakan waktu sekitar 1-2 menit, mohon ditunggu sampai selesai." -ForegroundColor Yellow

$sshCommand = @"
sudo DEBIAN_FRONTEND=noninteractive apt-get update
# Menginstal alat untuk menyimpan pengaturan firewall secara permanen
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install iptables-persistent

# Mengunduh dan menjalankan skrip instalasi VPN Otomatis
wget -qO vpnsetup.sh https://get.vpnsetup.net
sudo VPN_IPSEC_PSK='AljuandriPSK2026' VPN_USER='aljuandri' VPN_PASSWORD='AljuandriPassword123' sh vpnsetup.sh

# Menetapkan IP statis 192.168.43.10 khusus untuk MikroTik Anda agar tidak berubah-ubah
sudo sed -i 's/aljuandri l2tpd AljuandriPassword123 \*/aljuandri l2tpd AljuandriPassword123 192.168.43.10/g' /etc/ppp/chap-secrets

# Membuat Port Forwarding untuk meremote dari Internet (VPS) menuju EAP & Winbox (MikroTik)
sudo iptables -t nat -A PREROUTING -p tcp --dport 8110 -j DNAT --to-destination 192.168.43.10:8110
sudo iptables -t nat -A PREROUTING -p tcp --dport 8221 -j DNAT --to-destination 192.168.43.10:8221
sudo iptables -t nat -A PREROUTING -p tcp --dport 8222 -j DNAT --to-destination 192.168.43.10:8222
sudo iptables -t nat -A PREROUTING -p tcp --dport 8291 -j DNAT --to-destination 192.168.43.10:8291
sudo iptables -t nat -A PREROUTING -p tcp --dport 3244 -j DNAT --to-destination 192.168.43.10:8728
sudo iptables -t nat -A POSTROUTING -j MASQUERADE

# Menyimpan aturan firewall agar permanen meski VPS di-restart
sudo netfilter-persistent save

# Restart layanan VPN agar IP statis terbaca
sudo systemctl restart xl2tpd

echo ''
echo '========================================='
echo 'INSTALASI SERVER VPN DI VPS BERHASIL 100%!'
echo '========================================='
"@

ssh -t $server $sshCommand
Write-Host "Pemasangan Selesai! Silakan beritahu saya jika sudah." -ForegroundColor Green

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membangun aplikasi di komputer Anda agar VPS tidak mati karena kehabisan RAM..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build lokal gagal. Silakan cek pesan di atas." -ForegroundColor Red
    exit 1
}

Write-Host "2. Mengemas fitur baru (Tunnel Generator) dan hasil build..." -ForegroundColor Yellow
# Kita bungkus folder src (kode fitur baru) dan folder .next (hasil build)
tar -czf tunnel-update.tar.gz src/ .next/

Write-Host "3. Mengirimkan ke VPS..." -ForegroundColor Yellow
scp tunnel-update.tar.gz ${server}:${remoteDir}/

Write-Host "4. Memasang fitur baru di VPS dan me-restart web..." -ForegroundColor Yellow
ssh $server "cd $remoteDir && tar -xzf tunnel-update.tar.gz && pm2 restart bucknet-web"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "UPLOAD SELESAI 100%! Fitur Tunnel Generator sudah tertanam di VPS." -ForegroundColor Green
Write-Host "Silakan refresh web starbuck.web.id Anda." -ForegroundColor Green

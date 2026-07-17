$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membangun aplikasi di komputer lokal agar VPS tidak mati karena kehabisan RAM..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build lokal gagal. Silakan cek pesan di atas." -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Mengemas kode sumber (src) dan hasil kompilasi (.next)..." -ForegroundColor Yellow
# Kita bungkus folder src (fitur status live) dan folder .next (hasil build) ke tar.gz
tar -czf status-update.tar.gz --exclude="cache" --exclude="*.map" src .next

Write-Host "`n3. Mengirimkan file arsip ke VPS..." -ForegroundColor Yellow
scp status-update.tar.gz ${server}:${remoteDir}/

Write-Host "`n4. Mengekstrak arsip di VPS dan merestart server..." -ForegroundColor Yellow
ssh $server "cd $remoteDir && tar -xzf status-update.tar.gz && pm2 restart bucknet-web"

# Hapus file tar lokal agar bersih
Remove-Item status-update.tar.gz -Force

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "DEPLOMENT SELESAI & BERHASIL!" -ForegroundColor Green
Write-Host "Silakan buka: https://starbuck.web.id/super-admin/mikrotik-manager" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green

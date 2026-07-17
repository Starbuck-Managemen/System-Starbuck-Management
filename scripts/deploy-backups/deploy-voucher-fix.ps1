$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membungkus file perbaikan Voucher..." -ForegroundColor Yellow
tar -czf voucher-fix.tar.gz src/lib/mikrotikUtils.ts

Write-Host "2. Mengirim file ke VPS..." -ForegroundColor Yellow
scp voucher-fix.tar.gz ${server}:${remoteDir}/

Write-Host "3. Ekstrak dan kompilasi ulang (build) di VPS..." -ForegroundColor Yellow
ssh -t $server "cd $remoteDir && tar -xzf voucher-fix.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "BERHASIL! Perbaikan voucher telah selesai diterapkan." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

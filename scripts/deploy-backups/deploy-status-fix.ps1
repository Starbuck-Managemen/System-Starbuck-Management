$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membungkus file perbaikan status voucher..." -ForegroundColor Yellow
tar -czf status-fix.tar.gz src/lib/mikrotikUtils.ts src/app/dashboard/voucher/VoucherTable.tsx

Write-Host "2. Mengirim file ke VPS..." -ForegroundColor Yellow
scp status-fix.tar.gz ${server}:${remoteDir}/

Write-Host "3. Ekstrak dan kompilasi ulang (build) di VPS..." -ForegroundColor Yellow
ssh -t $server "cd $remoteDir && tar -xzf status-fix.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "BERHASIL! Perbaikan status voucher telah diterapkan." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

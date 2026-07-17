$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membungkus file fitur Tunnel Generator..." -ForegroundColor Yellow
tar -czf tunnel-fix.tar.gz src/app/super-admin/layout.tsx src/components/SuperAdminMobileSidebar.tsx src/app/super-admin/tunnel-generator/page.tsx

Write-Host "2. Mengirim file ke VPS..." -ForegroundColor Yellow
scp tunnel-fix.tar.gz ${server}:${remoteDir}/

Write-Host "3. Ekstrak dan kompilasi ulang (build) langsung di VPS (Harap bersabar 1-2 menit)..." -ForegroundColor Yellow
ssh -t $server "cd $remoteDir && tar -xzf tunnel-fix.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "BERHASIL! VPS sudah selesai di-build." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membungkus file Tunnel List..." -ForegroundColor Yellow
tar -czf tunnel-fix.tar.gz `
  src/app/super-admin/tunnel-generator/page.tsx `
  src/app/api/vps/tunnels/route.ts

Write-Host "2. Mengirim ke VPS..." -ForegroundColor Yellow
scp tunnel-fix.tar.gz ${server}:${remoteDir}/

Write-Host "3. Ekstrak dan rebuild di VPS..." -ForegroundColor Yellow
ssh -t $server "cd $remoteDir && tar -xzf tunnel-fix.tar.gz && npm install node-ssh && npm approve-scripts ssh2 cpu-features && npm run build && pm2 restart bucknet-web"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "BERHASIL! Fitur Live Tunnel List sudah aktif." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

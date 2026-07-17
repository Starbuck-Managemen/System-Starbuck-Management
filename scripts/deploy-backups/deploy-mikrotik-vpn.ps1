$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Set-Location "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Deploy: MikroTik VPN Manager" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Buat direktori di VPS
Write-Host "`n[1/5] Membuat direktori di VPS..." -ForegroundColor Yellow
ssh $server "mkdir -p $remoteDir/src/app/super-admin/mikrotik-manager ; mkdir -p $remoteDir/src/app/api/vps/mikrotik-vpn ; mkdir -p '$remoteDir/src/app/api/vps/mikrotik-vpn/[id]'"

# Step 2: Upload file ke VPS
Write-Host "`n[2/5] Mengirim file ke VPS..." -ForegroundColor Yellow

scp "src\app\super-admin\layout.tsx" "${server}:${remoteDir}/src/app/super-admin/layout.tsx"
Write-Host "  Terkirim: layout.tsx" -ForegroundColor Green

scp "src\app\super-admin\mikrotik-manager\page.tsx" "${server}:${remoteDir}/src/app/super-admin/mikrotik-manager/page.tsx"
Write-Host "  Terkirim: mikrotik-manager/page.tsx" -ForegroundColor Green

scp "src\app\api\vps\mikrotik-vpn\route.ts" "${server}:${remoteDir}/src/app/api/vps/mikrotik-vpn/route.ts"
Write-Host "  Terkirim: mikrotik-vpn/route.ts" -ForegroundColor Green

scp "prisma\schema.prisma" "${server}:${remoteDir}/prisma/schema.prisma"
Write-Host "  Terkirim: schema.prisma" -ForegroundColor Green

# File [id]/route.ts - pakai nama sementara karena bracket masalah di PowerShell
$idSrc = Get-Item -LiteralPath "src\app\api\vps\mikrotik-vpn\[id]\route.ts"
Copy-Item -LiteralPath $idSrc.FullName -Destination ".\id-route-tmp.ts" -Force
scp "id-route-tmp.ts" "${server}:${remoteDir}/src/app/api/vps/mikrotik-vpn/id-route-tmp.ts"
Remove-Item ".\id-route-tmp.ts" -Force
ssh $server "mv $remoteDir/src/app/api/vps/mikrotik-vpn/id-route-tmp.ts '$remoteDir/src/app/api/vps/mikrotik-vpn/[id]/route.ts'"
Write-Host "  Terkirim: mikrotik-vpn/[id]/route.ts" -ForegroundColor Green

# Step 3: Update database
Write-Host "`n[3/5] Update database schema..." -ForegroundColor Yellow
ssh $server "cd $remoteDir ; npx prisma db push --accept-data-loss"

# Step 4: Build
Write-Host "`n[4/5] Build aplikasi (tunggu ~2 menit)..." -ForegroundColor Yellow
ssh $server "cd $remoteDir ; npm run build"

# Step 5: Restart
Write-Host "`n[5/5] Restart PM2..." -ForegroundColor Yellow
ssh $server "pm2 restart bucknet-web"

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "BERHASIL! Buka: https://starbuck.web.id/super-admin/mikrotik-manager" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Green

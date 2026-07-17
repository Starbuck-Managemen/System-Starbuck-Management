$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying files to VPS..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\components\MobileSidebar.tsx ${server}:${remoteDir}/src/components/MobileSidebar.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\components\SuperAdminMobileSidebar.tsx ${server}:${remoteDir}/src/components/SuperAdminMobileSidebar.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\super-admin\layout.tsx ${server}:${remoteDir}/src/app/super-admin/layout.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\lib\mikrotikUtils.ts ${server}:${remoteDir}/src/lib/mikrotikUtils.ts

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

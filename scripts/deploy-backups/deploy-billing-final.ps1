$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Syncing all recent billing files to VPS..."
scp -r e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\ ${server}:${remoteDir}/src/app/dashboard/
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\middleware.ts ${server}:${remoteDir}/src/middleware.ts

Write-Host "Running build on VPS (this may take 1-2 menit)..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

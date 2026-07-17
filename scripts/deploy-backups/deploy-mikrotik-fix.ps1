$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying mikrotik.ts fix..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\lib\mikrotik.ts ${server}:${remoteDir}/src/lib/mikrotik.ts

Write-Host "Copying actions.ts fix..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\voucher\generate\actions.ts ${server}:${remoteDir}/src/app/dashboard/voucher/generate/actions.ts

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

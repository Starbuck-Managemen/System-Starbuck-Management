$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying account actions.ts (Fix Typo)..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\account\actions.ts ${server}:${remoteDir}/src/app/dashboard/account/actions.ts

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Fix Completed!"

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying delete user actions..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\user\actions.ts ${server}:${remoteDir}/src/app/dashboard/user/actions.ts

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

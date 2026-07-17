$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying guide page.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\guide\page.tsx ${server}:${remoteDir}/src/app/dashboard/guide/page.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

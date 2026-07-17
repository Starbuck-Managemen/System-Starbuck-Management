$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying ContactAdminButton.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\components\ContactAdminButton.tsx ${server}:${remoteDir}/src/components/ContactAdminButton.tsx

Write-Host "Copying layout.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\layout.tsx ${server}:${remoteDir}/src/app/dashboard/layout.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

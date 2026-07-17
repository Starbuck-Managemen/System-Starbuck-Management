$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying API fix route..."
scp -r e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\fix-role ${server}:${remoteDir}/src/app/api/

Write-Host "Copying EditForm.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\user\edit\[id]\EditForm.tsx ${server}:${remoteDir}/src/app/dashboard/user/edit/`[id`]/EditForm.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

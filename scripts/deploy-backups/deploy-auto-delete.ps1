$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying files to VPS..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\voucher\actions.ts ${server}:${remoteDir}/src/app/dashboard/voucher/actions.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\report\actions.ts ${server}:${remoteDir}/src/app/dashboard/report/actions.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\wa-server.js ${server}:${remoteDir}/wa-server.js
ssh $server "mkdir -p ${remoteDir}/src/app/api/cron/auto-delete"
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\cron\auto-delete\route.ts ${server}:${remoteDir}/src/app/api/cron/auto-delete/route.ts

Write-Host "Rebuilding Next.js and restarting PM2..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet-web && pm2 restart bucknet-wa"

Write-Host "Deployment completed!"

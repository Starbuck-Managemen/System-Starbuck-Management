$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying files to VPS..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\cron\auto-delete\route.ts ${server}:${remoteDir}/src/app/api/cron/auto-delete/route.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\buy\[routerId]\BuyForm.tsx ${server}:${remoteDir}/src/app/buy/[routerId]/BuyForm.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\hotspot\buy\route.ts ${server}:${remoteDir}/src/app/api/hotspot/buy/route.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\payment\callback\route.ts ${server}:${remoteDir}/src/app/api/payment/callback/route.ts

Write-Host "Rebuilding Next.js and restarting PM2..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet-web && pm2 restart bucknet-wa"

Write-Host "Deployment completed!"

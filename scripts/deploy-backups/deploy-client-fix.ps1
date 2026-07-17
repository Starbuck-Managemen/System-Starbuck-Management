$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying middleware fix..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\middleware.ts ${server}:${remoteDir}/src/middleware.ts

Write-Host "Copying billing fix..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\BillingClient.tsx ${server}:${remoteDir}/src/app/dashboard/billing/BillingClient.tsx

Write-Host "Copying clients actions..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\super-admin\clients\actions.ts ${server}:${remoteDir}/src/app/super-admin\clients\actions.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\super-admin\clients\ClientRowActions.tsx ${server}:${remoteDir}/src/app/super-admin\clients\ClientRowActions.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

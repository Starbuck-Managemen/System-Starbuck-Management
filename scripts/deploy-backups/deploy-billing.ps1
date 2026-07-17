$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Creating billing directory..."
ssh $server "mkdir -p $remoteDir/src/app/dashboard/billing"

Write-Host "Copying billing page & actions..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\page.tsx ${server}:${remoteDir}/src/app/dashboard/billing/page.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\BillingClient.tsx ${server}:${remoteDir}/src/app/dashboard/billing/BillingClient.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\actions.ts ${server}:${remoteDir}/src/app/dashboard/billing/actions.ts

Write-Host "Copying layout.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\layout.tsx ${server}:${remoteDir}/src/app/dashboard/layout.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

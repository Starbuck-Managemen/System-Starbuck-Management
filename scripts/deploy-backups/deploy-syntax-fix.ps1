$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying syntax fix for billing..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\BillingClient.tsx ${server}:${remoteDir}/src/app/dashboard/billing/BillingClient.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

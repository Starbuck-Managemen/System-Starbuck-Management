$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Mengunggah file-file yang diperbarui..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\BillingClient.tsx ${server}:${remoteDir}/src/app/dashboard/billing/BillingClient.tsx
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\actions.ts ${server}:${remoteDir}/src/app/dashboard/billing/actions.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\middleware.ts ${server}:${remoteDir}/src/middleware.ts

Write-Host "Menjalankan build di VPS (Tunggu sekitar 1-2 menit)..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed! Silakan refresh browser Anda."

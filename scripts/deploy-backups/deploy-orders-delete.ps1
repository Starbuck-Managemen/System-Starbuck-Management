$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Copying orders actions.ts..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\orders\actions.ts ${server}:${remoteDir}/src/app/dashboard/orders/actions.ts

Write-Host "Copying OrdersTable.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\orders\OrdersTable.tsx ${server}:${remoteDir}/src/app/dashboard/orders/OrdersTable.tsx

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

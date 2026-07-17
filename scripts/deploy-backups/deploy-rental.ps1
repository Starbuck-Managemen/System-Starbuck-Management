$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Creating deployment package for Auto-Reminders..." -ForegroundColor Cyan
tar -czf update_rental.tar.gz `
  wa-server.js `
  src/app/api/cron/rental-reminder/route.ts `
  src/app/super-admin/rentals/RentalsClient.tsx `
  src/app/super-admin/rentals/actions.ts `
  src/app/super-admin/rentals/broadcastActions.ts `
  src/app/super-admin/layout.tsx `
  src/components/SuperAdminMobileSidebar.tsx `
  src/app/dashboard/voucher/VoucherTable.tsx `
  src/app/dashboard/voucher/broadcastActions.ts

Write-Host "Uploading to VPS..." -ForegroundColor Cyan
scp update_rental.tar.gz ${server}:${remoteDir}/

Write-Host "Extracting and restarting on VPS..." -ForegroundColor Cyan
ssh $server "cd $remoteDir && tar -xzf update_rental.tar.gz && npm run build && pm2 restart bucknet-web && pm2 restart bucknet-wa"

Write-Host "Deployment completed!" -ForegroundColor Green

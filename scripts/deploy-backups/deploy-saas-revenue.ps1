$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Creating deployment package..." -ForegroundColor Cyan
tar -czf update_saas_revenue.tar.gz `
  src/app/dashboard/report/actions.ts `
  src/app/super-admin/page.tsx

Write-Host "Uploading to VPS..." -ForegroundColor Cyan
scp update_saas_revenue.tar.gz ${server}:${remoteDir}/

Write-Host "Extracting and restarting on VPS..." -ForegroundColor Cyan
ssh $server "cd $remoteDir && tar -xzf update_saas_revenue.tar.gz && rm -rf .next && npm run build && pm2 restart bucknet-web"

Write-Host "Deployment completed!" -ForegroundColor Green

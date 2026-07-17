$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Mengompresi file update menjadi satu..."
tar -czf invoice-update.tar.gz src/components/InvoiceLayout.tsx src/app/invoice src/app/buy/status/[orderId]/StatusClient.tsx src/app/rentals/pay/[id]/RentalPayClient.tsx src/app/api/rental/pay/route.ts src/app/api/create-dummy/route.ts

Write-Host "2. Mengirim file kompresi ke VPS..."
scp invoice-update.tar.gz ${server}:${remoteDir}/

Write-Host "3. Mengekstrak dan melakukan build di VPS... (ini butuh waktu beberapa menit)"
ssh $server "cd $remoteDir && tar -xzf invoice-update.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "Deployment Selesai 100%!"

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Mengompresi file update menjadi satu..."
tar -czf voucher-fixes.tar.gz src/app/dashboard/voucher/VoucherTable.tsx src/app/dashboard/voucher/generate/GenerateForm.tsx

Write-Host "2. Mengirim file kompresi ke VPS..."
scp voucher-fixes.tar.gz ${server}:${remoteDir}/

Write-Host "3. Mengekstrak dan melakukan build di VPS... (ini butuh waktu beberapa menit)"
ssh $server "cd $remoteDir && tar -xzf voucher-fixes.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "Perbaikan Harga Voucher Selesai 100%!"

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Mengompresi file update menjadi satu..."
tar -czf ui-fixes.tar.gz src/app/super-admin/rentals/RentalsClient.tsx

Write-Host "2. Mengirim file kompresi ke VPS..."
scp ui-fixes.tar.gz ${server}:${remoteDir}/

Write-Host "3. Mengekstrak dan melakukan build di VPS... (ini butuh waktu beberapa menit)"
ssh $server "cd $remoteDir && tar -xzf ui-fixes.tar.gz && npm run build && pm2 restart bucknet-web"

Write-Host "Pembaruan UI Selesai 100%!"

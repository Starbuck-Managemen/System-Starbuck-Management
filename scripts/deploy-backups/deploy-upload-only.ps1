$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Mengompresi hasil build yang sudah selesai sebelumnya..."
tar -czf next-build.tar.gz .next/

Write-Host "2. Mengirim file kompresi ke VPS..."
scp next-build.tar.gz ${server}:${remoteDir}/

Write-Host "3. Mengekstrak dan me-restart server di VPS..."
ssh $server "cd $remoteDir && tar -xzf next-build.tar.gz && pm2 restart bucknet-web"

Write-Host "Perbaikan Selesai 100%! Tidak akan ada hang lagi."

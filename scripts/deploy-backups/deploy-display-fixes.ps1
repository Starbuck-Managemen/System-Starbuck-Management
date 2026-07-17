$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Mengompresi file update menjadi satu..."
tar -czf display-fixes.tar.gz src/lib/mikrotikUtils.ts

Write-Host "2. Mengirim file kompresi ke VPS..."
scp display-fixes.tar.gz ${server}:${remoteDir}/

Write-Host "3. Mengekstrak dan melakukan build di VPS dengan pembatasan memori... (Mohon tunggu hingga 5 menit)"
ssh $server "cd $remoteDir && tar -xzf display-fixes.tar.gz && export NODE_OPTIONS=--max_old_space_size=1024 && npm run build && pm2 restart bucknet-web"

Write-Host "Perbaikan Tampilan Selesai 100%!"

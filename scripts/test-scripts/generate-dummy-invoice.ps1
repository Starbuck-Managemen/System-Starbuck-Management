$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Write-Host "Mengirim script pembuat data testing ke VPS..."
scp $localDir\scratch\dummy.js ${server}:${remoteDir}/dummy.js

Write-Host "Menjalankan script di VPS untuk membuat 1 transaksi berhasil palsu..."
ssh $server "cd $remoteDir && node dummy.js"

Write-Host "Selesai!"

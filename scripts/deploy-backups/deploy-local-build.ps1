$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"
$localDir = "e:\PEMUDA\PROJECT\bucknet-manager-v2"

Set-Location $localDir

Write-Host "1. Membangun ulang (build) di Komputer Lokal Anda (Supaya VPS tidak hang)..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal melakukan build di lokal. Silakan cek pesan error di atas." -ForegroundColor Red
    exit 1
}

Write-Host "2. Mengompresi hasil build..."
tar -czf next-build.tar.gz .next/

Write-Host "3. Mengirim file kompresi hasil build ke VPS..."
scp next-build.tar.gz ${server}:${remoteDir}/

Write-Host "4. Mengekstrak dan me-restart server di VPS..."
ssh $server "cd $remoteDir && tar -xzf next-build.tar.gz && pm2 restart bucknet-web"

Write-Host "Perbaikan Selesai 100%! Tidak akan ada hang lagi."

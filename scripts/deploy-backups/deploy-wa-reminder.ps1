$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Mengunggah fitur Notifikasi WA Pengingat Tagihan..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\dashboard\billing\actions.ts ${server}:${remoteDir}/src/app/dashboard/billing/actions.ts
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\api\cron\wa-reminder\route.ts ${server}:${remoteDir}/src/app/api/cron/wa-reminder/route.ts

Write-Host "Menjalankan build ulang di VPS (Tunggu sekitar 1-2 menit)..."
ssh $server "cd $remoteDir && npm run build && pm2 restart bucknet"

Write-Host "Selesai! Fitur Bot WA Pengingat Tagihan (H-3) telah aktif."

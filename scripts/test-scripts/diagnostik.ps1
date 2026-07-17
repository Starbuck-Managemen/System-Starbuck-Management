$server = "Kiki@103.49.238.231"
Write-Host "Menjalankan diagnostik jaringan VPS..." -ForegroundColor Yellow

$sshCommand = @"
echo '--- PING GOOGLE ---'
ping -c 2 8.8.8.8
echo '--- PING SUPABASE ---'
ping -c 2 aws-1-ap-northeast-1.pooler.supabase.com
echo '--- CEK RESOLV.CONF ---'
cat /etc/resolv.conf
echo '--- CEK PM2 LOGS ---'
pm2 logs bucknet-web --lines 15 --nostream
"@

ssh -t $server $sshCommand

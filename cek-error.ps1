$server = "Kiki@103.49.238.231"
Write-Host "Mengambil catatan error (log) dari VPS..." -ForegroundColor Yellow
ssh -t $server "pm2 logs bucknet-web --lines 30 --nostream"

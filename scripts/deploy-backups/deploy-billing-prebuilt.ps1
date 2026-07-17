$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "Building project locally (this may take 15 detik)..."
npm run build

Write-Host "Compressing build output..."
Compress-Archive -Path "e:\PEMUDA\PROJECT\bucknet-manager-v2\.next" -DestinationPath "e:\PEMUDA\PROJECT\bucknet-manager-v2\next_build.zip" -Force

Write-Host "Uploading build to VPS..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\next_build.zip ${server}:${remoteDir}/next_build.zip

Write-Host "Applying build and restarting VPS server..."
ssh $server "cd $remoteDir && rm -rf .next && unzip -q next_build.zip && pm2 restart bucknet"

Write-Host "Deployment Completed!"

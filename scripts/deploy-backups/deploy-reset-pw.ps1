$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

# 1. Create directory on VPS
Write-Host "Creating directories..."
ssh $server "mkdir -p $remoteDir/src/app/login/reset-password/`[token`]"

# 2. SCP files individually (avoiding -r which hangs on Windows OpenSSH)
Write-Host "Copying page.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\login\reset-password\[token]\page.tsx ${server}:${remoteDir}/src/app/login/reset-password/`[token`]/page.tsx

Write-Host "Copying ResetPasswordForm.tsx..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\login\reset-password\[token]\ResetPasswordForm.tsx ${server}:${remoteDir}/src/app/login/reset-password/`[token`]/ResetPasswordForm.tsx

Write-Host "Copying actions.ts (reset)..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\login\reset-password\[token]\actions.ts ${server}:${remoteDir}/src/app/login/reset-password/`[token`]/actions.ts

Write-Host "Copying forgot-password actions.ts..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\src\app\login\forgot-password\actions.ts ${server}:${remoteDir}/src/app/login/forgot-password/actions.ts

Write-Host "Copying schema.prisma..."
scp e:\PEMUDA\PROJECT\bucknet-manager-v2\prisma\schema.prisma ${server}:${remoteDir}/prisma/schema.prisma

Write-Host "Running build on VPS..."
ssh $server "cd $remoteDir && npx prisma db push --accept-data-loss && npm run build && pm2 restart bucknet"

Write-Host "Deployment Completed!"

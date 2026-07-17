# Script Pembersihan dan Perapian Proyek bucknet-manager-v2
# Dibuat oleh Antigravity AI

$server = "Kiki@103.49.238.231"
$remoteDir = "/home/Kiki/bucknet-manager-v2"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "MEMULAI PROSES PEMBERSIHAN & PERAPIAN PROYEK..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Membuat folder baru jika belum ada
Write-Host "`n1. Membuat direktori backup..." -ForegroundColor Yellow
$deployBackupDir = "scripts\deploy-backups"
$testScriptDir = "scripts\test-scripts"

if (!(Test-Path $deployBackupDir)) {
    New-Item -ItemType Directory -Path $deployBackupDir | Out-Null
    Write-Host "   Folder $deployBackupDir berhasil dibuat." -ForegroundColor Green
}
if (!(Test-Path $testScriptDir)) {
    New-Item -ItemType Directory -Path $testScriptDir | Out-Null
    Write-Host "   Folder $testScriptDir berhasil dibuat." -ForegroundColor Green
}

# 2. Memindahkan file deploy-*.ps1 lama (kecuali deploy-tunnel.ps1 dan deploy-tunnel-status.ps1)
Write-Host "`n2. Memindahkan script deploy lama ke $deployBackupDir..." -ForegroundColor Yellow
$movedDeployCount = 0
Get-ChildItem -Path . -Filter "deploy-*.ps1" | ForEach-Object {
    $name = $_.Name
    if ($name -ne "deploy-tunnel.ps1" -and $name -ne "deploy-tunnel-status.ps1") {
        Move-Item -Path $_.FullName -Destination "$deployBackupDir\" -Force
        Write-Host "   -> Memindahkan: $name" -ForegroundColor Gray
        $movedDeployCount++
    }
}
Write-Host "   Selesai: $movedDeployCount script deploy dipindahkan." -ForegroundColor Green

# 3. Memindahkan file test/debug ke $testScriptDir
Write-Host "`n3. Memindahkan file uji coba/debug ke $testScriptDir..." -ForegroundColor Yellow
$movedTestCount = 0
$testFilters = @("test-*.js", "test-*.ts", "check-*.js", "check-*.ts", "pg_script*.js", "make-superadmin.js", "fetch-routers.js", "get-router.js", "alter-db.js", "simulate_iqbal.js", "fetch-logs*.ps1", "fix-*.js", "check-internet.js", "check-users.js", "fix-wa.js", "fix-jeni.js", "fix-roles.js")

foreach ($filter in $testFilters) {
    Get-ChildItem -Path . -Filter $filter -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "$testScriptDir\" -Force
        Write-Host "   -> Memindahkan: $($_.Name)" -ForegroundColor Gray
        $movedTestCount++
    }
}
Write-Host "   Selesai: $movedTestCount file debug/test dipindahkan." -ForegroundColor Green

# 4. Menghapus file arsip *.tar.gz dan *.zip di lokal (termasuk next_build.tar.gz 1.35GB)
Write-Host "`n4. Menghapus file arsip besar (*.tar.gz dan *.zip) di lokal..." -ForegroundColor Yellow
$deletedArchiveCount = 0
Get-ChildItem -Path . -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*.tar.gz" -or $_.Name -like "*.zip" } | ForEach-Object {
    $name = $_.Name
    # Jangan hapus file yang baru saja kita pakai jika ada
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    Write-Host "   [HAPUS] -> $name" -ForegroundColor Red
    $deletedArchiveCount++
}
Write-Host "   Selesai: $deletedArchiveCount file arsip dihapus." -ForegroundColor Green

# 5. Menghapus file *.log di root lokal
Write-Host "`n5. Menghapus file log (*.log) di root lokal..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    Write-Host "   [HAPUS] -> $($_.Name)" -ForegroundColor Red
}

# 6. Menghapus arsip sampah di VPS via SSH
Write-Host "`n6. Menghapus file arsip sampah di VPS..." -ForegroundColor Yellow
Write-Host "   Silakan masukkan password VPS jika diminta:" -ForegroundColor Magenta
ssh -t $server "rm -f $remoteDir/*.tar.gz $remoteDir/*.zip && echo '   -> Berhasil membersihkan file arsip di VPS!'"

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "PROSES PEMBERSIHAN SELESAI!" -ForegroundColor Green
Write-Host "Selanjutnya silakan jalankan perintah berikut untuk mengecek status Git:" -ForegroundColor Yellow
Write-Host "   git status" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'chore: clean up project structure, remove archives, secure credentials'" -ForegroundColor Cyan
Write-Host "   git push origin [nama_branch]" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green

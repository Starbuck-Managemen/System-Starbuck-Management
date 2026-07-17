@echo off
title Fix Printer Sharing Error 0x00000709 & 0x00000005
color 0A

echo =======================================================================
echo         Sistem Perbaikan Sharing Printer Windows 11 (Otomatis)
echo                  Error: 0x00000709 ^& 0x00000005
echo =======================================================================
echo.

:: Cek Administrator
echo Memeriksa hak akses Administrator...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Hak akses Administrator terdeteksi.
) else (
    color 0C
    echo [GAGAL] Script ini HARUS dijalankan sebagai Administrator!
    echo Silakan klik kanan file ini dan pilih "Run as administrator".
    echo.
    pause
    exit /b
)

echo.
echo [1/4] Memperbaiki Pengaturan Registri RPC Connection Protocol...
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcProtocols /t REG_DWORD /d 7 /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcOverTcp /t REG_DWORD /d 0 /f >nul
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcOverNamedPipes /t REG_DWORD /d 1 /f >nul
echo [OK] Registri RPC berhasil diperbarui.

echo.
echo [2/4] Mematikan Enkripsi PrintNightmare (RpcAuthnLevelPrivacyEnabled)...
reg add "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Print" /v RpcAuthnLevelPrivacyEnabled /t REG_DWORD /d 0 /f >nul
echo [OK] Keamanan sharing printer berhasil dilonggarkan.

echo.
echo [3/4] Mengizinkan Download Driver dari Server (RestrictDriver)...
reg add "HKEY_LOCAL_MACHINE\Software\Policies\Microsoft\Windows NT\Printers\PointAndPrint" /v RestrictDriverInstallationToAdministrators /t REG_DWORD /d 0 /f >nul
echo [OK] Restriksi instalasi driver berhasil dimatikan.

echo.
echo [4/4] Merestart layanan Print Spooler agar perubahan langsung aktif...
net stop spooler
net start spooler
echo [OK] Print Spooler berhasil di-restart.

echo.
echo =======================================================================
echo                      PERBAIKAN SELESAI!
echo =======================================================================
echo PENTING: Anda WAJIB memanggil printer menggunakan NAMA KOMPUTER,
echo BUKAN menggunakan Alamat IP (seperti 192.168.x.x)!
echo.
echo Jika masih muncul error yang sama, silakan RESTART komputer Anda.
echo.
pause

# 🚀 Panduan Deploy buckNet Manager v2 di VPS

## Daftar Isi
- [Prasyarat](#prasyarat)
- [Instalasi Awal di VPS](#instalasi-awal-di-vps)
- [Setup PM2](#setup-pm2)
- [Auto-Start saat VPS Reboot](#auto-start-saat-vps-reboot)
- [Perintah PM2 Sehari-hari](#perintah-pm2-sehari-hari)
- [Update Kode dari Komputer Lokal](#update-kode-dari-komputer-lokal)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

Pastikan VPS Anda sudah terinstall:
- **Node.js** v18 atau lebih baru
- **npm**
- **PM2** (akan diinstall di langkah berikut)
- **Chromium / Google Chrome** (dibutuhkan oleh Bot WhatsApp)

---

## Instalasi Awal di VPS

### 1. Install Node.js (jika belum)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install dependensi untuk Chromium (WhatsApp Bot)
```bash
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev
```

### 3. Install PM2 secara global
```bash
sudo npm install -g pm2
```

### 4. Upload / Clone project ke VPS
```bash
# Opsi A: Via Git
cd /home/user
git clone <repository-url> bucknet-manager-v2
cd bucknet-manager-v2

# Opsi B: Via SCP (dari komputer lokal)
# scp -r ./bucknet-manager-v2 user@103.49.238.231:/home/user/
```

### 5. Install dependencies & Build
```bash
cd /home/user/bucknet-manager-v2
npm install
npm run build
```

### 6. Buat folder logs
```bash
mkdir -p logs
```

---

## Setup PM2

### Jalankan semua service
```bash
cd /home/user/bucknet-manager-v2
pm2 start ecosystem.config.cjs
```

Ini akan menjalankan 2 proses:
| Nama Proses | Port | Fungsi |
|---|---|---|
| `bucknet-web` | 3000 | Server Next.js (Website utama) |
| `bucknet-wa` | 3001 | Bot WhatsApp (Notifikasi + Patroli) |

### Cek status
```bash
pm2 status
```

Pastikan keduanya **online** (hijau).

### Scan QR WhatsApp (pertama kali saja)
```bash
pm2 logs bucknet-wa
```
QR Code akan muncul di terminal. Scan dengan HP WhatsApp yang akan dijadikan bot.
Setelah terscan dan bertuliskan "✅ Bot WhatsApp sudah SIAP", tekan `Ctrl+C` untuk keluar dari log.

---

## Auto-Start saat VPS Reboot

Agar PM2 otomatis jalan saat VPS restart/reboot:

```bash
# Simpan daftar proses saat ini
pm2 save

# Generate script startup
pm2 startup

# PM2 akan menampilkan perintah yang harus di-copy-paste.
# Contoh output:
#   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u user --hp /home/user
# Copy-paste perintah tersebut dan jalankan.
```

Setelah ini, jika VPS mati lampu atau reboot, bucknet-web dan bucknet-wa akan otomatis nyala kembali.

---

## Perintah PM2 Sehari-hari

```bash
# Lihat status semua proses
pm2 status

# Lihat log realtime (semua proses)
pm2 logs

# Lihat log hanya Bot WA
pm2 logs bucknet-wa

# Lihat log hanya Web
pm2 logs bucknet-web

# Restart semua
pm2 restart all

# Restart hanya Bot WA (misal setelah scan ulang QR)
pm2 restart bucknet-wa

# Stop semua
pm2 stop all

# Hapus semua proses dari PM2
pm2 delete all

# Monitor CPU & RAM realtime
pm2 monit
```

---

## Update Kode dari Komputer Lokal

Setiap kali Anda mengupdate kode di komputer lokal dan ingin deploy ke VPS:

### Opsi A: Via Git (Disarankan)
```bash
# Di VPS:
cd /home/user/bucknet-manager-v2
git pull origin main
npm install          # Jika ada dependency baru
npm run build        # Build ulang
pm2 restart all      # Restart semua service
```

### Opsi B: Via SCP (Manual)
```bash
# Di komputer lokal (Windows PowerShell):
scp -r ./src user@103.49.238.231:/home/user/bucknet-manager-v2/
scp ./package.json user@103.49.238.231:/home/user/bucknet-manager-v2/
scp ./wa-server.js user@103.49.238.231:/home/user/bucknet-manager-v2/

# Lalu di VPS:
cd /home/user/bucknet-manager-v2
npm install
npm run build
pm2 restart all
```

---

## Troubleshooting

### Bot WA tidak bisa scan QR
```bash
# Hapus cache browser WA lama
pm2 stop bucknet-wa
rm -rf .wwebjs_auth .wwebjs_cache
pm2 restart bucknet-wa
pm2 logs bucknet-wa
# QR baru akan muncul, scan ulang
```

### Website tidak bisa diakses dari luar
```bash
# Pastikan port 3000 terbuka di firewall VPS
sudo ufw allow 3000

# Atau jika menggunakan Nginx sebagai reverse proxy:
sudo ufw allow 80
sudo ufw allow 443
```

### Cek apakah proses benar-benar berjalan
```bash
pm2 status
# Jika status "errored", cek log:
pm2 logs bucknet-web --lines 50
pm2 logs bucknet-wa --lines 50
```

### Bot WA terputus / harus scan ulang
```bash
pm2 restart bucknet-wa
pm2 logs bucknet-wa
# Tunggu QR muncul, lalu scan ulang
```

---

## Ringkasan Arsitektur di VPS

```
VPS (103.49.238.231)
├── PM2 (Process Manager) ← Auto-start saat boot
│   ├── bucknet-web (Next.js)     ← Port 3000
│   │   ├── Dashboard & UI
│   │   ├── API Cron: /api/cron/wa-reminder      (Patroli Voucher)
│   │   └── API Cron: /api/cron/router-monitor    (Patroli Router)
│   │
│   └── bucknet-wa (wa-server.js) ← Port 3001
│       ├── Kirim pesan WA
│       ├── Trigger patroli voucher setiap 24 jam
│       └── Trigger monitor router setiap 5 menit
│
├── Supabase Cloud ← Database PostgreSQL
└── MikroTik Router ← via VPN/API
```

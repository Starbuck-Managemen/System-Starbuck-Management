// PM2 Ecosystem Configuration - buckNet Manager v2
// Jalankan: pm2 start ecosystem.config.cjs
// Pastikan sudah di-build: npm run build

module.exports = {
  apps: [
    {
      // ===== Server Utama Next.js =====
      name: 'bucknet-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // Restart jika crash
      exp_backoff_restart_delay: 1000,
      max_restarts: 20,
      restart_delay: 3000,
    },
    {
      // ===== Server Bot WhatsApp =====
      name: 'bucknet-wa',
      script: 'wa-server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      // Logging
      error_file: './logs/wa-error.log',
      out_file: './logs/wa-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // Restart jika crash, tapi lebih lambat agar browser sempat tutup
      exp_backoff_restart_delay: 2000,
      max_restarts: 15,
      restart_delay: 5000,
    }
  ]
}

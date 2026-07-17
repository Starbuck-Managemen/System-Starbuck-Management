// Script untuk mendaftarkan router VPN yang sudah ada ke database
// Jalankan di VPS: node seed-mikrotik-vpn.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Mendaftarkan router VPN yang sudah ada...\n')

  const routers = [
    {
      name: 'Aljuandri',
      vpnUser: 'aljuandri',
      vpnPassword: 'AljuandriPassword123',
      vpnIp: '192.168.42.10',
      winboxPort: 8291,
      ipsecPsk: 'AljuandriPSK2026',
      notes: 'Router utama Aljuandri - dikonfigurasi sejak awal',
      extraPorts: JSON.stringify([
        { public: 8110, internal: 8110, label: 'EAP Omada 1' },
        { public: 8221, internal: 8221, label: 'EAP Omada 2' },
        { public: 8222, internal: 8222, label: 'EAP Omada 3' },
        { public: 3244, internal: 8728, label: 'MikroTik API' },
      ]),
    },
    {
      name: 'Starbuck (MutingAlfasera)',
      vpnUser: 'starbuck',
      vpnPassword: 'StarbuckPass2026',
      vpnIp: '192.168.43.11',
      winboxPort: 8292,
      ipsecPsk: 'AljuandriPSK2026',
      notes: 'Router MutingAlfasera Starbuck - Winbox: 103.49.238.231:8292',
      extraPorts: null,
    },
  ]

  for (const router of routers) {
    try {
      // Cek apakah sudah ada
      const existing = await prisma.mikrotikVPN.findFirst({
        where: {
          OR: [
            { vpnUser: router.vpnUser },
            { vpnIp: router.vpnIp },
            { winboxPort: router.winboxPort },
          ],
        },
      })

      if (existing) {
        console.log(`SKIP: "${router.name}" sudah terdaftar (user: ${existing.vpnUser})`)
        continue
      }

      const created = await prisma.mikrotikVPN.create({ data: router })
      console.log(`OK: "${created.name}" berhasil didaftarkan (ID: ${created.id})`)
    } catch (err) {
      console.error(`ERROR: "${router.name}" - ${err.message}`)
    }
  }

  console.log('\nSelesai! Refresh halaman MikroTik VPN Manager.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi WA Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n=========================================');
    console.log('📱 SCAN QR CODE INI DENGAN WHATSAPP BOT:');
    console.log('=========================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isReady = true;
    console.log('\n✅ Bot WhatsApp sudah SIAP dan TERHUBUNG!\n');
    setTimeout(triggerNextJsCron, 5000);
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.log('WhatsApp terputus', reason);
});

client.initialize();

// Endpoint untuk menerima perintah kirim WA dari buckNet Manager
app.post('/send-wa', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp Bot belum siap atau belum di-scan.' });
    }

    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Number dan Message diperlukan' });
    }

    try {
        const formattedNumber = `${number.replace(/[^0-9]/g, '')}@c.us`;
        
        // Dapatkan ID valid dari WhatsApp server untuk menghindari error "No LID for user"
        const contactId = await client.getNumberId(formattedNumber);
        
        if (!contactId) {
            console.error(`Nomor ${number} tidak terdaftar di WhatsApp.`);
            return res.status(400).json({ error: 'Nomor WhatsApp tidak terdaftar' });
        }

        await client.sendMessage(contactId._serialized, message);
        console.log(`✅ Pesan WA terkirim ke ${number}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Gagal mengirim WA:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint untuk mengambil daftar kontak WA yang tersimpan
app.get('/contacts', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp Bot belum siap atau belum di-scan.' });
    }

    try {
        const contacts = await client.getContacts();
        // Filter: Hanya kontak personal (bukan grup) yang sudah tersimpan di HP/Akun WA
        const savedContacts = contacts
            .filter(c => c.isMyContact && !c.isGroup)
            .map(c => ({
                id: c.id._serialized,
                name: c.name || c.pushname || c.shortName || c.number,
                number: c.number
            }));
            
        // Urutkan berdasarkan nama
        savedContacts.sort((a, b) => a.name.localeCompare(b.name));
        
        res.json({ contacts: savedContacts });
    } catch (err) {
        console.error('Gagal mengambil kontak WA:', err);
        res.status(500).json({ error: err.message });
    }
});

// Fungsi untuk memicu pengecekan otomatis (Cron) ke Next.js API
async function triggerNextJsCron() {
    try {
        console.log('🔄 Memulai Patroli Otomatis ke MikroTik...');
        const response = await fetch('http://127.0.0.1:3000/api/cron/wa-reminder', {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Patroli selesai: ${data.message}`);
        } else {
            console.log(`⚠️ Patroli gagal dengan status: ${response.status}`);
        }
    } catch (err) {
        console.log('⚠️ Gagal terhubung ke buckNet (Pastikan Next.js berjalan di port 3000)');
    }
}

// Set Interval Patroli Otomatis (Setiap 24 Jam = 24 * 60 * 60 * 1000 ms)
setInterval(triggerNextJsCron, 24 * 60 * 60 * 1000); 

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Service WhatsApp Bot berjalan di port ${PORT}`);
    console.log(`Menunggu inisialisasi browser WhatsApp...\n`);
});

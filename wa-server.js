require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const sessions = new Map();
const qrCodes = new Map();

// Helper to init client
function initClient(clientId) {
    if (sessions.has(clientId)) {
        return sessions.get(clientId);
    }

    console.log(`[WA] Initializing client for ${clientId}...`);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId }),
        webVersionCache: {
            type: "remote",
            remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
        },
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        }
    });

    client.on('qr', (qr) => {
        console.log(`[WA] QR received for ${clientId}`);
        qrCodes.set(clientId, qr);
    });

    client.on('ready', () => {
        console.log(`[WA] Client ${clientId} is ready!`);
        qrCodes.delete(clientId);
        
        // Optional: trigger Next.js cron for this client if needed
        // triggerNextJsCron(clientId);
    });

    client.on('authenticated', () => {
        console.log(`[WA] Client ${clientId} authenticated`);
        qrCodes.delete(clientId);
    });

    client.on('auth_failure', msg => {
        console.error(`[WA] Auth failure for ${clientId}:`, msg);
        qrCodes.delete(clientId);
        client.destroy().catch(console.error);
        sessions.delete(clientId);
    });

    client.on('disconnected', (reason) => {
        console.log(`[WA] Client ${clientId} disconnected:`, reason);
        qrCodes.delete(clientId);
        client.destroy().catch(console.error);
        sessions.delete(clientId);
    });

    client.initialize().catch(err => {
        console.error(`[WA] Error initializing ${clientId}:`, err);
        sessions.delete(clientId);
    });

    sessions.set(clientId, client);
    return client;
}

app.post('/start', (req, res) => {
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    if (!sessions.has(clientId)) {
        initClient(clientId);
        return res.json({ status: 'STARTING' });
    }
    
    return res.json({ status: 'ALREADY_EXISTS' });
});

app.get('/status/:clientId', (req, res) => {
    const { clientId } = req.params;
    
    if (!sessions.has(clientId)) {
        return res.json({ status: 'NOT_STARTED' });
    }

    const client = sessions.get(clientId);
    
    if (qrCodes.has(clientId)) {
        return res.json({ status: 'QR_READY', qr: qrCodes.get(clientId) });
    }
    
    if (client.info) {
        return res.json({ status: 'READY', pushname: client.info.pushname });
    }

    return res.json({ status: 'STARTING' });
});

app.post('/logout', async (req, res) => {
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });
    
    if (sessions.has(clientId)) {
        const client = sessions.get(clientId);
        try {
            await client.logout();
        } catch (e) {
            console.error(e);
        }
        sessions.delete(clientId);
        qrCodes.delete(clientId);
    }
    res.json({ success: true });
});

app.post('/send-wa', async (req, res) => {
    const { clientId, number, message } = req.body;
    
    if (!clientId) {
        return res.status(400).json({ error: 'clientId is required for multi-tenant WA' });
    }
    
    if (!sessions.has(clientId)) {
        return res.status(503).json({ error: 'WhatsApp Bot belum siap atau belum di-scan untuk pengguna ini.' });
    }

    const client = sessions.get(clientId);
    
    if (!client.info) {
        return res.status(503).json({ error: 'Client belum terhubung sepenuhnya.' });
    }

    if (!number || !message) {
        return res.status(400).json({ error: 'Number dan Message diperlukan' });
    }

    try {
        let cleanNumber = number.replace(/[^0-9]/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        }
        const formattedNumber = `${cleanNumber}@c.us`;
        await client.sendMessage(formattedNumber, message, { linkPreview: false });
        console.log(`✅ Pesan WA terkirim ke ${formattedNumber} via clientId ${clientId}`);
        res.json({ success: true });
    } catch (err) {
        console.error(`Gagal mengirim WA via ${clientId}:`, err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/contacts', async (req, res) => {
    const { clientId } = req.query;
    if (!clientId || !sessions.has(clientId)) {
        return res.status(503).json({ error: 'WhatsApp Bot belum siap untuk pengguna ini.' });
    }

    const client = sessions.get(clientId);
    if (!client.info) {
        return res.status(503).json({ error: 'Client belum terhubung sepenuhnya.' });
    }

    try {
        const contacts = await client.getContacts();
        const savedContacts = contacts
            .filter(c => c.isMyContact && !c.isGroup)
            .map(c => ({
                id: c.id._serialized,
                name: c.name || c.pushname || c.shortName || c.number,
                number: c.number
            }));
        savedContacts.sort((a, b) => a.name.localeCompare(b.name));
        res.json({ contacts: savedContacts });
    } catch (err) {
        console.error('Gagal mengambil kontak WA:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 WA Server (Multi-Tenant) berjalan di port ${PORT}`);
    console.log(`=========================================\n`);

    // Real-time router monitor polling every 15 seconds
    setInterval(async () => {
        try {
            const token = process.env.CRON_SECRET || '';
            const url = `http://127.0.0.1:3000/api/cron/router-monitor?token=${token}`;
            await fetch(url);
        } catch (e) {
            // Abaikan error (contoh: Next.js sedang restart)
        }
    }, 15000);

    // Auto-Delete expired vouchers polling every 15 minutes
    setInterval(async () => {
        try {
            const token = process.env.CRON_SECRET || '';
            const url = `http://127.0.0.1:3000/api/cron/auto-delete?token=${token}`;
            await fetch(url);
            console.log(`[CRON] Auto-Delete pinged at ${new Date().toISOString()}`);
        } catch (e) {
            // Abaikan error
        }
    }, 900000); // 15 menit

    // Rental Reminder polling every 1 minute (runs exactly at 08:00)
    setInterval(async () => {
        try {
            const now = new Date();
            // Eksekusi tepat pada jam 08:00 pagi
            if (now.getHours() === 8 && now.getMinutes() === 0) {
                const token = process.env.CRON_SECRET || '';
                const url = `http://127.0.0.1:3000/api/cron/rental-reminder?token=${token}`;
                await fetch(url);
                console.log(`[CRON] Rental Reminder triggered at ${now.toISOString()}`);
            }
        } catch (e) {
            console.error(`[CRON] Rental Reminder Error:`, e);
        }
    }, 60000);
});

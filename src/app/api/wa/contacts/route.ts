import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    // Pastikan user sudah login
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data kontak dari WA Bot
    const res = await fetch('http://127.0.0.1:3001/contacts', {
      cache: 'no-store', // Selalu ambil yang terbaru
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Gagal mengambil kontak WA dari bot:", error);
    return NextResponse.json(
      { error: "Gagal terhubung ke Service Bot WhatsApp (Port 3001)", details: error.message },
      { status: 503 }
    );
  }
}

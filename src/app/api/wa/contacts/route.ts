import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    // Pastikan user sudah login
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Proxy request ke WA server internal
    const userId = session.user.id;
    const waResponse = await fetch(`http://127.0.0.1:3001/contacts?clientId=${userId}`);
    
    if (!waResponse.ok) {
      const errorData = await waResponse.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Gagal dari WA Server" }, { status: waResponse.status });
    }
    
    const data = await waResponse.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Gagal mengambil kontak:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kontak", details: error.message },
      { status: 500 }
    );
  }
}

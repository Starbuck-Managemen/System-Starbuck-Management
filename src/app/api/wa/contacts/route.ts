import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    // Pastikan user sudah login
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ambil kontak dari database
    const dbContacts = await prisma.savedContact.findMany({
      orderBy: { name: 'asc' }
    });

    const formattedDbContacts = dbContacts.map(c => ({
      id: c.id,
      name: c.name,
      number: c.waNumber
    }));

    return NextResponse.json({ contacts: formattedDbContacts });
    
  } catch (error: any) {
    console.error("Gagal mengambil kontak:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kontak", details: error.message },
      { status: 500 }
    );
  }
}

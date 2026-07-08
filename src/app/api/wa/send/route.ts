import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    body.clientId = userId;
    
    // Proxy request ke WA server internal (berjalan di port 3001)
    const waResponse = await fetch('http://127.0.0.1:3001/send-wa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!waResponse.ok) {
      const errorData = await waResponse.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Gagal dari WA Server" }, { status: waResponse.status });
    }
    
    const data = await waResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("WA Proxy Error:", error);
    return NextResponse.json({ error: "Gagal terhubung ke service Bot WA internal" }, { status: 500 });
  }
}

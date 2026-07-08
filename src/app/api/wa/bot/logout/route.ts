import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const waResponse = await fetch(`http://127.0.0.1:3001/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: userId })
    });
    if (!waResponse.ok) throw new Error("Failed to connect to WA Server");

    const data = await waResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service Bot WA sedang tidak aktif" }, { status: 500 });
  }
}

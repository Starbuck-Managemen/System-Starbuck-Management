import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    // Find the very first user created in the database, which is the Super Admin
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    if (firstUser) {
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: 'SUPERADMIN' }
      });
      return NextResponse.json({ 
        success: true, 
        message: `Berhasil mengembalikan hak akses SUPERADMIN untuk akun: ${firstUser.username}` 
      });
    }
    
    return NextResponse.json({ error: "User tidak ditemukan di database" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

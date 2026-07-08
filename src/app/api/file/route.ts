import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p = searchParams.get('path');
  
  if (!p || p.includes('..')) {
    return new NextResponse("Not Found", { status: 404 });
  }
  
  try {
    const filePath = path.join(process.cwd(), 'public', p);
    const file = await readFile(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (p.endsWith('.png')) contentType = 'image/png';
    else if (p.endsWith('.jpg') || p.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (p.endsWith('.gif')) contentType = 'image/gif';
    else if (p.endsWith('.svg')) contentType = 'image/svg+xml';
    
    return new NextResponse(file, {
      headers: { 
        'Content-Type': contentType, 
        'Cache-Control': 'public, max-age=31536000' 
      }
    });
  } catch (e) {
    return new NextResponse("Not Found", { status: 404 });
  }
}

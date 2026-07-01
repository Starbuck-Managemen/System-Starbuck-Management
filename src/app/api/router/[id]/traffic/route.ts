import { NextRequest, NextResponse } from "next/server";
import { getMikrotikClient } from "@/lib/mikrotik";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const routerId = resolvedParams.id;
  const interfaceName = req.nextUrl.searchParams.get("interface");

  let client;
  try {
    client = await getMikrotikClient(routerId);

    if (!interfaceName) {
      // Get list of interfaces
      const menu = client.api().menu("/interface");
      const interfaces = await menu.get();
      const interfaceNames = interfaces.map((i: any) => i.name).filter(Boolean);
      return NextResponse.json({ interfaces: interfaceNames });
    }

    // Get traffic for specific interface
    const menu = client.api().menu("/interface");
    const traffic = await menu.exec("monitor-traffic", { interface: interfaceName, once: "" });
    
    if (traffic && traffic.length > 0) {
      const tx = parseInt(traffic[0].txBitsPerSecond) || parseInt(traffic[0]["tx-bits-per-second"]) || 0;
      const rx = parseInt(traffic[0].rxBitsPerSecond) || parseInt(traffic[0]["rx-bits-per-second"]) || 0;
      return NextResponse.json({ tx, rx, debug: traffic });
    }

    return NextResponse.json({ tx: 0, rx: 0, debug: traffic, error: "Empty array" });
  } catch (error: any) {
    console.error("Traffic error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.close();
  }
}

import { getMikrotikClient } from "./src/lib/mikrotik";
import prisma from "./src/lib/prisma";

async function test() {
  const router = await prisma.router.findFirst();
  if (!router) {
    console.log("no router");
    return;
  }
  
  const client = await getMikrotikClient(router.id);
  const menu = client.api().menu("/interface");
  try {
    const res = await menu.exec("monitor-traffic", { interface: "bridge1-hotspot", once: "yes" });
    console.log("Traffic with once=yes:", res);
  } catch (e) {
    console.log("Error once=yes:", e);
  }

  try {
    const res2 = await menu.exec("monitor-traffic", { interface: "bridge1-hotspot", once: "" });
    console.log("Traffic with once='':", res2);
  } catch (e) {
    console.log("Error once='':", e);
  }

  client.close();
}

test();

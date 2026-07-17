import { getVouchers, deleteVoucher } from "./src/lib/mikrotik.ts"
import prisma from "./src/lib/prisma.ts"

async function testDelete() {
    const routerId = "clzhc242a00010clc4qnd6z65" // Need to find the router ID
    const routers = await prisma.router.findMany()
    const r = routers[0]
    
    console.log("Testing on router:", r.name)
    const delRes = await deleteVoucher(r.id, "72GW") // We know 72GW is failing
    console.log("Delete 72GW by name:", delRes)
    
    const vouchers = await getVouchers(r.id)
    const v = vouchers.find(v => v.name === "72GW")
    console.log("Voucher 72GW ID:", v?.id)
    
    if (v?.id) {
        const delRes2 = await deleteVoucher(r.id, v.id)
        console.log("Delete 72GW by ID:", delRes2)
    }
}
testDelete().catch(console.error)

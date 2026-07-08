import prisma from "@/lib/prisma"
import { getVouchers } from "@/lib/mikrotik"
import { PrintButton } from "./PrintButton"
import { getSettings } from "@/app/dashboard/settings/actions"

export default async function PrintVoucherPage({
  searchParams
}: {
  searchParams: Promise<{ routerId?: string, batchId?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const routerId = resolvedSearchParams.routerId
  const batchId = resolvedSearchParams.batchId
  const settings = await getSettings()

  if (!routerId) {
    return <div className="p-10 text-center">ID Router tidak ditemukan.</div>
  }

  const router = await prisma.router.findUnique({
    where: { id: routerId }
  })

  if (!router) {
    return <div className="p-10 text-center">Router tidak ditemukan di database.</div>
  }

  // Ambil data profil dari database untuk mendapatkan harga sebenarnya
  const profiles = await prisma.profile.findMany({
    where: { routerId }
  })
  
  const profilePrices: Record<string, number> = {}
  profiles.forEach(p => {
    profilePrices[p.name] = p.price
  })

  let vouchers: any[] = []
  try {
    vouchers = await getVouchers(routerId)
    // Filter out disabled vouchers or default admin
    vouchers = vouchers.filter(v => !v.disabled && v.name !== "default-trial" && v.name !== "admin")
    
    // Filter by batchId if provided
    if (batchId) {
      vouchers = vouchers.filter(v => v.comment && v.comment.includes(batchId))
    }
  } catch (error) {
    return <div className="p-10 text-center text-red-500">Gagal mengambil data voucher dari MikroTik.</div>
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans">
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="print:hidden p-4 bg-slate-100 border-b border-slate-300 flex justify-between items-center fixed top-0 left-0 w-full shadow-sm z-50">
        <div>
          <h1 className="font-bold text-lg">Cetak Voucher</h1>
          <p className="text-sm text-slate-500">Total: {vouchers.length} Voucher Aktif</p>
        </div>
        <PrintButton />
      </div>

      {/* Grid Voucher */}
      <div className="p-8 pt-24 print:p-0 print:pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-2">
          {vouchers.map(v => {
            let price = 0;
            if (v.profile && profilePrices[v.profile]) {
              price = profilePrices[v.profile];
            }
            const priceFormatted = price > 0 ? `Rp ${new Intl.NumberFormat("id-ID").format(price)}` : "";

            return (
              <div key={v.id} className="border-2 border-dashed border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center text-center page-break-inside-avoid relative">
                <div className="font-bold text-sm text-blue-800 mb-1 border-b border-slate-300 w-full pb-1 flex flex-col items-center justify-center gap-1">
                  <img src={settings.appLogo} alt="Logo" className="w-6 h-6 object-contain rounded-md" />
                  <span>{settings.appName}</span>
                </div>
                
                <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Kode Voucher</div>
                <div className="text-xl font-bold tracking-widest text-slate-800 my-1 font-mono">
                  {v.name}
                </div>
                
                <div className="flex w-full justify-center gap-1.5 mt-2 text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded text-center">
                  <span className="font-semibold uppercase">{v.profile}</span>
                  {priceFormatted && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-green-700">{priceFormatted}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break-inside-avoid { break-inside: avoid; }
        }
      `}} />
    </div>
  )
}

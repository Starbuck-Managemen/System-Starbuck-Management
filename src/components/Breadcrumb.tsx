'use client'

import { usePathname } from 'next/navigation'

export function Breadcrumb() {
  const pathname = usePathname()
  
  // Format pathname into readable breadcrumb
  let current = 'Dashboard'
  if (pathname.includes('/report')) current = 'Laporan'
  if (pathname.includes('/user')) current = 'User'
  if (pathname.includes('/voucher')) current = 'Voucher'
  if (pathname.includes('/router')) current = 'Router'

  return (
    <>Home / <span className="text-slate-50 ml-1">{current}</span></>
  )
}

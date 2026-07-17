import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  
  // Rute publik (Pelanggan beli voucher)
  if (path.startsWith('/buy')) {
    return null
  }

  const isAuthPage = path.startsWith('/login') || path.startsWith('/register')
  
  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
    return null
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
  
  // RBAC Route Guarding
  if (req.nextUrl.pathname.startsWith('/dashboard/user')) {
    console.log('MIDDLEWARE req.auth:', JSON.stringify(req.auth, null, 2))
  }
  const role = (req.auth as any)?.user?.role || (req.auth as any)?.role || 'USER'

  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    const forbiddenPaths = [
      '/dashboard/user',
      '/dashboard/router',
      '/dashboard/profile',
      '/dashboard/guide',
      '/dashboard/voucher/generate',
      '/dashboard/wa-bot'
    ]
    
    if (forbiddenPaths.some(p => path.startsWith(p))) {
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
  }

  return null
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

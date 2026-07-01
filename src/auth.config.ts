import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.loginTime = Date.now();
      }
      
      // Fix HTTP 431 Error: Remove base64 image from JWT to keep cookies small
      delete token.picture;
      
      return token;
    },
    async session({ session, token }) {
      if (token?.loginTime) {
         (session.user as any).loginTime = token.loginTime as number;
         (session.user as any).role = token.role;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

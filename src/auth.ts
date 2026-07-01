import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username as string
          }
        });
        
        if (!user || !user.password) {
            return null;
        }

        if (user.password === credentials.password) {
            const sessionToken = crypto.randomUUID();
            const updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                currentSessionToken: sessionToken,
                lastActive: new Date()
              }
            });
            // Attach the token to the user object returned to jwt callback
            return {
              ...updatedUser,
              currentSessionToken: sessionToken
            };
        }
        
        return null;
      }
    })
  ]
})

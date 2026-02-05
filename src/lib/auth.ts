import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Email avec vérification par code
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  
  // Vérification par code OTP
  emailVerification: {
    sendVerificationEmail: async ({ user, code }) => {
      // TODO: Configurer l'envoi d'email (Resend, Brevo, etc.)
      console.log(`Code de vérification pour ${user.email}: ${code}`)
    },
  },
  
  // OAuth Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: true,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      enabled: true,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      enabled: true,
    },
  },
  
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000"],
})
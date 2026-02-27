import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { emailOTP } from "better-auth/plugins"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/email/resend"
import bcrypt from "bcryptjs"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  advanced: {
    useSecureCookies: false, // Important en dev HTTP (pas HTTPS)
  },

  // Email avec vérification par code
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      // En prod : vérifier facturflow.fr dans le dashboard Resend et mettre RESEND_FROM_EMAIL=noreply@facturflow.fr
      const from = process.env.RESEND_FROM_EMAIL ?? "FacturFlow <onboarding@resend.dev>";
      // En dev avec onboarding@resend.dev, Resend n'autorise que l'envoi vers l'adresse du compte Resend
      const devOverrideTo = process.env.RESEND_DEV_TO;
      const to = devOverrideTo ?? user.email;
      if (devOverrideTo) {
        console.log(`[RESET PASSWORD DEV] Email redirigé : ${user.email} → ${devOverrideTo}`);
      }
      try {
        const { error } = await resend.emails.send({
          from,
          to,
          subject: "Réinitialisez votre mot de passe FacturFlow",
          html: `
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
                <tr><td align="center">
                  <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <!-- Header -->
                    <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center;">
                      <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <span style="font-size:24px;font-weight:700;color:#fff;">F</span>
                      </div>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Réinitialisation du mot de passe</h1>
                    </td></tr>
                    <!-- Body -->
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 8px;font-size:16px;color:#1e293b;font-weight:600;">Bonjour ${user.name ?? user.email},</p>
                      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                        Vous avez demandé la réinitialisation de votre mot de passe FacturFlow.<br>
                        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                      </p>
                      <div style="text-align:center;margin:28px 0;">
                        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                          Réinitialiser mon mot de passe
                        </a>
                      </div>
                      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
                        Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre compte reste sécurisé.
                      </p>
                    </td></tr>
                    <!-- Footer -->
                    <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} FacturFlow — Tous droits réservés</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
        });
        if (error) {
          console.error("[sendResetPassword] Resend error:", error);
          console.log(`[RESET PASSWORD DEV] Lien pour ${user.email}: ${url}`);
        }
      } catch (err) {
        console.error("[sendResetPassword] Exception:", err);
        console.log(`[RESET PASSWORD DEV] Lien pour ${user.email}: ${url}`);
      }
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      sendVerificationOTP: async ({ email, otp }) => {
        // TODO: Remplacer par Resend en production
        console.log(`[OTP] Code de vérification pour ${email}: ${otp}`)
      },
    }),
  ],

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
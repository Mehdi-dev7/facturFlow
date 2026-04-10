import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountPageContent } from "@/components/account/account-page-content";

export const metadata = { title: "Mon profil | FacturNow" };

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;

  // Charger le phone (pas dans la session Better Auth)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, phone: true },
  });

  // Vérifier si l'user a un compte credential (pour afficher section MDP)
  const credentialAccount = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  // Providers OAuth connectés
  const oauthAccounts = await prisma.account.findMany({
    where: { userId, NOT: { providerId: "credential" } },
    select: { providerId: true },
  });

  return (
    <AccountPageContent
      user={{
        name: user?.name ?? session.user.name ?? "",
        email: session.user.email,
        image: user?.image ?? session.user.image ?? null,
        phone: user?.phone ?? null,
      }}
      hasCredentials={!!credentialAccount}
      oauthProviders={oauthAccounts.map((a) => a.providerId)}
    />
  );
}

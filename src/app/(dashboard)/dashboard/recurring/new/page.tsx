"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringPreview } from "@/components/recurring/recurring-preview";
import { recurringSchema, type RecurringFormData } from "@/lib/validations/recurring";
import { useAppearance } from "@/hooks/use-appearance";
import { useCompanyInfoForForms } from "@/hooks/use-company";
import { useCreateRecurring } from "@/hooks/use-recurring";

// ─── Page de création d'une récurrence ───────────────────────────────────────
// Pattern identique à /dashboard/invoices/new :
//   - Desktop : split-screen form à gauche + preview sticky à droite
//   - Mobile  : form full-width avec stepper intégré

export default function NewRecurringPage() {
  const router = useRouter();

  // Évite les mismatches d'hydratation : on attend le montage côté client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Apparence de l'entreprise (thème couleur, police, logo)
  const { themeColor, companyFont, companyLogo, companyName } = useAppearance();

  // Informations de l'entreprise pour le preview (adresse, email…)
  const { data: companyInfo } = useCompanyInfoForForms();

  // Mutation de création
  const createMutation = useCreateRecurring();

  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      clientId: "",
      label: "",
      paymentMethod: "BANK_TRANSFER",
      frequency: "MONTHLY",
      startDate: "",
      endDate: "",
      lines: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
      notes: "",
    },
  });

  // ─── Submit : créer la récurrence puis rediriger ─────────────────────────

  const onSubmit = useCallback(
    async (data: RecurringFormData) => {
      const result = await createMutation.mutateAsync(data);
      // useCreateRecurring affiche déjà le toast — on redirige si succès
      if (result?.success !== false) {
        router.push("/dashboard/recurring");
      }
    },
    [createMutation, router],
  );

  // ─── Skeleton pendant le montage ─────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-56 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
        <div className="h-[600px] bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
        >
          <Link href="/dashboard/recurring">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Nouvelle récurrence
          </h1>
          <p className="text-sm text-slate-500 dark:text-violet-400/60">
            Automatisez la génération de vos factures
          </p>
        </div>
      </div>

      {/* ─── Desktop : split-screen ──────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Form dans une card */}
        <div>
          <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
            <RecurringForm
              form={form}
              onSubmit={onSubmit}
              isSubmitting={createMutation.isPending}
              onCancel={() => router.push("/dashboard/recurring")}
              cancelLabel="Annuler"
            />
          </div>
        </div>

        {/* Preview sticky à droite */}
        <div className="sticky top-6 self-start">
          <RecurringPreview
            form={form}
            themeColor={themeColor}
            companyFont={companyFont}
            companyLogo={companyLogo}
            companyName={companyName}
            companyInfo={companyInfo ?? null}
          />
        </div>
      </div>

      {/* ─── Mobile : form full-width avec stepper intégré ───────────────── */}
      <div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh] p-4 xs:p-5">
        <RecurringForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={createMutation.isPending}
          onCancel={() => router.push("/dashboard/recurring")}
          cancelLabel="Retour"
        />
      </div>
    </div>
  );
}

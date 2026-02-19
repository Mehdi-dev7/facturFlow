"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepositForm } from "@/components/acomptes/deposit-form";
import { DepositPreview } from "@/components/acomptes/deposit-preview";
import { toast } from "sonner";
import { useCreateDeposit, useSaveDraftDeposit } from "@/hooks/use-deposits";
import { getNextDepositNumber } from "@/lib/actions/deposits";
import type { CompanyInfo } from "@/lib/validations/invoice";

const AUTOSAVE_INTERVAL = 30_000;

// ─── Schema local (inclut les champs UI non stockés en DB brut) ──────────────

const depositFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  amount: z.number().min(0.01, "Montant requis"),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
  date: z.string().min(1, "Date requise"),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  description: z.string().min(1, "Description requise"),
  notes: z.string().optional(),
  paymentLinks: z.object({
    stripe: z.boolean(),
    paypal: z.boolean(),
    sepa: z.boolean(),
  }),
});

type DepositFormData = z.infer<typeof depositFormSchema>;

// ─── Helpers date ─────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewDepositPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [depositNumber, setDepositNumber] = useState("DEP-…-…");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const createDeposit = useCreateDeposit();
  const saveDraft = useSaveDraftDeposit();

  // Ref pour stocker l'ID du brouillon en cours de sauvegarde
  const draftIdRef = useRef<string | undefined>(undefined);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    mode: "onSubmit",          // Erreurs affichées seulement au premier submit
    reValidateMode: "onChange", // Après le premier submit, mise à jour en temps réel
    defaultValues: {
      clientId: "",
      amount: 0,
      vatRate: 20,
      date: "",
      dueDate: "",
      description: "",
      notes: "",
      paymentLinks: {
        stripe: true,
        paypal: false,
        sepa: false,
      },
    },
  });

  // Initialisation côté client uniquement
  useEffect(() => {
    async function init() {
      // 1. Numéro d'acompte depuis la DB
      try {
        const result = await getNextDepositNumber();
        if (result.success && result.data) {
          setDepositNumber(result.data);
        } else {
          const year = new Date().getFullYear();
          setDepositNumber(`ACC-${year}-0001`);
        }
      } catch {
        const year = new Date().getFullYear();
        setDepositNumber(`ACC-${year}-0001`);
      }

      // 2. Infos société depuis localStorage
      try {
        const saved = localStorage.getItem("facturflow_company");
        if (saved) setCompanyInfo(JSON.parse(saved) as CompanyInfo);
      } catch {
        // ignore
      }

      // 3. Dates par défaut — shouldValidate: false pour ne pas déclencher
      //    la validation sur les autres champs vides (description, clientId…)
      form.setValue("date", todayISO(), { shouldValidate: false });
      form.setValue("dueDate", dueDateISO(), { shouldValidate: false });

      setMounted(true);
    }

    init();
  }, [form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfo(data);
    localStorage.setItem("facturflow_company", JSON.stringify(data));
  }, []);

  // ─── Auto-save en DB toutes les 30s ─────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!mounted) return;

    intervalRef.current = setInterval(async () => {
      const values = form.getValues();
      // Vérifier qu'il y a du contenu à sauvegarder
      const hasContent = values.amount && values.amount > 0 && values.description;
      // Ne sauvegarder que si un client est sélectionné (requis par la DB)
      const hasClient = values.clientId;
      if (!hasContent || !hasClient) return;

      try {
        const result = await saveDraft.mutateAsync({
          data: values as DepositFormData,
          draftId: draftIdRef.current,
        });
        if (result.success && result.data) {
          draftIdRef.current = result.data.id;
          setLastSaved(new Date());
        } else if (!result.success) {
          // Log pour debug — l'erreur est silencieuse côté UI
          console.warn("[Auto-save] Échec:", result.error);
        }
      } catch (error) {
        console.warn("[Auto-save] Erreur:", error);
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [form, saveDraft, mounted]);

  // ─── Submit : créer l'acompte en DB ──────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: DepositFormData) => {
      try {
        const result = await createDeposit.mutateAsync({
          data,
          draftId: draftIdRef.current,
        });
        
        if (result.success && result.data) {
          toast.success("Acompte créé !");
          
          // Rediriger vers la page des acomptes avec la modal ouverte
          setTimeout(() => {
            router.push(`/dashboard/deposits?preview=${result.data.id}`);
          }, 100);
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      } catch {
        toast.error("Erreur lors de la création");
      }
    },
    [router, createDeposit]
  );

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
        <div className="h-[600px] bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
        >
          <Link href="/dashboard/deposits">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Nouvel acompte
          </h1>
          <p className="text-sm text-slate-500 dark:text-violet-400/60">
            {depositNumber}
            {lastSaved && (
              <span className="ml-2 text-xs text-emerald-500 dark:text-emerald-400">
                · Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Desktop : split screen */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
            <DepositForm
              form={form}
              onSubmit={onSubmit}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={createDeposit.isPending}
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <DepositPreview
            form={form}
            depositNumber={depositNumber}
            companyInfo={companyInfo}
          />
        </div>
      </div>

      {/* Mobile : form simple */}
      <div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh] p-6">
        <DepositForm
          form={form}
          onSubmit={onSubmit}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          isSubmitting={createDeposit.isPending}
        />
      </div>
    </div>
  );
}

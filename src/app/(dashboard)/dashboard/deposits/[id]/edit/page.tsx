"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepositForm } from "@/components/acomptes/deposit-form";
import { DepositPreview } from "@/components/acomptes/deposit-preview";
import { z } from "zod";
import { getDeposit } from "@/lib/actions/deposits";
import { useUpdateDeposit, type SavedDeposit } from "@/hooks/use-deposits";
import type { CompanyInfo } from "@/lib/validations/invoice";
import { useCompanyInfoForForms } from "@/hooks/use-company";
import { useAppearance } from "@/hooks/use-appearance";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewDeposit } from "@/lib/utils/pdf-preview-helpers";
import DepositPdfDocument from "@/lib/pdf/deposit-pdf-document";

// ─── Schema local ─────────────────────────────────────────────────────────────

const depositFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  customNumber: z.string().optional(), // Numéro personnalisé (pré-rempli auto, éditable)
  amount: z.number().min(0.01, "Montant requis"),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
  date: z.string().min(1, "Date requise"),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  description: z.string().min(1, "Description requise"),
  notes: z.string().optional(),
  paymentLinks: z.object({
    stripe: z.boolean(),
    paypal: z.boolean(),
    gocardless: z.boolean(),
  }),
});

type DepositFormData = z.infer<typeof depositFormSchema>;

// ─── Mapping DB → valeurs du formulaire ───────────────────────────────────────

const VAT_RATES = [0, 5.5, 10, 20] as const;
type VatRate = (typeof VAT_RATES)[number];

function extractVatRate(vatRate: number): VatRate {
  if ((VAT_RATES as readonly number[]).includes(vatRate)) {
    return vatRate as VatRate;
  }
  return 20;
}

function toFormValues(d: SavedDeposit): Partial<DepositFormData> {
  return {
    clientId: d.clientId,
    customNumber: d.number, // Pré-remplir avec le numéro existant (éditable)
    amount: d.amount,
    vatRate: extractVatRate(d.vatRate),
    date: d.date.split("T")[0],
    dueDate: d.dueDate ? d.dueDate.split("T")[0] : "",
    description: d.description,
    notes: d.notes || "",
    paymentLinks: d.paymentLinks || {
      stripe: true,
      paypal: true,
      gocardless: true,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditDepositPage() {
  const params = useParams();
  const router = useRouter();
  const depositId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(""); // Suit le numéro éditable
  const { themeColor, companyFont, companyLogo, invoiceFooter } = useAppearance();
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const { data: subData } = useQuery({ queryKey: ["subscription"], queryFn: getCurrentSubscription, staleTime: 5 * 60 * 1000 });
  const effectivePlan = subData?.success ? subData.data.effectivePlan : "FREE";
  const { data: clients = [] } = useClients();
  const [deposit, setDeposit] = useState<SavedDeposit | null>(null);
  const [companyInfoLocal, setCompanyInfoLocal] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les infos company depuis la DB
  const { data: companyInfoDB } = useCompanyInfoForForms();
  const companyInfo = companyInfoLocal ?? companyInfoDB ?? null;

  const updateMutation = useUpdateDeposit();

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
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
        paypal: true,
        gocardless: true,
      },
    },
  });

  // Charger l'acompte et pré-remplir le formulaire
  useEffect(() => {
    async function loadDeposit() {
      if (!depositId) return;

      try {
        const result = await getDeposit(depositId);
        if (!result.success || !result.data) {
          router.push("/dashboard/deposits");
          return;
        }

        const depositData = result.data;
        setDeposit(depositData);

        // Pré-remplir le formulaire
        const formValues = toFormValues(depositData);
        setDisplayNumber(depositData.number);
        Object.entries(formValues).forEach(([key, value]) => {
          if (value !== undefined) {
            form.setValue(key as keyof DepositFormData, value as any, {
              shouldValidate: false,
            });
          }
        });

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
        router.push("/dashboard/deposits");
      }
    }

    loadDeposit();
  }, [depositId, form, router]);

  // Marquer comme monté (les infos company sont chargées via useCompanyInfoForForms)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfoLocal(data);
  }, []);

  const getDocumentForPreview = useCallback(() => {
    const values = form.getValues();
    const mock = buildPreviewDeposit(values, deposit?.number ?? "", companyInfo, { themeColor, companyFont, companyLogo, invoiceFooter }, []);
    return <DepositPdfDocument deposit={mock} />;
  }, [form, deposit, companyInfo, themeColor, companyFont, companyLogo, invoiceFooter]);

  const onSubmit = useCallback(
    async (data: DepositFormData) => {
      if (!deposit) return;

      await updateMutation.mutateAsync({
        id: deposit.id,
        ...data,
      });

      router.push("/dashboard/deposits");
    },
    [deposit, updateMutation, router]
  );

  if (!mounted || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
        <div className="h-[600px] bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
      </div>
    );
  }

  if (!deposit) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
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
            Modifier l&apos;acompte
          </h1>
          <p className="text-sm text-slate-500 dark:text-violet-400/60">
            {deposit.number}
          </p>
        </div>
      </div>

      {/* Desktop: split screen */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
            <DepositForm
              form={form}
              onSubmit={onSubmit}
              depositNumber={displayNumber || deposit.number}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={updateMutation.isPending}
              submitLabel="Sauvegarder"
              effectivePlan={effectivePlan}
              onPdfPreview={() => setIsPdfPreviewOpen(true)}
              onNumberChange={(n) => setDisplayNumber(n)}
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <DepositPreview
            form={form}
            depositNumber={displayNumber || deposit.number}
            companyInfo={companyInfo}
          />
        </div>
      </div>

      {/* Mobile: formulaire simple */}
      <div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh] p-6">
        <DepositForm
          form={form}
          onSubmit={onSubmit}
          depositNumber={deposit.number}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          isSubmitting={updateMutation.isPending}
          submitLabel="Sauvegarder"
          effectivePlan={effectivePlan}
          onPdfPreview={() => setIsPdfPreviewOpen(true)}
          onNumberChange={(n) => setDisplayNumber(n)}
        />
      </div>
      <PdfPreviewModal
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        getDocument={getDocumentForPreview}
        filename={`${displayNumber || deposit?.number || "acompte"}.pdf`}
        title="Aperçu PDF — Acompte"
      />
    </div>
  );
}
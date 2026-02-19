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

// ─── Schema local ─────────────────────────────────────────────────────────────

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
    amount: d.amount,
    vatRate: extractVatRate(d.vatRate),
    date: d.date.split("T")[0],
    dueDate: d.dueDate ? d.dueDate.split("T")[0] : "",
    description: d.description,
    notes: d.notes || "",
    paymentLinks: d.paymentLinks || {
      stripe: true,
      paypal: true,
      sepa: true,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditDepositPage() {
  const params = useParams();
  const router = useRouter();
  const depositId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [deposit, setDeposit] = useState<SavedDeposit | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
        sepa: true,
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

  // Charger les infos société
  useEffect(() => {
    try {
      const saved = localStorage.getItem("facturflow_company");
      if (saved) {
        setCompanyInfo(JSON.parse(saved) as CompanyInfo);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfo(data);
    localStorage.setItem("facturflow_company", JSON.stringify(data));
  }, []);

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
              depositNumber={deposit.number}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={updateMutation.isPending}
              submitLabel="Sauvegarder"
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <DepositPreview
            form={form}
            depositNumber={deposit.number}
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
        />
      </div>
    </div>
  );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepositForm } from "@/components/acomptes/deposit-form";
import { DepositPreview } from "@/components/acomptes/deposit-preview";
import { z } from "zod";
import type { CompanyInfo } from "@/lib/validations/invoice";

// Schema simplifié pour les acomptes
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

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function NewDepositPage() {
  const [mounted, setMounted] = useState(false);
  const [depositNumber, setDepositNumber] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    mode: "onChange",
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

  // Init client-only
  useEffect(() => {
    const initializeForm = async () => {
      // 1. Générer le numéro d'acompte
      const year = new Date().getFullYear();
      setDepositNumber(`ACC-${year}-0001`); // TODO: Récupérer depuis la DB

      // 2. Charger les infos société depuis localStorage
      try {
        const savedCompany = localStorage.getItem("facturflow_company");
        if (savedCompany) setCompanyInfo(JSON.parse(savedCompany) as CompanyInfo);
      } catch {
        // ignore
      }

      // 3. Initialiser les dates
      form.setValue("date", todayISO());
      form.setValue("dueDate", dueDateISO());

      setMounted(true);
    };

    initializeForm();
  }, [form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfo(data);
    localStorage.setItem("facturflow_company", JSON.stringify(data));
  }, []);

  const onSubmit = useCallback((data: DepositFormData) => {
    console.log("Données acompte:", data);
    // TODO: Implémenter la création d'acompte
  }, []);

  // Skeleton pendant le montage
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
            {depositNumber || "Chargement…"}
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
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={false}
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

      {/* Mobile: form simple */}
      <div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh] p-6">
        <DepositForm
          form={form}
          onSubmit={onSubmit}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          isSubmitting={false}
        />
      </div>
    </div>
  );
}
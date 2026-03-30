"use client";
// src/app/(dashboard)/dashboard/purchase-orders/new/page.tsx
// Page de création d'un bon de commande

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { PurchaseOrderPreview } from "@/components/purchase-orders/purchase-order-preview";
import { PurchaseOrderStepper } from "@/components/purchase-orders/purchase-order-stepper";
import {
  purchaseOrderFormSchema,
  type PurchaseOrderFormData,
  type CompanyInfo,
} from "@/lib/validations/purchase-order";
import { useAppearance } from "@/hooks/use-appearance";
import { useCompanyInfoForForms } from "@/hooks/use-company";

// TODO: brancher sur les hooks et actions backend une fois l'agent backend terminé
// import { getNextPurchaseOrderNumber, saveDraftPurchaseOrder } from "@/lib/actions/purchase-orders";
// import { useCreatePurchaseOrder } from "@/hooks/use-purchase-orders";

const AUTOSAVE_INTERVAL = 30_000;

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewPurchaseOrderPage() {
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [companyInfoLocal, setCompanyInfoLocal] = useState<CompanyInfo | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Infos entreprise depuis la DB
  const { data: companyInfoDB } = useCompanyInfoForForms();
  const companyInfo = companyInfoLocal ?? companyInfoDB ?? null;

  // Apparence
  const { companyFont, companyLogo, companyName } = useAppearance();

  // Ref pour le brouillon en cours
  const draftIdRef = useRef<string | undefined>(undefined);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderFormSchema),
    mode: "onChange",
    defaultValues: {
      clientId: "",
      date: "",
      deliveryDate: "",
      bcReference: "",
      orderType: "basic",
      lines: [{ description: "", quantity: 1, unitPrice: 0 }],
      vatRate: 20,
      discountType: undefined,
      discountValue: 0,
      notes: "",
    },
  });

  // ─── Init client-only ──────────────────────────────────────────────────────
  useEffect(() => {
    // TODO: remplacer par getNextPurchaseOrderNumber() une fois le backend créé
    const year = new Date().getFullYear();
    setOrderNumber(`BC-${year}-0001`);

    // Initialiser la date d'émission
    form.setValue("date", todayISO());

    setMounted(true);
  }, [form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfoLocal(data);
  }, []);

  // ─── Auto-save silencieux toutes les 30s ──────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!mounted) return;

    intervalRef.current = setInterval(async () => {
      const values = form.getValues();
      const hasContent = values.lines?.some((l) => l.description?.trim());
      const hasClient  = values.clientId || values.newClient;
      if (!hasContent || !hasClient) return;

      // TODO: brancher sur saveDraftPurchaseOrder(values, draftIdRef.current)
      console.log("[Auto-save BC] Données prêtes, en attente du backend");
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [form, mounted]);

  // ─── Submit : créer le BC en DB ────────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: PurchaseOrderFormData) => {
      setIsSubmitting(true);
      // TODO: brancher sur createMutation.mutate({ data, draftId: draftIdRef.current })
      console.log("[NewPurchaseOrder] Submit:", data);
      setIsSubmitting(false);
    },
    [],
  );

  // ─── Skeleton pendant le montage ──────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-teal-900/30 rounded-lg" />
        <div className="h-[600px] bg-slate-200 dark:bg-teal-900/30 rounded-2xl" />
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
          className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-500/10 transition-all duration-300 cursor-pointer"
        >
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Nouveau bon de commande
          </h1>
          <p className="text-sm text-slate-500 dark:text-teal-400/60">
            {orderNumber || "Chargement…"}
            {lastSaved && (
              <span className="ml-2 text-xs text-teal-500 dark:text-teal-400">
                · Sauvegardé à{" "}
                {lastSaved.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Desktop : split screen formulaire + aperçu */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-teal-300/80 dark:border-teal-500/20 shadow-lg shadow-teal-100/50 dark:shadow-teal-950/40 bg-white/75 dark:bg-[#061a1a] backdrop-blur-lg p-6">
            <PurchaseOrderForm
              form={form}
              onSubmit={onSubmit}
              orderNumber={orderNumber}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <PurchaseOrderPreview
            form={form}
            orderNumber={orderNumber}
            companyInfo={companyInfo}
            companyFont={companyFont}
            companyLogo={companyLogo}
            companyName={companyName}
          />
        </div>
      </div>

      {/* Mobile : stepper */}
      <div className="lg:hidden rounded-2xl border border-teal-300/80 dark:border-teal-500/20 bg-white/75 dark:bg-[#061a1a] backdrop-blur-lg shadow-lg shadow-teal-100/50 dark:shadow-teal-950/40 min-h-[70vh]">
        <PurchaseOrderStepper
          form={form}
          onSubmit={onSubmit}
          orderNumber={orderNumber}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          companyFont={companyFont}
          companyLogo={companyLogo}
          companyName={companyName}
        />
      </div>
    </div>
  );
}

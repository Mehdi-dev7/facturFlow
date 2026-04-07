"use client";
// src/app/(dashboard)/dashboard/purchase-orders/new/page.tsx
// Page de création d'un bon de commande

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye } from "lucide-react";
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
import { useCreatePurchaseOrder } from "@/hooks/use-purchase-orders";
import { getNextPurchaseOrderNumber, saveDraftPurchaseOrder } from "@/lib/actions/purchase-orders";
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewPurchaseOrder } from "@/lib/utils/pdf-preview-helpers";
import PurchaseOrderPdfDocument from "@/lib/pdf/purchase-order-pdf-document";

const AUTOSAVE_INTERVAL = 30_000;

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewPurchaseOrderPage() {
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [companyInfoLocal, setCompanyInfoLocal] = useState<CompanyInfo | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Infos entreprise depuis la DB
  const { data: companyInfoDB } = useCompanyInfoForForms();
  const companyInfo = companyInfoLocal ?? companyInfoDB ?? null;

  // Apparence
  const { themeColor, companyFont, companyLogo, companyName } = useAppearance();

  const { data: clients = [] } = useClients();
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Mutation création
  const createMutation = useCreatePurchaseOrder();
  const isSubmitting = createMutation.isPending;

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

  // ─── Init client-only : récupère le vrai numéro depuis la DB ─────────────
  useEffect(() => {
    getNextPurchaseOrderNumber().then((res) => {
      if (res.success) setOrderNumber(res.data.number);
      else {
        // fallback si l'action échoue
        setOrderNumber(`BC-${new Date().getFullYear()}-0001`);
      }
    });

    form.setValue("date", todayISO());
    setMounted(true);
  }, [form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfoLocal(data);
  }, []);

  // Génère le document PDF à la volée pour la prévisualisation
  const getDocumentForPreview = useCallback(() => {
    const values = form.getValues();
    const mock = buildPreviewPurchaseOrder(values, orderNumber, companyInfo, { themeColor, companyFont, companyLogo }, clients);
    return <PurchaseOrderPdfDocument purchaseOrder={mock} />;
  }, [form, orderNumber, companyInfo, themeColor, companyFont, companyLogo, clients]);

  // ─── Auto-save silencieux toutes les 30s ──────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!mounted) return;

    intervalRef.current = setInterval(async () => {
      const values = form.getValues();
      const hasContent = values.lines?.some((l) => l.description?.trim());
      const hasClient  = values.clientId || values.newClient;
      if (!hasContent || !hasClient) return;

      const res = await saveDraftPurchaseOrder(values, draftIdRef.current);
      if (res.success && res.data?.id) {
        draftIdRef.current = res.data.id;
        setLastSaved(new Date());
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [form, mounted]);

  // ─── Submit : créer le BC en DB ────────────────────────────────────────────
  const onSubmit = useCallback(
    (data: PurchaseOrderFormData) => {
      createMutation.mutate({ data, draftId: draftIdRef.current });
    },
    [createMutation],
  );

  // ─── Skeleton pendant le montage ──────────────────────────────────────────
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
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Nouveau bon de commande
          </h1>
          <p className="text-sm text-slate-500 dark:text-violet-400/60">
            {orderNumber || "Chargement…"}
            {lastSaved && (
              <span className="ml-2 text-xs text-emerald-500 dark:text-emerald-400">
                · Sauvegardé à{" "}
                {lastSaved.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        {/* Bouton aperçu PDF — masqué sur mobile */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPdfPreviewOpen(true)}
          className="gap-1.5 text-xs cursor-pointer hidden sm:flex"
        >
          <Eye size={14} />
          Aperçu PDF
        </Button>
      </div>

      {/* Desktop : split screen formulaire + aperçu */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
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
            themeColor={themeColor}
            companyFont={companyFont}
            companyLogo={companyLogo}
            companyName={companyName}
          />
        </div>
      </div>

      {/* Mobile : stepper */}
      <div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
        <PurchaseOrderStepper
          form={form}
          onSubmit={onSubmit}
          orderNumber={orderNumber}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          themeColor={themeColor}
          companyFont={companyFont}
          companyLogo={companyLogo}
          companyName={companyName}
        />
      </div>

      {/* Modale d'aperçu PDF généré à la volée */}
      <PdfPreviewModal
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        getDocument={getDocumentForPreview}
        filename={`${orderNumber}.pdf`}
        title="Aperçu PDF — Bon de commande"
      />
    </div>
  );
}

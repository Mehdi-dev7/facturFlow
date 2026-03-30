"use client";
// src/app/(dashboard)/dashboard/purchase-orders/[id]/edit/page.tsx
// Page d'édition d'un bon de commande existant

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  INVOICE_TYPES,
} from "@/lib/validations/purchase-order";
import { useAppearance } from "@/hooks/use-appearance";
import type { SavedPurchaseOrder } from "@/lib/pdf/purchase-order-pdf-document";

// TODO: brancher sur les hooks et actions backend une fois l'agent backend terminé
// import { getPurchaseOrder } from "@/lib/actions/purchase-orders";
// import { useUpdatePurchaseOrder } from "@/hooks/use-purchase-orders";

// ─── Mapping DB → valeurs du formulaire ───────────────────────────────────────

const VAT_RATES_ALLOWED = [0, 5.5, 10, 20] as const;
type VatRate = (typeof VAT_RATES_ALLOWED)[number];

function extractVatRate(meta: Record<string, unknown> | null): VatRate {
  const raw = meta?.vatRate;
  if (typeof raw === "number" && (VAT_RATES_ALLOWED as readonly number[]).includes(raw)) {
    return raw as VatRate;
  }
  return 20;
}

function toFormValues(po: SavedPurchaseOrder): Partial<PurchaseOrderFormData> {
  const rawOrderType = po.invoiceType ?? "basic";
  const orderType = (
    INVOICE_TYPES.includes(rawOrderType as (typeof INVOICE_TYPES)[number])
      ? rawOrderType
      : "basic"
  ) as (typeof INVOICE_TYPES)[number];

  const sortedLines = [...po.lineItems].sort((a, b) => a.order - b.order);

  return {
    clientId: po.client.id,
    date: po.date.split("T")[0],
    deliveryDate: po.deliveryDate ? po.deliveryDate.split("T")[0] : "",
    bcReference: po.bcReference ?? "",
    orderType,
    lines: sortedLines.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      category:
        li.category === "main_oeuvre" || li.category === "materiel"
          ? li.category
          : undefined,
    })),
    vatRate: extractVatRate(po.businessMetadata),
    discountType: undefined, // TODO: stocker discountType en DB si besoin
    discountValue: po.discount ?? 0,
    notes: po.notes ?? "",
  };
}

function toCompanyInfo(user: SavedPurchaseOrder["user"]): CompanyInfo | null {
  if (!user.companyName) return null;
  return {
    name: user.companyName,
    siret: user.companySiret ?? "",
    address: user.companyAddress ?? "",
    city: user.companyCity ?? "",
    email: user.companyEmail ?? "",
    phone: user.companyPhone ?? undefined,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyFont, companyLogo, companyName } = useAppearance();
  const [purchaseOrder, setPurchaseOrder] = useState<SavedPurchaseOrder | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // ─── Chargement initial du BC ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    // TODO: remplacer par getPurchaseOrder(id) une fois le backend créé
    // getPurchaseOrder(id).then((result) => { ... })

    // Simulation de chargement pour l'instant
    console.log("[EditPurchaseOrder] TODO: charger le BC avec id:", id);
    setLoadError("Backend en attente — hook use-purchase-orders à créer.");

    setMounted(true);
  }, [id, form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfo(data);
  }, []);

  // ─── Submit : mettre à jour le BC ─────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: PurchaseOrderFormData) => {
      if (!id) return;
      setIsSubmitting(true);
      // TODO: brancher sur updateMutation.mutate({ id, data })
      console.log("[EditPurchaseOrder] Submit:", data);
      router.push(`/dashboard/purchase-orders?preview=${id}`);
      setIsSubmitting(false);
    },
    [id, router],
  );

  // ─── Skeleton ─────────────────────────────────────────────────────────────
  if (!mounted || (!purchaseOrder && !loadError)) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-teal-900/30 rounded-lg" />
        <div className="h-150 bg-slate-200 dark:bg-teal-900/30 rounded-2xl" />
      </div>
    );
  }

  // ─── Erreur de chargement ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-amber-500 font-medium text-center max-w-md">{loadError}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/purchase-orders">Retour aux bons de commande</Link>
        </Button>
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
            Modifier le bon de commande
          </h1>
          <p className="text-sm text-slate-500 dark:text-teal-400/60">
            {purchaseOrder?.number}
          </p>
        </div>
      </div>

      {/* Desktop : split screen */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-teal-300/80 dark:border-teal-500/20 shadow-lg shadow-teal-100/50 dark:shadow-teal-950/40 bg-white/75 dark:bg-[#061a1a] backdrop-blur-lg p-6">
            <PurchaseOrderForm
              form={form}
              onSubmit={onSubmit}
              orderNumber={purchaseOrder?.number ?? ""}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <PurchaseOrderPreview
            form={form}
            orderNumber={purchaseOrder?.number ?? ""}
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
          orderNumber={purchaseOrder?.number ?? ""}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          submitLabel="Sauvegarder"
          companyFont={companyFont}
          companyLogo={companyLogo}
          companyName={companyName}
        />
      </div>
    </div>
  );
}

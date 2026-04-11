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
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewPurchaseOrder } from "@/lib/utils/pdf-preview-helpers";
import PurchaseOrderPdfDocument from "@/lib/pdf/purchase-order-pdf-document";
import { getPurchaseOrder, type SavedPurchaseOrder } from "@/lib/actions/purchase-orders";
import { useUpdatePurchaseOrder } from "@/hooks/use-purchase-orders";

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
    customNumber: po.number, // Pré-remplir avec le numéro existant (éditable)
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
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const { themeColor, companyFont, companyLogo, companyName, currency, headerTextColor} = useAppearance();
  const { data: clients = [] } = useClients();
  const [purchaseOrder, setPurchaseOrder] = useState<SavedPurchaseOrder | null>(null);
  const [displayNumber, setDisplayNumber] = useState(""); // Suit le numéro éditable
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const updateMutation = useUpdatePurchaseOrder();

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

    getPurchaseOrder(id).then((result) => {
      if (result.success && result.data) {
        const po = result.data;
        setPurchaseOrder(po);
        form.reset(toFormValues(po));
        setDisplayNumber(po.number);
        const dbCompany = toCompanyInfo(po.user);
        if (dbCompany) setCompanyInfo(dbCompany);
      } else {
        setLoadError(result.error ?? "Bon de commande introuvable");
      }
    });

    setMounted(true);
  }, [id, form]);

  const handleCompanyChange = useCallback((data: CompanyInfo) => {
    setCompanyInfo(data);
  }, []);

  const getDocumentForPreview = useCallback(() => {
    const values = form.getValues();
    const mock = buildPreviewPurchaseOrder(values, purchaseOrder?.number ?? "", companyInfo, { themeColor, companyFont, companyLogo , currency, headerTextColor}, clients);
    return <PurchaseOrderPdfDocument purchaseOrder={mock} />;
  }, [form, purchaseOrder, companyInfo, themeColor, companyFont, companyLogo, clients]);

  // ─── Submit : mettre à jour le BC ─────────────────────────────────────────
  const onSubmit = useCallback(
    (data: PurchaseOrderFormData) => {
      if (!id) return;
      updateMutation.mutate(
        { id, data },
        {
          onSuccess: (result) => {
            if (result.success) {
              router.push(`/dashboard/purchase-orders?preview=${id}`);
            }
          },
        },
      );
    },
    [id, updateMutation, router],
  );

  // ─── Skeleton ─────────────────────────────────────────────────────────────
  if (!mounted || (!purchaseOrder && !loadError)) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
        <div className="h-150 bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
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
          className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
        >
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Modifier le bon de commande
          </h1>
          <p className="text-sm text-slate-500 dark:text-violet-400/60">
            {purchaseOrder?.number}
          </p>
        </div>
      </div>

      {/* Desktop : split screen */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
            <PurchaseOrderForm
              form={form}
              onSubmit={onSubmit}
              onNumberChange={(n) => setDisplayNumber(n)}
              orderNumber={displayNumber || purchaseOrder?.number || ""}
              companyInfo={companyInfo}
              onCompanyChange={handleCompanyChange}
              isSubmitting={updateMutation.isPending}
              submitLabel="Modifier le bon de commande"
              onPdfPreview={() => setIsPdfPreviewOpen(true)}
            />
          </div>
        </div>
        <div className="sticky top-6 self-start">
          <PurchaseOrderPreview
            form={form}
            orderNumber={displayNumber || purchaseOrder?.number || ""}
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
          orderNumber={displayNumber || purchaseOrder?.number || ""}
          companyInfo={companyInfo}
          onCompanyChange={handleCompanyChange}
          submitLabel="Modifier le bon de commande"
          themeColor={themeColor}
          companyFont={companyFont}
          companyLogo={companyLogo}
          companyName={companyName}
        />
      </div>
      <PdfPreviewModal
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        getDocument={getDocumentForPreview}
        filename={`${purchaseOrder?.number ?? "bon-de-commande"}.pdf`}
        title="Aperçu PDF — Bon de commande"
      />
    </div>
  );
}

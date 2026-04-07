"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/factures/invoice-form";
import { InvoicePreview } from "@/components/factures/invoice-preview";
import { InvoiceStepper } from "@/components/factures/invoice-stepper";
import {
	invoiceFormSchema,
	type InvoiceFormData,
	type CompanyInfo,
	INVOICE_TYPES,
	VAT_RATES,
} from "@/lib/validations/invoice";
import { getProforma } from "@/lib/actions/proformas";
import {
	useUpdateProforma,
	useCreateProforma,
	type SavedProforma,
} from "@/hooks/use-proformas";
import { useAppearance } from "@/hooks/use-appearance";
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewInvoice } from "@/lib/utils/pdf-preview-helpers";
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/lib/actions/subscription";

// ─── Mapping DB → valeurs du formulaire ───────────────────────────────────────

function toFormValues(p: SavedProforma): Partial<InvoiceFormData> {
	const meta = p.businessMetadata ?? {};
	const rawVatRate = (meta.vatRate as number) ?? 20;
	const vatRate = (
		VAT_RATES.includes(rawVatRate as (typeof VAT_RATES)[number])
			? rawVatRate
			: 20
	) as (typeof VAT_RATES)[number];

	const rawInvoiceType = p.invoiceType ?? "basic";
	const invoiceType = (
		INVOICE_TYPES.includes(rawInvoiceType as (typeof INVOICE_TYPES)[number])
			? rawInvoiceType
			: "basic"
	) as (typeof INVOICE_TYPES)[number];

	const sortedLines = [...p.lineItems].sort((a, b) => a.order - b.order);

	return {
		clientId: p.client.id,
		date: p.date.split("T")[0],
		dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
		invoiceType,
		lines: sortedLines.map((li) => ({
			description: li.description,
			quantity: li.quantity,
			unitPrice: li.unitPrice,
			category:
				li.category === "main_oeuvre" || li.category === "materiel"
					? li.category
					: undefined,
		})),
		vatRate,
		discountType:
			p.discountType === "pourcentage" || p.discountType === "montant"
				? p.discountType
				: undefined,
		discountValue: p.discount ?? 0,
		depositAmount: p.depositAmount ?? 0,
		notes: p.notes ?? "",
	};
}

function toCompanyInfo(
	user: SavedProforma["user"],
): CompanyInfo | null {
	if (!user.companyName || !user.companySiret || !user.companyEmail)
		return null;
	return {
		name: user.companyName,
		siret: user.companySiret,
		address: user.companyAddress ?? "",
		zipCode: user.companyPostalCode ?? undefined,
		city: user.companyCity ?? "",
		email: user.companyEmail,
		phone: user.companyPhone ?? undefined,
	};
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EditProformaPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
	const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
	const { themeColor, companyFont, companyLogo, companyName, invoiceFooter } = useAppearance();
	const { data: subData } = useQuery({ queryKey: ["subscription"], queryFn: getCurrentSubscription, staleTime: 5 * 60 * 1000 });
	const effectivePlan = subData?.success ? subData.data.effectivePlan : "FREE";
	const { data: clients = [] } = useClients();
	const [proforma, setProforma] = useState<SavedProforma | null>(null);
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const updateMutation = useUpdateProforma();
	// Utilisé pour convertir un brouillon en proforma officielle
	const createMutation = useCreateProforma();

	const form = useForm<InvoiceFormData>({
		resolver: zodResolver(invoiceFormSchema),
		mode: "onChange",
		defaultValues: {
			clientId: "",
			date: "",
			dueDate: "",
			invoiceType: "basic",
			lines: [{ description: "", quantity: 1, unitPrice: 0 }],
			vatRate: 20,
			discountType: undefined,
			discountValue: 0,
			depositAmount: 0,
			notes: "",
		},
	});

	// ─── Chargement initial ───────────────────────────────────────────────────
	useEffect(() => {
		if (!id) return;

		getProforma(id).then((result) => {
			if (result.success && result.data) {
				const p = result.data;
				setProforma(p);
				form.reset(toFormValues(p));
				const dbCompany = toCompanyInfo(p.user);
				if (dbCompany) setCompanyInfo(dbCompany);
			} else {
				setLoadError(result.error ?? "Proforma introuvable");
			}
		});

		setMounted(true);
	}, [id, form]);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfo(data);
	}, []);

	const getDocumentForPreview = useCallback(() => {
		const values = form.getValues();
		const mock = buildPreviewInvoice(values, proforma?.number ?? "", companyInfo, { themeColor, companyFont, companyLogo, invoiceFooter }, clients);
		return <InvoicePdfDocument invoice={mock} documentLabel="PROFORMA" />;
	}, [form, proforma, companyInfo, themeColor, companyFont, companyLogo, clients]);

	// Brouillon temporaire → créer avec numéro officiel ; sinon mettre à jour
	const isDraft = proforma?.status === "DRAFT";

	const onSubmit = useCallback(
		(data: InvoiceFormData) => {
			if (!id) return;

			if (isDraft) {
				createMutation.mutate({ data, draftId: id });
			} else {
				updateMutation.mutate(
					{ id, data },
					{
						onSuccess: (result) => {
							if (result.success) {
								router.push(`/dashboard/proformas?preview=${id}`);
							}
						},
					},
				);
			}
		},
		[id, isDraft, createMutation, updateMutation, router],
	);

	// ─── Skeleton ─────────────────────────────────────────────────────────────
	if (!mounted || (!proforma && !loadError)) {
		return (
			<div className="animate-pulse space-y-6">
				<div className="h-8 w-48 bg-slate-200 dark:bg-violet-900/30 rounded-lg" />
				<div className="h-150 bg-slate-200 dark:bg-violet-900/30 rounded-2xl" />
			</div>
		);
	}

	// ─── Erreur ───────────────────────────────────────────────────────────────
	if (loadError) {
		return (
			<div className="flex flex-col items-center justify-center py-24 gap-4">
				<p className="text-red-500 font-medium">{loadError}</p>
				<Button asChild variant="outline">
					<Link href="/dashboard/proformas">Retour aux proformas</Link>
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
					<Link href="/dashboard/proformas">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Modifier la proforma
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{proforma?.number}
					</p>
				</div>
			</div>

			{/* Desktop : split screen */}
			<div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
				<div className="space-y-4">
					<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
						<InvoiceForm
							form={form}
							onSubmit={onSubmit}
							invoiceNumber={proforma?.number ?? ""}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
							isSubmitting={
								updateMutation.isPending || createMutation.isPending
							}
							submitLabel={isDraft ? "Créer la proforma" : "Sauvegarder"}
							effectivePlan={effectivePlan}
							onPdfPreview={() => setIsPdfPreviewOpen(true)}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<InvoicePreview
						form={form}
						invoiceNumber={proforma?.number ?? ""}
						companyInfo={companyInfo}
						themeColor={themeColor}
						companyFont={companyFont}
						companyLogo={companyLogo}
						companyName={companyName}
					invoiceFooter={invoiceFooter}
					/>
				</div>
			</div>

			{/* Mobile : stepper */}
			<div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
				<InvoiceStepper
					form={form}
					onSubmit={onSubmit}
					invoiceNumber={proforma?.number ?? ""}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
					submitLabel={isDraft ? "Créer la proforma" : "Sauvegarder"}
					effectivePlan={effectivePlan}
					themeColor={themeColor}
					companyFont={companyFont}
					companyLogo={companyLogo}
					companyName={companyName}
				invoiceFooter={invoiceFooter}
				/>
			</div>

			<PdfPreviewModal
				open={isPdfPreviewOpen}
				onOpenChange={setIsPdfPreviewOpen}
				getDocument={getDocumentForPreview}
				filename={`${proforma?.number ?? "proforma"}.pdf`}
				title="Aperçu PDF — Proforma"
			/>
		</div>
	);
}

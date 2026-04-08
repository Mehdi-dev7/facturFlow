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
import { getInvoice } from "@/lib/actions/invoices";
import { useUpdateInvoice, useCreateInvoice, type SavedInvoice } from "@/hooks/use-invoices";
import { useAppearance } from "@/hooks/use-appearance";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewInvoice } from "@/lib/utils/pdf-preview-helpers";
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document";

// ─── Mapping DB → valeurs du formulaire ───────────────────────────────────────

function toFormValues(inv: SavedInvoice): Partial<InvoiceFormData> {
	const meta = inv.businessMetadata ?? {};
	const rawVatRate = (meta.vatRate as number) ?? 20;
	// S'assurer que le vatRate est une valeur autorisée
	const vatRate = (VAT_RATES.includes(rawVatRate as (typeof VAT_RATES)[number])
		? rawVatRate
		: 20) as (typeof VAT_RATES)[number];

	const rawVatMode = meta.vatMode as string | undefined;
	const vatMode: "global" | "per_line" = rawVatMode === "per_line" ? "per_line" : "global";

	const rawInvoiceType = inv.invoiceType ?? "basic";
	const invoiceType = (INVOICE_TYPES.includes(rawInvoiceType as (typeof INVOICE_TYPES)[number])
		? rawInvoiceType
		: "basic") as (typeof INVOICE_TYPES)[number];

	const sortedLines = [...inv.lineItems].sort((a, b) => a.order - b.order);

	// Rétrocompatibilité : anciens enregistrements stockaient "enabled"|"" (strings),
	// nouveaux stockent boolean. On normalise en boolean dans les deux cas.
	const rawLinks = meta.paymentLinks as Record<string, unknown> | undefined;
	const paymentLinks = rawLinks
		? {
			stripe: rawLinks.stripe === true || rawLinks.stripe === "enabled",
			paypal: rawLinks.paypal === true || rawLinks.paypal === "enabled",
			gocardless: rawLinks.gocardless === true || rawLinks.gocardless === "enabled",
		  }
		: undefined;

	return {
		clientId: inv.client.id,
		customNumber: inv.number, // Pré-remplir avec le numéro existant (éditable)
		date: inv.date.split("T")[0], // ISO → YYYY-MM-DD
		dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
		invoiceType,
		lines: sortedLines.map((li) => ({
			description: li.description,
			quantity: li.quantity,
			unitPrice: li.unitPrice,
			category: (li.category === "main_oeuvre" || li.category === "materiel") ? li.category : undefined,
			// En mode per_line, charger le taux spécifique de chaque ligne
			vatRate: vatMode === "per_line"
				? (VAT_RATES.includes(li.vatRate as (typeof VAT_RATES)[number]) ? li.vatRate as (typeof VAT_RATES)[number] : undefined)
				: undefined,
		})),
		vatRate,
		vatMode,
		deliveryDate: (meta.deliveryDate as string | undefined) ?? "",
		discountType: (inv.discountType === "pourcentage" || inv.discountType === "montant") ? inv.discountType : undefined,
		discountValue: inv.discount ?? 0,
		depositAmount: inv.depositAmount ?? 0,
		notes: inv.notes ?? "",
		paymentLinks,
	};
}

function toCompanyInfo(user: SavedInvoice["user"]): CompanyInfo | null {
	if (!user.companyName || !user.companySiret || !user.companyEmail) return null;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditInvoicePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
	const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
	const { themeColor, companyFont, companyLogo, companyName, invoiceFooter } = useAppearance();
	const { data: subData } = useQuery({ queryKey: ["subscription"], queryFn: getCurrentSubscription, staleTime: 5 * 60 * 1000 });
	const effectivePlan = subData?.success ? subData.data.effectivePlan : "FREE";
	const { data: clients = [] } = useClients();
	const [invoice, setInvoice] = useState<SavedInvoice | null>(null);
	const [displayNumber, setDisplayNumber] = useState(""); // Suit le numéro éditable dans le form
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const updateMutation = useUpdateInvoice();
	const createMutation = useCreateInvoice(); // utilisé pour convertir un brouillon en facture officielle

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

	// ─── Chargement initial ──────────────────────────────────────────────────
	useEffect(() => {
		if (!id) return;

		getInvoice(id).then((result) => {
			if (result.success && result.data) {
				const inv = result.data;
				setInvoice(inv);

				// Pré-remplir le formulaire avec les données de la facture
				form.reset(toFormValues(inv));
				setDisplayNumber(inv.number);

				// Company info depuis la facture en DB
				const dbCompany = toCompanyInfo(inv.user);
				if (dbCompany) {
					setCompanyInfo(dbCompany);
				}
			} else {
				setLoadError(result.error ?? "Facture introuvable");
			}
		});

		setMounted(true);
	}, [id, form]);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfo(data);
	}, []);

	const getDocumentForPreview = useCallback(() => {
		const values = form.getValues();
		const mock = buildPreviewInvoice(values, displayNumber || invoice?.number || "", companyInfo, { themeColor, companyFont, companyLogo, invoiceFooter }, clients);
		return <InvoicePdfDocument invoice={mock} />;
	}, [form, invoice, companyInfo, themeColor, companyFont, companyLogo, clients]);

	// ─── Submit ──────────────────────────────────────────────────────────────
	// Brouillon → créer avec numéro officiel ; facture existante → mettre à jour
	const isDraft = invoice?.status === "DRAFT";

	const onSubmit = useCallback(
		(data: InvoiceFormData) => {
			if (!id) return;

			if (isDraft) {
				// Convertit le brouillon en facture officielle avec un nouveau numéro
				createMutation.mutate({ data, draftId: id });
			} else {
				updateMutation.mutate(
					{ id, data },
					{
						onSuccess: (result) => {
							if (result.success) {
								router.push(`/dashboard/invoices?preview=${id}`);
							}
						},
					},
				);
			}
		},
		[id, isDraft, createMutation, updateMutation, router],
	);

	// ─── Skeleton ─────────────────────────────────────────────────────────────
	if (!mounted || (!invoice && !loadError)) {
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
				<p className="text-red-500 font-medium">{loadError}</p>
				<Button asChild variant="outline">
					<Link href="/dashboard/invoices">Retour aux factures</Link>
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
					<Link href="/dashboard/invoices">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Modifier la facture
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{displayNumber || invoice?.number}
					</p>
				</div>
			</div>

			{/* Desktop: split screen */}
			<div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
				<div className="space-y-4">
					<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
						<InvoiceForm
							form={form}
							onSubmit={onSubmit}
							invoiceNumber={displayNumber || invoice?.number || ""}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
							isSubmitting={updateMutation.isPending || createMutation.isPending}
							submitLabel={isDraft ? "Créer la facture" : "Sauvegarder"}
							effectivePlan={effectivePlan}
							onPdfPreview={() => setIsPdfPreviewOpen(true)}
							onNumberChange={(n) => setDisplayNumber(n)}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<InvoicePreview
						form={form}
						invoiceNumber={displayNumber || invoice?.number || ""}
						companyInfo={companyInfo}
					
					themeColor={themeColor}
					companyFont={companyFont}
					companyLogo={companyLogo}
				companyName={companyName}
				invoiceFooter={invoiceFooter}
				/>
				</div>
			</div>

			{/* Mobile: stepper */}
			<div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
				<InvoiceStepper
					form={form}
					onSubmit={onSubmit}
					invoiceNumber={displayNumber || invoice?.number || ""}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
					submitLabel={isDraft ? "Créer la facture" : "Sauvegarder"}
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
				filename={`${displayNumber || invoice?.number || "facture"}.pdf`}
				title="Aperçu PDF — Facture"
			/>
		</div>
	);
}

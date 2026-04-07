"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/factures/invoice-form";
import { InvoicePreview } from "@/components/factures/invoice-preview";
import { InvoiceStepper } from "@/components/factures/invoice-stepper";
import {
	invoiceFormSchema,
	type InvoiceFormData,
	type CompanyInfo,
} from "@/lib/validations/invoice";
import { getNextProformaNumber, saveDraftProforma } from "@/lib/actions/proformas";
import { useCreateProforma } from "@/hooks/use-proformas";
import { useAppearance } from "@/hooks/use-appearance";
import { useCompanyInfoForForms } from "@/hooks/use-company";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/lib/actions/subscription";
import { useClients } from "@/hooks/use-clients";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { buildPreviewInvoice } from "@/lib/utils/pdf-preview-helpers";
import InvoicePdfDocument from "@/lib/pdf/invoice-pdf-document";

const AUTOSAVE_INTERVAL = 30_000;

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 30);
	return d.toISOString().split("T")[0];
}

export default function NewProformaPage() {
	const [mounted, setMounted] = useState(false);
	const [proformaNumber, setProformaNumber] = useState("");
	const [companyInfoLocal, setCompanyInfoLocal] = useState<CompanyInfo | null>(
		null,
	);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const { data: companyInfoDB } = useCompanyInfoForForms();
	const companyInfo = companyInfoLocal ?? companyInfoDB ?? null;

	const { themeColor, companyFont, companyLogo, companyName } = useAppearance();
	const { data: subData } = useQuery({ queryKey: ["subscription"], queryFn: getCurrentSubscription, staleTime: 5 * 60 * 1000 });
	const effectivePlan = subData?.success ? subData.data.effectivePlan : "FREE";
	const { data: clients = [] } = useClients();
	const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

	const createMutation = useCreateProforma();
	const draftIdRef = useRef<string | undefined>(undefined);

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

	// ─── Init client-only ─────────────────────────────────────────────────────
	useEffect(() => {
		// Récupérer le prochain numéro de proforma
		getNextProformaNumber().then((result) => {
			if (result.success && result.data) {
				setProformaNumber(result.data.number);
			} else {
				const year = new Date().getFullYear();
				setProformaNumber(`PRF-${year}-0001`);
			}
		});

		form.setValue("date", todayISO());
		form.setValue("dueDate", dueDateISO());
		setMounted(true);
	}, [form]);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfoLocal(data);
	}, []);

	// Génère le document PDF à la volée pour la prévisualisation
	const getDocumentForPreview = useCallback(() => {
		const values = form.getValues();
		const mock = buildPreviewInvoice(values, proformaNumber, companyInfo, { themeColor, companyFont, companyLogo }, clients);
		return <InvoicePdfDocument invoice={mock} documentLabel="PROFORMA" />;
	}, [form, proformaNumber, companyInfo, themeColor, companyFont, companyLogo, clients]);

	// ─── Auto-save toutes les 30s ─────────────────────────────────────────────
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
	useEffect(() => {
		if (!mounted) return;

		intervalRef.current = setInterval(async () => {
			const values = form.getValues();
			const hasContent = values.lines?.some((l) => l.description?.trim());
			const hasClient = values.clientId || values.newClient;
			if (!hasContent || !hasClient) return;

			try {
				const result = await saveDraftProforma(values, draftIdRef.current);
				if (result.success && result.data) {
					draftIdRef.current = result.data.id;
					setLastSaved(new Date());
				} else if (!result.success) {
					console.warn("[Auto-save] Échec:", result.error);
				}
			} catch (err) {
				console.warn("[Auto-save] Exception:", err);
			}
		}, AUTOSAVE_INTERVAL);

		return () => clearInterval(intervalRef.current);
	}, [form, mounted]);

	// ─── Submit ───────────────────────────────────────────────────────────────
	const onSubmit = useCallback(
		(data: InvoiceFormData) => {
			createMutation.mutate({ data, draftId: draftIdRef.current });
		},
		[createMutation],
	);

	// ─── Skeleton ─────────────────────────────────────────────────────────────
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
					<Link href="/dashboard/proformas">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Nouvelle proforma
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{proformaNumber || "Chargement…"}
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

			{/* Desktop : split screen */}
			<div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
				<div className="space-y-4">
					<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
						<InvoiceForm
							form={form}
							onSubmit={onSubmit}
							invoiceNumber={proformaNumber}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
							isSubmitting={createMutation.isPending}
							submitLabel="Créer la proforma"
							effectivePlan={effectivePlan}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<InvoicePreview
						form={form}
						invoiceNumber={proformaNumber}
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
				<InvoiceStepper
					form={form}
					onSubmit={onSubmit}
					invoiceNumber={proformaNumber}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
					effectivePlan={effectivePlan}
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
				filename={`${proformaNumber}.pdf`}
				title="Aperçu PDF — Proforma"
			/>
		</div>
	);
}

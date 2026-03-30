"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
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
} from "@/lib/validations/invoice";
import type { BcExtractedData } from "@/components/factures/bc-import-dialog";
import { BC_IMPORT_LS_KEY } from "@/components/factures/bc-import-dialog";
import { getNextInvoiceNumber, saveDraft } from "@/lib/actions/invoices";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useAppearance } from "@/hooks/use-appearance";
import { useCompanyInfoForForms } from "@/hooks/use-company";

const AUTOSAVE_INTERVAL = 30_000;

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 30);
	return d.toISOString().split("T")[0];
}

function NewInvoicePageContent() {
	const searchParams = useSearchParams();

	// Tout le state client-only initialisé dans useEffect pour éviter les hydration mismatches
	const [mounted, setMounted] = useState(false);
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [companyInfoLocal, setCompanyInfoLocal] = useState<CompanyInfo | null>(null);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Charger les infos company depuis la DB (source de vérité)
	const { data: companyInfoDB } = useCompanyInfoForForms();
	// Priorité : édition locale (modale) > DB > null
	const companyInfo = companyInfoLocal ?? companyInfoDB ?? null;

	// Mutation de création (gère toast + redirect auto vers /dashboard/invoices?preview=<id>)
		const { themeColor, companyFont, companyLogo, companyName } = useAppearance();

	const createMutation = useCreateInvoice();

	// Ref pour stocker l'ID du brouillon en cours de sauvegarde
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

	// ─── Init client-only ──────────────────────────────────────────────────────
	useEffect(() => {
		// 1. Récupérer le prochain numéro depuis la DB
		getNextInvoiceNumber().then((result) => {
			if (result.success && result.data) {
				setInvoiceNumber(result.data.number);
			} else {
				const year = new Date().getFullYear();
				setInvoiceNumber(`FAC-${year}-0001`);
			}
		});

		// 2. Initialiser les dates
		form.setValue("date", todayISO());
		form.setValue("dueDate", dueDateISO());

		// 3. Pré-remplissage depuis import BC externe (si ?from=bc dans l'URL)
		if (searchParams.get("from") === "bc") {
			try {
				const raw = localStorage.getItem(BC_IMPORT_LS_KEY);
				if (raw) {
					const bc = JSON.parse(raw) as BcExtractedData;

					// Lignes (au moins une ligne non vide)
					if (bc.lines?.length > 0) {
						form.setValue("lines", bc.lines.map((l) => ({
							description: l.description,
							quantity: l.quantity,
							unitPrice: l.unitPrice,
						})));
						// TVA : on prend celle de la première ligne (cast vers les taux valides)
						const rate = bc.lines[0].vatRate;
						if ([0, 5.5, 10, 20].includes(rate)) {
							form.setValue("vatRate", rate as 0 | 5.5 | 10 | 20);
						}
					}

					// Dates (si fournies par l'IA)
					if (bc.date) form.setValue("date", bc.date);
					if (bc.dueDate) form.setValue("dueDate", bc.dueDate);

					// Notes : référence BC + infos client non trouvé
					const notesParts: string[] = [];
					if (bc.bcReference) notesParts.push(`Réf. BC : ${bc.bcReference}`);
					if (bc.clientName && !bc.clientName.match(/^\s*$/)) notesParts.push(`Client : ${bc.clientName}`);
					if (bc.clientAddress) notesParts.push(bc.clientAddress);
					if (bc.notes) notesParts.push(bc.notes);
					if (notesParts.length > 0) form.setValue("notes", notesParts.join("\n"));

					// Nettoyer le localStorage après utilisation
					localStorage.removeItem(BC_IMPORT_LS_KEY);
				}
			} catch {
				// Ignorer les erreurs de parsing silencieusement
			}
		}

		setMounted(true);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfoLocal(data);
	}, []);

	// ─── Auto-save en DB toutes les 30s ───────────────────────────────────────
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
	useEffect(() => {
		if (!mounted) return;

		intervalRef.current = setInterval(async () => {
			const values = form.getValues();
			// Ne sauvegarder que si au moins une ligne a une description
			const hasContent = values.lines?.some((l) => l.description?.trim());
			// Ne sauvegarder que si un client est sélectionné (requis par la DB)
			const hasClient = values.clientId || values.newClient;
			if (!hasContent || !hasClient) return;

			try {
				const result = await saveDraft(values, draftIdRef.current);
				if (result.success && result.data) {
					draftIdRef.current = result.data.id;
					setLastSaved(new Date());
				} else if (!result.success) {
					// Log pour debug — l'erreur est silencieuse côté UI
					console.warn("[Auto-save] Échec:", result.error);
				}
			} catch (err) {
				console.warn("[Auto-save] Exception:", err);
			}
		}, AUTOSAVE_INTERVAL);

		return () => clearInterval(intervalRef.current);
	}, [form, mounted]);

	// ─── Submit : créer la facture en DB ──────────────────────────────────────
	const onSubmit = useCallback(
		(data: InvoiceFormData) => {
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
					<Link href="/dashboard/invoices">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Nouvelle facture
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{invoiceNumber || "Chargement…"}
						{lastSaved && (
							<span className="ml-2 text-xs text-emerald-500 dark:text-emerald-400">
								· Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
							</span>
						)}
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
							invoiceNumber={invoiceNumber}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
							isSubmitting={createMutation.isPending}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<InvoicePreview form={form} invoiceNumber={invoiceNumber} companyInfo={companyInfo} themeColor={themeColor} companyFont={companyFont} companyLogo={companyLogo} companyName={companyName} />
				</div>
			</div>

			{/* Mobile: stepper */}
			<div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
				<InvoiceStepper
					form={form}
					onSubmit={onSubmit}
					invoiceNumber={invoiceNumber}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
				
				themeColor={themeColor}
				companyFont={companyFont}
				companyLogo={companyLogo}
			companyName={companyName}
			/>
			</div>
		</div>
	);
}

// Wrapper Suspense requis à cause de useSearchParams
export default function NewInvoicePage() {
	return (
		<Suspense>
			<NewInvoicePageContent />
		</Suspense>
	);
}

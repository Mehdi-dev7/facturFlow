"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/devis/quote-form";
import { QuotePreview } from "@/components/devis/quote-preview";
import { QuoteStepper } from "@/components/devis/quote-stepper";
import {
	quoteFormSchema,
	type QuoteFormData,
	type CompanyInfo,
	INVOICE_TYPES,
} from "@/lib/validations/quote";
import { getQuote } from "@/lib/actions/quotes";
import { useUpdateQuote, type SavedQuote } from "@/hooks/use-quotes";

// ─── Mapping DB → valeurs du formulaire ───────────────────────────────────────

const VAT_RATES = [0, 5.5, 10, 20] as const;
type VatRate = (typeof VAT_RATES)[number];

function extractVatRate(meta: Record<string, unknown> | null): VatRate {
	const raw = meta?.vatRate;
	if (typeof raw === "number" && (VAT_RATES as readonly number[]).includes(raw)) {
		return raw as VatRate;
	}
	return 20;
}

function toFormValues(q: SavedQuote): Partial<QuoteFormData> {
	const rawQuoteType = q.invoiceType ?? "basic";
	const quoteType = (INVOICE_TYPES.includes(rawQuoteType as (typeof INVOICE_TYPES)[number])
		? rawQuoteType
		: "basic") as (typeof INVOICE_TYPES)[number];

	const sortedLines = [...q.lineItems].sort((a, b) => a.order - b.order);

	return {
		clientId: q.client.id,
		date: q.date.split("T")[0],
		validUntil: q.validUntil ? q.validUntil.split("T")[0] : "",
		quoteType,
		lines: sortedLines.map((li) => ({
			description: li.description,
			quantity: li.quantity,
			unitPrice: li.unitPrice,
			category: (li.category === "main_oeuvre" || li.category === "materiel") ? li.category : undefined,
		})),
		vatRate: extractVatRate(q.businessMetadata),
		discountType: (q.discountType === "pourcentage" || q.discountType === "montant") ? q.discountType : undefined,
		discountValue: q.discount ?? 0,
		depositAmount: q.depositAmount ?? 0,
		notes: q.notes ?? "",
	};
}

function toCompanyInfo(user: SavedQuote["user"]): CompanyInfo | null {
	if (!user.companyName || !user.companySiret || !user.companyEmail) return null;
	return {
		name: user.companyName,
		siret: user.companySiret,
		address: user.companyAddress ?? "",
		city: user.companyCity ?? "",
		email: user.companyEmail,
		phone: user.companyPhone ?? undefined,
	};
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditQuotePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
	const [quote, setQuote] = useState<SavedQuote | null>(null);
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const updateMutation = useUpdateQuote();

	const form = useForm<QuoteFormData>({
		resolver: zodResolver(quoteFormSchema),
		mode: "onChange",
		defaultValues: {
			clientId: "",
			date: "",
			validUntil: "",
			quoteType: "basic",
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

		getQuote(id).then((result) => {
			if (result.success && result.data) {
				const q = result.data;
				setQuote(q);

				// Pre-remplir le formulaire avec les donnees du devis
				form.reset(toFormValues(q));

				// Company info depuis DB d'abord, puis localStorage en fallback
				const dbCompany = toCompanyInfo(q.user);
				if (dbCompany) {
					setCompanyInfo(dbCompany);
				} else {
					try {
						const saved = localStorage.getItem("facturflow_company");
						if (saved) setCompanyInfo(JSON.parse(saved) as CompanyInfo);
					} catch {
						// ignore
					}
				}
			} else {
				setLoadError(result.error ?? "Devis introuvable");
			}
		});

		setMounted(true);
	}, [id, form]);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfo(data);
		localStorage.setItem("facturflow_company", JSON.stringify(data));
	}, []);

	// ─── Submit : mettre a jour le devis ───────────────────────────────────
	const onSubmit = useCallback(
		(data: QuoteFormData) => {
			if (!id) return;
			updateMutation.mutate(
				{ id, data },
				{
					onSuccess: (result) => {
						if (result.success) {
							router.push(`/dashboard/quotes?preview=${id}`);
						}
					},
				},
			);
		},
		[id, updateMutation, router],
	);

	// ─── Skeleton ─────────────────────────────────────────────────────────────
	if (!mounted || (!quote && !loadError)) {
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
					<Link href="/dashboard/quotes">Retour aux devis</Link>
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
					<Link href="/dashboard/quotes">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Modifier le devis
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{quote?.number}
					</p>
				</div>
			</div>

			{/* Desktop: split screen */}
			<div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
				<div className="space-y-4">
					<div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg p-6">
						<QuoteForm
							form={form}
							onSubmit={onSubmit}
							quoteNumber={quote?.number ?? ""}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<QuotePreview
						form={form}
						quoteNumber={quote?.number ?? ""}
						companyInfo={companyInfo}
					/>
				</div>
			</div>

			{/* Mobile: stepper */}
			<div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
				<QuoteStepper
					form={form}
					onSubmit={onSubmit}
					quoteNumber={quote?.number ?? ""}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
				/>
			</div>
		</div>
	);
}

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
	type DraftQuote,
} from "@/lib/validations/quote";
import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import { mockClients } from "@/lib/mock-data/clients";

const DRAFT_KEY = "facturflow_quote_draft";
const AUTOSAVE_INTERVAL = 30_000;

function generateQuoteNumber(): string {
	const year = new Date().getFullYear();
	const count = Math.floor(Math.random() * 900) + 100;
	return `DEV-${year}-${String(count).padStart(3, "0")}`;
}

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function validUntilISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 30);
	return d.toISOString().split("T")[0];
}

export default function NewQuotePage() {
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
	const [quoteNumber, setQuoteNumber] = useState("");
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

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

	// Client-only init
	useEffect(() => {
		setQuoteNumber(generateQuoteNumber());

		// Load company info
		try {
			const savedCompany = localStorage.getItem("facturflow_company");
			if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));
		} catch {
			// ignore
		}

		// Set dates
		form.setValue("date", todayISO());
		form.setValue("validUntil", validUntilISO());

		// Load draft
		try {
			const savedDraft = localStorage.getItem(DRAFT_KEY);
			if (savedDraft) {
				const draft = JSON.parse(savedDraft) as Partial<QuoteFormData>;
				if (draft.lines && draft.lines.length > 0) {
					const cleanLines = draft.lines.map((l) => ({
						description: l.description || "",
						quantity: l.quantity || 1,
						unitPrice: l.unitPrice || 0,
					}));
					form.reset({
						...form.getValues(),
						...draft,
						lines: cleanLines,
					});
				}
			}
		} catch {
			localStorage.removeItem(DRAFT_KEY);
		}

		setMounted(true);
	}, [form]);

	const handleCompanyChange = useCallback((data: CompanyInfo) => {
		setCompanyInfo(data);
		localStorage.setItem("facturflow_company", JSON.stringify(data));
	}, []);

	// Autosave every 30s
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
	useEffect(() => {
		if (!mounted) return;
		intervalRef.current = setInterval(() => {
			const values = form.getValues();
			localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
		}, AUTOSAVE_INTERVAL);
		return () => clearInterval(intervalRef.current);
	}, [form, mounted]);

	const onSubmit = useCallback(
		(data: QuoteFormData) => {
			const totals = calcInvoiceTotals({
				lines: data.lines || [],
				vatRate: data.vatRate,
				discountType: data.discountType,
				discountValue: data.discountValue,
				depositAmount: data.depositAmount,
			});

			const resolvedClient = (() => {
				if (data.newClient) return data.newClient;
				const found = mockClients.find((c) => c.id === data.clientId);
				if (found) return { name: found.name, email: found.email, address: found.city, city: found.city };
				return { name: "", email: "", address: "", city: "" };
			})();

			const draft: DraftQuote = {
				id: quoteNumber,
				emitter: companyInfo || { name: "", siret: "", address: "", city: "", email: "" },
				client: resolvedClient,
				date: data.date,
				validUntil: data.validUntil,
				quoteType: data.quoteType ?? "basic",
				lines: data.lines,
				vatRate: data.vatRate,
				subtotal: totals.subtotal,
				discountAmount: totals.discountAmount,
				netHT: totals.netHT,
				taxTotal: totals.taxTotal,
				total: totals.totalTTC,
				depositAmount: totals.depositAmount,
				netAPayer: totals.netAPayer,
				notes: data.notes,
				status: "brouillon",
			};

			const existing = JSON.parse(
				localStorage.getItem("facturflow_quotes") || "[]",
			) as DraftQuote[];
			existing.push(draft);
			localStorage.setItem("facturflow_quotes", JSON.stringify(existing));
			localStorage.removeItem(DRAFT_KEY);

			router.push("/dashboard/quotes");
		},
		[quoteNumber, router, companyInfo],
	);

	// Skeleton pendant le montage client
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
					<Link href="/dashboard/quotes">
						<ArrowLeft className="size-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
						Nouveau devis
					</h1>
					<p className="text-sm text-slate-500 dark:text-violet-400/60">
						{quoteNumber}
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
							quoteNumber={quoteNumber}
							companyInfo={companyInfo}
							onCompanyChange={handleCompanyChange}
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<QuotePreview form={form} quoteNumber={quoteNumber} companyInfo={companyInfo} />
				</div>
			</div>

			{/* Mobile: stepper */}
			<div className="lg:hidden rounded-2xl border border-slate-300/80 dark:border-violet-500/20 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 min-h-[70vh]">
				<QuoteStepper
					form={form}
					onSubmit={onSubmit}
					quoteNumber={quoteNumber}
					companyInfo={companyInfo}
					onCompanyChange={handleCompanyChange}
				/>
			</div>
		</div>
	);
}

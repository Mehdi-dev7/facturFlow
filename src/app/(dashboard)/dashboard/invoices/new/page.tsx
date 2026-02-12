"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
	type DraftInvoice,
} from "@/lib/validations/invoice";
import { mockClients } from "@/lib/mock-data/clients";

const DRAFT_KEY = "facturflow_invoice_draft";
const AUTOSAVE_INTERVAL = 30_000;

function generateInvoiceNumber(): string {
	const year = new Date().getFullYear();
	const count = Math.floor(Math.random() * 900) + 100;
	return `FAC-${year}-${String(count).padStart(3, "0")}`;
}

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

function dueDateISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 30);
	return d.toISOString().split("T")[0];
}

export default function NewInvoicePage() {
	const router = useRouter();

	// Tout le state client-only initialisé dans useEffect pour éviter les hydration mismatches
	const [mounted, setMounted] = useState(false);
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

	const form = useForm<InvoiceFormData>({
		resolver: zodResolver(invoiceFormSchema),
		mode: "onChange",
		defaultValues: {
			clientId: "",
			date: "",
			dueDate: "",
			lines: [{ description: "", quantity: 1, unitPrice: 0 }],
			vatRate: 20,
			notes: "",
		},
	});

	// Client-only init
	useEffect(() => {
		setInvoiceNumber(generateInvoiceNumber());

		// Load company info
		try {
			const savedCompany = localStorage.getItem("facturflow_company");
			if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));
		} catch {
			// ignore
		}

		// Set dates
		form.setValue("date", todayISO());
		form.setValue("dueDate", dueDateISO());

		// Load draft
		try {
			const savedDraft = localStorage.getItem(DRAFT_KEY);
			if (savedDraft) {
				const draft = JSON.parse(savedDraft) as Partial<InvoiceFormData>;
				if (draft.lines && draft.lines.length > 0) {
					// Nettoyer les lignes : supprimer les champs obsolètes (vatRate per-line)
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
		(data: InvoiceFormData) => {
			const lines = data.lines || [];
			const subtotal = lines.reduce(
				(s, l) => s + l.quantity * l.unitPrice,
				0,
			);
			const taxTotal = subtotal * (data.vatRate / 100);

			// Résoudre les données client
			const resolvedClient = (() => {
				if (data.newClient) return data.newClient;
				const found = mockClients.find((c) => c.id === data.clientId);
				if (found) return { name: found.name, email: found.email, address: found.city, city: found.city };
				return { name: "", email: "", address: "", city: "" };
			})();

			const draft: DraftInvoice = {
				id: invoiceNumber,
				emitter: companyInfo || { name: "", siret: "", address: "", city: "", email: "" },
				client: resolvedClient,
				date: data.date,
				dueDate: data.dueDate,
				lines: data.lines,
				vatRate: data.vatRate,
				subtotal,
				taxTotal,
				total: subtotal + taxTotal,
				notes: data.notes,
				paymentLinks: data.paymentLinks,
				status: "brouillon",
			};

			const existing = JSON.parse(
				localStorage.getItem("facturflow_invoices") || "[]",
			) as DraftInvoice[];
			existing.push(draft);
			localStorage.setItem("facturflow_invoices", JSON.stringify(existing));
			localStorage.removeItem(DRAFT_KEY);

			router.push("/dashboard/invoices");
		},
		[invoiceNumber, router, companyInfo],
	);

	// Skeleton de chargement pendant le montage client
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
						{invoiceNumber}
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
						/>
					</div>
				</div>
				<div className="sticky top-6 self-start">
					<InvoicePreview form={form} invoiceNumber={invoiceNumber} companyInfo={companyInfo} />
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
				/>
			</div>
		</div>
	);
}

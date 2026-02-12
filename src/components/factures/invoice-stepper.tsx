"use client";

import React, { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ChevronLeft, ChevronRight, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { InvoiceForm } from "./invoice-form";
import { InvoicePreview } from "./invoice-preview";
import type { InvoiceFormData, CompanyInfo } from "@/lib/validations/invoice";

const STEPS = [
	{ id: 1, label: "Émetteur & Client" },
	{ id: 2, label: "Lignes" },
	{ id: 3, label: "Options" },
	{ id: 4, label: "Récapitulatif" },
] as const;

interface InvoiceStepperProps {
	form: UseFormReturn<InvoiceFormData>;
	onSubmit: (data: InvoiceFormData) => void;
	invoiceNumber: string;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
}

export function InvoiceStepper({
	form,
	onSubmit,
	invoiceNumber,
	companyInfo,
	onCompanyChange,
}: InvoiceStepperProps) {
	const [step, setStep] = useState(1);

	const validateStep = useCallback(
		async (currentStep: number) => {
			const fieldsMap: Record<number, (keyof InvoiceFormData)[]> = {
				1: ["clientId"],
				2: ["lines"],
				3: ["notes"],
			};
			const fields = fieldsMap[currentStep];
			if (!fields) return true;
			return await form.trigger(fields);
		},
		[form],
	);

	const handleNext = useCallback(async () => {
		const valid = await validateStep(step);
		if (valid && step < 4) setStep((s) => s + 1);
	}, [step, validateStep]);

	const handlePrev = useCallback(() => {
		if (step > 1) setStep((s) => s - 1);
	}, [step]);

	const progress = (step / STEPS.length) * 100;

	return (
		<div className="flex flex-col h-full">
			{/* Progress bar */}
			<div className="px-4 pt-4 pb-2">
				<div className="flex items-center gap-2 mb-3">
					{STEPS.map((s) => (
						<div key={s.id} className="flex items-center gap-1.5 flex-1">
							<div
								className={`flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-all duration-300 ${
									step >= s.id
										? "bg-violet-600 text-white shadow-lg"
										: "bg-slate-200 dark:bg-violet-950/40 text-slate-500 dark:text-violet-400/60"
								}`}
							>
								{step > s.id ? <Check className="size-3.5" /> : s.id}
							</div>
							<span
								className={`text-xs hidden sm:inline transition-colors ${
									step >= s.id
										? "text-violet-600 dark:text-violet-400 font-medium"
										: "text-slate-400 dark:text-violet-400/60"
								}`}
							>
								{s.label}
							</span>
							{s.id < STEPS.length && (
								<div
									className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
										step > s.id
											? "bg-violet-600"
											: "bg-slate-200 dark:bg-violet-950/40"
									}`}
								/>
							)}
						</div>
					))}
				</div>
				<div className="h-1 bg-slate-200 dark:bg-violet-950/40 rounded-full overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				{step < 4 ? (
					<InvoiceForm
						form={form}
						onSubmit={onSubmit}
						invoiceNumber={invoiceNumber}
						companyInfo={companyInfo}
						onCompanyChange={onCompanyChange}
					/>
				) : (
					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
							Récapitulatif
						</h3>
						<InvoicePreview
							form={form}
							invoiceNumber={invoiceNumber}
							companyInfo={companyInfo}
						/>
						<Button
							type="button"
							variant="gradient"
							className="w-full h-11 cursor-pointer transition-all duration-300 hover:scale-105"
							onClick={form.handleSubmit(onSubmit)}
						>
							Créer la facture
						</Button>
					</div>
				)}
			</div>

			{/* Navigation */}
			<div className="border-t border-slate-200 dark:border-violet-500/20 p-4 flex items-center justify-between gap-3 bg-white/50 dark:bg-[#1a1438]/50 backdrop-blur-sm">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handlePrev}
					disabled={step === 1}
					className="border-primary/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 transition-all duration-300 cursor-pointer"
				>
					<ChevronLeft className="size-4" />
					Précédent
				</Button>

				<Sheet>
					<SheetTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
						>
							<Eye className="size-4" />
							Aperçu
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-[#1a1438] dark:to-[#1a1438]">
						<SheetHeader>
							<SheetTitle className="text-slate-900 dark:text-slate-100">Aperçu de la facture</SheetTitle>
						</SheetHeader>
						<div className="p-4">
							<InvoicePreview form={form} invoiceNumber={invoiceNumber} companyInfo={companyInfo} />
						</div>
					</SheetContent>
				</Sheet>

				{step < 4 ? (
					<Button
						type="button"
						size="sm"
						onClick={handleNext}
						className="cursor-pointer transition-all duration-300 hover:scale-105"
					>
						Suivant
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<Button
						type="button"
						variant="gradient"
						size="sm"
						onClick={form.handleSubmit(onSubmit)}
						className="cursor-pointer transition-all duration-300 hover:scale-105"
					>
						Créer
						<Check className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

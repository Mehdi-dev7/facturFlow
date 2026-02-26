"use client";

import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ChevronRight, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { DepositForm } from "./deposit-form";
import { DepositPreview } from "./deposit-preview";
import type { CompanyInfo } from "@/lib/validations/invoice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepositFormData {
	clientId: string;
	amount: number;
	vatRate: 0 | 5.5 | 10 | 20;
	date: string;
	dueDate: string;
	description: string;
	notes?: string;
	paymentLinks: {
		stripe: boolean;
		paypal: boolean;
		sepa: boolean;
	};
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
	{ id: 1, label: "Client" },
	{ id: 2, label: "Montant" },
	{ id: 3, label: "Options" },
	{ id: 4, label: "Récap" },
] as const;

interface DepositStepperProps {
	form: UseFormReturn<DepositFormData>;
	onSubmit: (data: DepositFormData) => void;
	depositNumber: string;
	companyInfo: CompanyInfo | null;
	onCompanyChange: (data: CompanyInfo) => void;
	isSubmitting?: boolean;
	submitLabel?: string;
	themeColor?: string;
	companyFont?: string;
	companyLogo?: string | null;
	companyName?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function DepositStepper({
	form,
	onSubmit,
	depositNumber,
	companyInfo,
	onCompanyChange,
	isSubmitting,
	submitLabel = "Créer",
	themeColor,
	companyFont,
	companyLogo,
	companyName,
}: DepositStepperProps) {
	const [step, setStep] = useState(1);

	// Valider les champs clés avant de passer à l'étape suivante
	const validateStep = useCallback(
		async (currentStep: number) => {
			const fieldsMap: Record<number, (keyof DepositFormData)[]> = {
				1: ["clientId"],
				2: ["amount", "date", "dueDate", "description"],
				3: [], // paiements et notes sont optionnels
			};
			const fields = fieldsMap[currentStep];
			if (!fields || fields.length === 0) return true;
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
			{/* Barre de progression + indicateurs d'étapes */}
			<div className="px-4 pt-4 pb-2">
				<div className="flex items-center gap-2 mb-3">
					{STEPS.map((s) => (
						<div key={s.id} className="flex items-center gap-1.5 flex-1">
							{/* Cercle numéroté */}
							<div
								className={`flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-all duration-300 ${
									step >= s.id
										? "bg-violet-600 text-white shadow-lg"
										: "bg-slate-200 dark:bg-violet-950/40 text-slate-500 dark:text-violet-400/60"
								}`}
							>
								{step > s.id ? <Check className="size-3.5" /> : s.id}
							</div>
							{/* Label d'étape — caché sur mobile */}
							<span
								className={`text-[10px] sm:text-xs hidden sm:inline transition-colors ${
									step >= s.id
										? "text-violet-600 dark:text-violet-400 font-medium"
										: "text-slate-400 dark:text-violet-400/60"
								}`}
							>
								{s.label}
							</span>
							{/* Trait de connexion entre étapes */}
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
				{/* Barre de progression globale */}
				<div className="h-1 bg-slate-200 dark:bg-violet-950/40 rounded-full overflow-hidden">
					<div
						className="h-full bg-linear-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Contenu de l'étape courante */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				{step < 4 ? (
					// Étapes 1-3 : affiche uniquement les sections de l'étape active
					<DepositForm
						form={form}
						onSubmit={onSubmit}
						companyInfo={companyInfo}
						onCompanyChange={onCompanyChange}
						isSubmitting={isSubmitting ?? false}
						visibleStep={step as 1 | 2 | 3}
						hideSubmit
					/>
				) : (
					// Étape 4 : récapitulatif compact
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-slate-500 dark:text-violet-400 uppercase tracking-wider">
							Récapitulatif
						</h3>
						<DepositPreview
							form={form}
							depositNumber={depositNumber}
							companyInfo={companyInfo}
							themeColor={themeColor}
							companyFont={companyFont}
							companyLogo={companyLogo}
							companyName={companyName}
							compact
						/>
					</div>
				)}
			</div>

			{/* Navigation bas de page */}
			<div className="border-t border-slate-200 dark:border-violet-500/20 px-4 pt-3 pb-2 bg-white/50 dark:bg-[#1a1438]/50 backdrop-blur-sm space-y-2">
				{/* Ligne 1 : Précédent + Suivant/Créer */}
				<div className="flex items-center justify-between gap-3">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handlePrev}
						disabled={step === 1}
						className="border-primary/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 transition-all duration-300 cursor-pointer"
					>
						Précédent
					</Button>

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
							disabled={isSubmitting}
							onClick={form.handleSubmit(onSubmit)}
							className="cursor-pointer transition-all duration-300 hover:scale-105"
						>
							{isSubmitting ? "Création..." : submitLabel}
							<Check className="size-4" />
						</Button>
					)}
				</div>

				{/* Ligne 2 : Aperçu centré en dessous */}
				<div className="flex justify-center">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer text-xs border border-slate-200 dark:border-violet-500/30"
							>
								<Eye className="size-3.5" />
								Aperçu
							</Button>
						</SheetTrigger>
						<SheetContent
							side="bottom"
							className="h-[80vh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48]"
						>
							<SheetHeader>
								<SheetTitle className="text-slate-900 dark:text-slate-100">
									Aperçu de l&apos;acompte
								</SheetTitle>
							</SheetHeader>
							<div className="px-4 pb-4">
								<DepositPreview
									form={form}
									depositNumber={depositNumber}
									companyInfo={companyInfo}
									themeColor={themeColor}
									companyFont={companyFont}
									companyLogo={companyLogo}
									companyName={companyName}
									compact
								/>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</div>
	);
}

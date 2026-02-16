"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { companyInfoSchema, type CompanyInfo } from "@/lib/validations/invoice";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import type { SiretData } from "@/lib/api/siret-lookup";

interface CompanyInfoModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultValues?: Partial<CompanyInfo>;
	onSave: (data: CompanyInfo) => void;
}

export function CompanyInfoModal({
	open,
	onOpenChange,
	defaultValues,
	onSave,
}: CompanyInfoModalProps) {
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CompanyInfo>({
		resolver: zodResolver(companyInfoSchema),
		defaultValues,
	});

	const onSubmit = useCallback(
		(data: CompanyInfo) => {
			localStorage.setItem("facturflow_company", JSON.stringify(data));
			onSave(data);
			onOpenChange(false);
		},
		[onSave, onOpenChange],
	);

	// Quand l'API SIRET retourne une entreprise → pré-remplit tous les champs
	const handleSiretFound = useCallback(
		(data: SiretData) => {
			setValue("name", data.name, { shouldDirty: true });
			setValue("siret", data.siret, { shouldDirty: true });
			setValue("address", data.address, { shouldDirty: true });
			setValue("zipCode", data.zipCode, { shouldDirty: true });
			setValue("city", data.city, { shouldDirty: true });
		},
		[setValue],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl">
				<DialogHeader>
					<DialogTitle className="text-slate-900 dark:text-slate-100">
						Informations de votre entreprise
					</DialogTitle>
					<DialogDescription className="text-slate-500 dark:text-slate-400">
						Ces informations apparaîtront sur vos factures en tant qu&apos;émetteur.
					</DialogDescription>
				</DialogHeader>

				<div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Bloc recherche SIRET — pré-remplit le formulaire */}
					<SiretLookupInput onFound={handleSiretFound} />

					<div>
						<Label htmlFor="companyName" className="text-slate-700 dark:text-violet-200">
							Nom de l&apos;entreprise *
						</Label>
						<Input
							id="companyName"
							{...register("name")}
							className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
							aria-invalid={!!errors.name}
						/>
						{errors.name && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>
						)}
					</div>

					<div>
						<Label htmlFor="companySiret" className="text-slate-700 dark:text-violet-200">
							SIRET *
						</Label>
						<Input
							id="companySiret"
							{...register("siret")}
							placeholder="14 chiffres"
							maxLength={14}
							inputMode="numeric"
							className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 font-mono tracking-widest"
							aria-invalid={!!errors.siret}
						/>
						{errors.siret && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.siret.message}</p>
						)}
					</div>

					<div>
						<Label htmlFor="companyAddress" className="text-slate-700 dark:text-violet-200">
							Adresse *
						</Label>
						<Input
							id="companyAddress"
							{...register("address")}
							className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
							aria-invalid={!!errors.address}
						/>
						{errors.address && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.address.message}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="companyZipCode" className="text-slate-700 dark:text-violet-200">
								Code postal
							</Label>
							<Input
								id="companyZipCode"
								{...register("zipCode")}
								placeholder="75001"
								maxLength={5}
								inputMode="numeric"
								className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
							/>
						</div>
						<div>
							<Label htmlFor="companyCity" className="text-slate-700 dark:text-violet-200">
								Ville *
							</Label>
							<Input
								id="companyCity"
								{...register("city")}
								className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
								aria-invalid={!!errors.city}
							/>
							{errors.city && (
								<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.city.message}</p>
							)}
						</div>
					</div>

					<div>
						<Label htmlFor="companyEmail" className="text-slate-700 dark:text-violet-200">
							Email *
						</Label>
						<Input
							id="companyEmail"
							type="email"
							{...register("email")}
							className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
							aria-invalid={!!errors.email}
						/>
						{errors.email && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>
						)}
					</div>

					<div>
						<Label htmlFor="companyPhone" className="text-slate-700 dark:text-violet-200">
							Téléphone
						</Label>
						<Input
							id="companyPhone"
							type="tel"
							{...register("phone")}
							className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
						/>
					</div>

					<div className="mx-0 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="cursor-pointer border-primary/20 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200"
						>
							Annuler
						</Button>
						<Button type="submit" className="cursor-pointer transition-all duration-300 hover:scale-105">
							Enregistrer
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

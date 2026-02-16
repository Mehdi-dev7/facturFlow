"use client";

// Formulaire complet de création/édition d'un client
// Utilisé sur la page /dashboard/clients/new

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Building2, User, Save, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFormSchema, type ClientFormData } from "@/lib/validations/client";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import type { SiretData } from "@/lib/api/siret-lookup";

export function ClientForm() {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientFormSchema),
		defaultValues: { type: "entreprise" },
	});

	const clientType = watch("type");

	// Soumission — TODO: connecter à une Server Action quand la DB sera en place
	const onSubmit = useCallback(
		async (data: ClientFormData) => {
			console.log("Nouveau client :", data);
			// TODO: await createClient(data)
			router.push("/dashboard/clients");
		},
		[router],
	);

	// SIRET trouvé → pré-remplit les champs
	const handleSiretFound = useCallback(
		(data: SiretData) => {
			setValue("name", data.name, { shouldDirty: true });
			setValue("siret", data.siret, { shouldDirty: true });
			setValue("address", data.address, { shouldDirty: true });
			setValue("zipCode", data.zipCode, { shouldDirty: true });
			setValue("city", data.city, { shouldDirty: true });
			// Auto-sélectionne "entreprise" si lookup réussi
			setValue("type", "entreprise", { shouldDirty: true });
		},
		[setValue],
	);

	const inputClass =
		"bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

	const labelClass = "text-sm font-medium text-slate-700 dark:text-violet-200";

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

			{/* ─── Recherche automatique par SIRET ─── */}
			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
					Recherche automatique
				</h3>
				<SiretLookupInput onFound={handleSiretFound} />
			</section>

			<div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

			{/* ─── Type de client ─── */}
			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
					Type de client
				</h3>
				<div className="grid grid-cols-2 gap-3">
					{/* Bouton Entreprise */}
					<button
						type="button"
						onClick={() => setValue("type", "entreprise")}
						className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer text-left ${
							clientType === "entreprise"
								? "border-primary bg-violet-100/70 dark:border-violet-400 dark:bg-violet-500/20"
								: "border-slate-200 dark:border-violet-400/20 hover:border-primary/50 dark:hover:border-violet-400/50"
						}`}
					>
						<div className={`flex size-8 items-center justify-center rounded-lg ${
							clientType === "entreprise"
								? "bg-primary/10 dark:bg-violet-500/20"
								: "bg-slate-100 dark:bg-violet-900/20"
						}`}>
							<Building2 className={`size-4 ${
								clientType === "entreprise"
									? "text-primary dark:text-violet-400"
									: "text-slate-500 dark:text-violet-500"
							}`} />
						</div>
						<div>
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
								Entreprise
							</p>
							<p className="text-xs text-slate-500 dark:text-violet-400/70">B2B — avec SIRET</p>
						</div>
					</button>

					{/* Bouton Particulier */}
					<button
						type="button"
						onClick={() => setValue("type", "particulier")}
						className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer text-left ${
							clientType === "particulier"
								? "border-primary bg-violet-100/70 dark:border-violet-400 dark:bg-violet-500/20"
								: "border-slate-200 dark:border-violet-400/20 hover:border-primary/50 dark:hover:border-violet-400/50"
						}`}
					>
						<div className={`flex size-8 items-center justify-center rounded-lg ${
							clientType === "particulier"
								? "bg-primary/10 dark:bg-violet-500/20"
								: "bg-slate-100 dark:bg-violet-900/20"
						}`}>
							<User className={`size-4 ${
								clientType === "particulier"
									? "text-primary dark:text-violet-400"
									: "text-slate-500 dark:text-violet-500"
							}`} />
						</div>
						<div>
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
								Particulier
							</p>
							<p className="text-xs text-slate-500 dark:text-violet-400/70">B2C — sans SIRET</p>
						</div>
					</button>
				</div>
			</section>

			<div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

			{/* ─── Informations principales ─── */}
			<section className="space-y-4">
				<h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
					Informations
				</h3>

				{/* Nom / Raison sociale */}
				<div>
					<Label htmlFor="clientName" className={labelClass}>
						{clientType === "entreprise" ? "Raison sociale *" : "Nom complet *"}
					</Label>
					<Input
						id="clientName"
						{...register("name")}
						placeholder={clientType === "entreprise" ? "Ex: Acme SAS" : "Ex: Jean Dupont"}
						className={inputClass}
						aria-invalid={!!errors.name}
					/>
					{errors.name && (
						<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>
					)}
				</div>

				{/* SIRET — entreprise et particulier (auto-entrepreneur, etc.) */}
				<div>
					<Label htmlFor="clientSiret" className={labelClass}>
						SIRET
					</Label>
					<Input
						id="clientSiret"
						{...register("siret")}
						placeholder="14 chiffres"
						maxLength={14}
						inputMode="numeric"
						className={`${inputClass} font-mono tracking-widest`}
					/>
				</div>

				{/* Email + Téléphone côte à côte */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label htmlFor="clientEmail" className={labelClass}>
							Email *
						</Label>
						<Input
							id="clientEmail"
							type="email"
							{...register("email")}
							placeholder="contact@entreprise.fr"
							className={inputClass}
							aria-invalid={!!errors.email}
						/>
						{errors.email && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>
						)}
					</div>
					<div>
						<Label htmlFor="clientPhone" className={labelClass}>
							Téléphone
						</Label>
						<Input
							id="clientPhone"
							type="tel"
							{...register("phone")}
							placeholder="06 12 34 56 78"
							className={inputClass}
						/>
					</div>
				</div>
			</section>

			<div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

			{/* ─── Adresse ─── */}
			<section className="space-y-4">
				<h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
					Adresse
				</h3>

				<div>
					<Label htmlFor="clientAddress" className={labelClass}>
						Adresse *
					</Label>
					<Input
						id="clientAddress"
						{...register("address")}
						placeholder="Ex: 12 Rue de la Paix"
						className={inputClass}
						aria-invalid={!!errors.address}
					/>
					{errors.address && (
						<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.address.message}</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="clientZipCode" className={labelClass}>
							Code postal
						</Label>
						<Input
							id="clientZipCode"
							{...register("zipCode")}
							placeholder="75001"
							maxLength={5}
							inputMode="numeric"
							className={inputClass}
						/>
					</div>
					<div>
						<Label htmlFor="clientCity" className={labelClass}>
							Ville *
						</Label>
						<Input
							id="clientCity"
							{...register("city")}
							placeholder="Paris"
							className={inputClass}
							aria-invalid={!!errors.city}
						/>
						{errors.city && (
							<p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.city.message}</p>
						)}
					</div>
				</div>
			</section>

			<div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />

			{/* ─── Notes internes ─── */}
			<section className="space-y-2">
				<h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
					Notes internes
				</h3>
				<Textarea
					{...register("notes")}
					placeholder="Informations complémentaires (conditions particulières, contact préféré...)"
					rows={3}
					className={`${inputClass} resize-none`}
				/>
			</section>

			{/* ─── Actions ─── */}
			<div className="flex items-center justify-between pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/dashboard/clients")}
					className="gap-2 border-primary/20 dark:border-violet-400/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 cursor-pointer rounded-xl"
				>
					<ArrowLeft className="size-4" />
					Retour
				</Button>

				<Button
				  variant="default"
					type="submit"
					disabled={isSubmitting}
					className="gap-2 cursor-pointer text-white transition-all duration-300 hover:scale-105"
				>
					<Save className="size-4" />
					Enregistrer le client
				</Button>
			</div>
		</form>
	);
}

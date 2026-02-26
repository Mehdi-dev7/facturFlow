"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// ─── Indicateur de force du mot de passe ─────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
	if (!password) return null;

	const checks = [
		{ label: "8 caractères minimum", ok: password.length >= 8 },
		{ label: "Une majuscule", ok: /[A-Z]/.test(password) },
		{ label: "Un chiffre", ok: /[0-9]/.test(password) },
		{ label: "Un caractère spécial", ok: /[^A-Za-z0-9]/.test(password) },
	];

	const score = checks.filter((c) => c.ok).length;
	const levels = ["", "Faible", "Moyen", "Bon", "Fort"];
	const colors = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-emerald-600"];
	const bars = ["", "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"];

	return (
		<div className="space-y-2 mt-2">
			{/* Barre de force */}
			<div className="flex gap-1">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? bars[score] : "bg-slate-200"}`}
					/>
				))}
			</div>
			{score > 0 && (
				<p className={`text-xs font-medium ${colors[score]}`}>
					Mot de passe {levels[score]}
				</p>
			)}
			{/* Checklist */}
			<ul className="space-y-0.5">
				{checks.map((c) => (
					<li key={c.label} className="flex items-center gap-1.5 text-xs">
						{c.ok
							? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
							: <XCircle className="h-3 w-3 text-slate-300 shrink-0" />
						}
						<span className={c.ok ? "text-slate-600" : "text-slate-400"}>{c.label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// ─── Contenu de la page (lit les searchParams) ────────────────────────────────

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [done, setDone] = useState(false);
	const [tokenInvalid, setTokenInvalid] = useState(false);

	useEffect(() => {
		if (!token) setTokenInvalid(true);
	}, [token]);

	const isPasswordValid = (p: string) =>
		p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!token) { setTokenInvalid(true); return; }

		if (newPassword !== confirmPassword) {
			toast.error("Les mots de passe ne correspondent pas.");
			return;
		}

		if (!isPasswordValid(newPassword)) {
			toast.error("Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.");
			return;
		}

		setIsLoading(true);
		try {
			const result = await authClient.resetPassword({
				newPassword,
				token,
			});

			if (result.error) {
				if (result.error.status === 400) {
					setTokenInvalid(true);
				} else {
					toast.error(result.error.message ?? "Une erreur est survenue.");
				}
				return;
			}

			setDone(true);
			setTimeout(() => router.push("/login"), 3000);
		} catch (err) {
			console.error(err);
			toast.error("Une erreur est survenue. Veuillez réessayer.");
		} finally {
			setIsLoading(false);
		}
	};

	// ── Token invalide / expiré ──
	if (tokenInvalid) {
		return (
			<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
				<CardHeader className="space-y-3 pb-6">
					<Link href="/" className="flex justify-center mb-2 group w-fit mx-auto">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white">F</span>
						</div>
					</Link>
					<CardTitle className="text-2xl font-bold text-center text-gradient">Lien invalide</CardTitle>
					<CardDescription className="text-center text-sm text-slate-600">
						Ce lien de réinitialisation est expiré ou invalide.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col items-center gap-3 py-2">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
							<XCircle className="h-7 w-7 text-red-500" />
						</div>
						<p className="text-xs text-slate-500 text-center leading-relaxed">
							Les liens de réinitialisation expirent après <strong>1 heure</strong>.<br />
							Faites une nouvelle demande pour recevoir un nouveau lien.
						</p>
					</div>
					<Button variant="gradient" className="w-full cursor-pointer" asChild>
						<Link href="/forgot-password">Faire une nouvelle demande</Link>
					</Button>
					<div className="text-center">
						<Link href="/login" className="text-sm text-slate-500 hover:text-primary transition-colors">
							Retour à la connexion
						</Link>
					</div>
				</CardContent>
			</Card>
		);
	}

	// ── Succès ──
	if (done) {
		return (
			<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
				<CardHeader className="space-y-3 pb-6">
					<Link href="/" className="flex justify-center mb-2 group w-fit mx-auto">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white">F</span>
						</div>
					</Link>
					<CardTitle className="text-2xl font-bold text-center text-gradient">Mot de passe changé !</CardTitle>
					<CardDescription className="text-center text-sm text-slate-600">
						Votre mot de passe a été réinitialisé avec succès.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-4 py-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
							<CheckCircle2 className="h-8 w-8 text-emerald-600" />
						</div>
						<p className="text-xs text-slate-500 text-center">
							Vous allez être redirigé vers la page de connexion dans quelques secondes…
						</p>
						<Button variant="gradient" className="w-full cursor-pointer" asChild>
							<Link href="/login">Se connecter maintenant</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// ── Formulaire de réinitialisation ──
	return (
		<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
			<CardHeader className="space-y-3 pb-6">
				<Link href="/" className="flex justify-center mb-2 group w-fit mx-auto">
					<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
						<span className="text-2xl font-bold text-white">F</span>
					</div>
				</Link>
				<CardTitle className="text-2xl font-bold text-center text-gradient">
					Nouveau mot de passe
				</CardTitle>
				<CardDescription className="text-center text-sm text-slate-600">
					Choisissez un mot de passe sécurisé pour votre compte.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-5">
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Nouveau mot de passe */}
					<div className="space-y-1">
						<div className="relative">
							<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
							<Input
								type={showPassword ? "text" : "password"}
								placeholder="Nouveau mot de passe"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 pl-10 pr-11 border-slate-300 focus:border-primary shadow-sm"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
						<PasswordStrength password={newPassword} />
					</div>

					{/* Confirmation */}
					<div className="relative">
						<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						<Input
							type={showConfirm ? "text" : "password"}
							placeholder="Confirmer le mot de passe"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							disabled={isLoading}
							className={`h-12 pl-10 pr-11 border-slate-300 focus:border-primary shadow-sm ${
								confirmPassword && confirmPassword !== newPassword
									? "border-red-400 focus:border-red-400"
									: ""
							}`}
						/>
						<button
							type="button"
							onClick={() => setShowConfirm((v) => !v)}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
						>
							{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{confirmPassword && confirmPassword !== newPassword && (
						<p className="text-xs text-red-500 -mt-2">Les mots de passe ne correspondent pas.</p>
					)}

					<Button
						type="submit"
						variant="gradient"
						size="lg"
						className="w-full h-12 font-semibold hover:scale-103 transition-all duration-300 cursor-pointer"
						disabled={isLoading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
					>
						{isLoading ? "Réinitialisation…" : "Réinitialiser mon mot de passe"}
					</Button>
				</form>

				<div className="text-center pt-2 border-t border-slate-100">
					<Link href="/login" className="text-sm text-slate-500 hover:text-primary transition-colors">
						Retour à la connexion
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Export avec Suspense (useSearchParams) ────────────────────────────────────

export default function ResetPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-linear-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl opacity-20"
					style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.4), transparent)" }}
				/>
				<div
					className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl opacity-20"
					style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent)" }}
				/>
			</div>
			<Suspense fallback={
				<Card className="w-full max-w-md shadow-2xl border-slate-200/50 bg-white/95 z-10">
					<CardContent className="flex items-center justify-center py-16">
						<div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
					</CardContent>
				</Card>
			}>
				<ResetPasswordContent />
			</Suspense>
		</div>
	);
}

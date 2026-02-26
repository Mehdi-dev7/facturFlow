"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsLoading(true);
		try {
			// Better Auth v1.4 : l'endpoint est /request-password-reset (et non /forget-password)
			const res = await fetch("/api/auth/request-password-reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					redirectTo: `${window.location.origin}/reset-password`,
				}),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				console.error("[forgetPassword] Erreur API:", res.status, data);
			}
			// On affiche toujours le succès (même si l'email n'existe pas → sécurité)
			setSent(true);
		} catch (err) {
			console.error(err);
			toast.error("Une erreur est survenue. Veuillez réessayer.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-linear-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
			{/* Fond */}
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

			<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
				<CardHeader className="space-y-3 pb-6">
					<Link href="/" className="flex justify-center mb-2 group w-fit mx-auto">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white">F</span>
						</div>
					</Link>

					{!sent ? (
						<>
							<CardTitle className="text-2xl font-bold text-center text-gradient">
								Mot de passe oublié ?
							</CardTitle>
							<CardDescription className="text-center text-sm text-slate-600">
								Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
							</CardDescription>
						</>
					) : (
						<>
							<CardTitle className="text-2xl font-bold text-center text-gradient">
								Email envoyé !
							</CardTitle>
							<CardDescription className="text-center text-sm text-slate-600">
								Vérifiez votre boîte mail et cliquez sur le lien reçu.
							</CardDescription>
						</>
					)}
				</CardHeader>

				<CardContent className="space-y-5">
					{!sent ? (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="relative">
								<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
								<Input
									type="email"
									placeholder="Votre adresse email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={isLoading}
									className="h-12 pl-10 border-slate-300 focus:border-primary shadow-sm"
								/>
							</div>

							<Button
								type="submit"
								variant="gradient"
								size="lg"
								className="w-full h-12 font-semibold hover:scale-103 transition-all duration-300 cursor-pointer"
								disabled={isLoading}
							>
								{isLoading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
							</Button>
						</form>
					) : (
						<div className="flex flex-col items-center gap-4 py-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
								<CheckCircle2 className="h-8 w-8 text-emerald-600" />
							</div>
							<div className="text-center space-y-1">
								<p className="text-sm font-medium text-slate-800">
									Un email a été envoyé à
								</p>
								<p className="text-sm font-semibold text-violet-600">{email}</p>
								<p className="text-xs text-slate-500 mt-2 leading-relaxed">
									Le lien est valable <strong>1 heure</strong>.<br />
									Pensez à vérifier vos spams si vous ne voyez pas l&apos;email.
								</p>
							</div>
							<Button
								variant="outline"
								className="mt-2 cursor-pointer"
								onClick={() => { setSent(false); setEmail(""); }}
							>
								Renvoyer avec un autre email
							</Button>
						</div>
					)}

					<div className="text-center pt-2 border-t border-slate-100">
						<Link
							href="/login"
							className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors font-medium"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Retour à la connexion
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

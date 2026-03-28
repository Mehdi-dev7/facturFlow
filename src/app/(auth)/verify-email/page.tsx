"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import Logo from "@/components/Logo";

// ── Contenu principal — isolé pour wrapper useSearchParams dans Suspense ──────

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";
	// Plan optionnel propagé depuis /signup pour déclencher le checkout après vérification
	const plan = searchParams.get("plan");
	// Code promo optionnel propagé depuis /signup (ex: "FONDATEUR")
	const promo = searchParams.get("promo");

	const [otp, setOtp] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);

	const handleVerify = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!otp || otp.length !== 6) {
				toast.error("Veuillez saisir un code à 6 chiffres.");
				return;
			}

			setIsVerifying(true);
			try {
				const { error: verifyError } =
					await authClient.emailOtp.verifyEmail({ email, otp });

				if (verifyError) {
					toast.error(verifyError.message ?? "Code invalide ou expiré.");
				} else {
					toast.success("Email vérifié avec succès !");
					// Si un plan est présent, rediriger vers la page d'abonnement (+ promo si présente)
					router.push(
						plan
							? `/dashboard/subscription?checkout=${plan}${promo ? `&promo=${promo}` : ""}`
							: "/dashboard"
					);
				}
			} catch {
				toast.error("Erreur lors de la vérification. Veuillez réessayer.");
			} finally {
				setIsVerifying(false);
			}
		},
		[email, otp, plan, promo, router],
	);

	const handleResend = useCallback(async () => {
		setIsResending(true);
		try {
			const { error: resendError } =
				await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "email-verification",
				});

			if (resendError) {
				toast.error(resendError.message ?? "Impossible de renvoyer le code.");
			} else {
				toast.success("Un nouveau code a été envoyé !");
			}
		} catch {
			toast.error("Erreur lors de l'envoi du code.");
		} finally {
			setIsResending(false);
		}
	}, [email]);

	return (
		<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
			<CardHeader className="space-y-3 pb-8">
				<Link href="/" className="flex justify-center mb-2 group">
					<Logo variant="icon" width={56} height={56} className="shadow-lg group-hover:scale-105 transition-transform rounded-xl" />
				</Link>
				<CardTitle className="text-3xl font-bold text-center text-gradient">
					Vérification de l&apos;e-mail
				</CardTitle>
				<CardDescription className="text-center text-base text-slate-600">
					Un code à 6 chiffres a été envoyé à{" "}
					<span className="font-semibold text-slate-800">{email}</span>
					<span className="block mt-2 text-sm text-slate-400">
						Pensez à vérifier vos spams si vous ne le voyez pas.
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<form onSubmit={handleVerify} className="space-y-4">
					<div className="space-y-2">
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={6}
							placeholder="000000"
							value={otp}
							onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
							required
							disabled={isVerifying}
							className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-slate-300 shadow-sm"
						/>
					</div>

					<Button
						type="submit"
						variant="gradient"
						size="lg"
						className="w-full h-12 font-semibold cursor-pointer"
						disabled={isVerifying || otp.length !== 6}
					>
						{isVerifying ? "Vérification..." : "Vérifier mon email"}
					</Button>
				</form>

				<div className="text-center text-sm pt-4 border-t border-slate-100">
					<span className="text-slate-600">
						Vous n&apos;avez pas reçu de code ?{" "}
					</span>
					<button
						type="button"
						onClick={handleResend}
						disabled={isResending}
						className="text-primary hover:text-secondary font-semibold transition-colors underline-offset-4 hover:underline disabled:opacity-50 cursor-pointer"
					>
						{isResending ? "Envoi en cours..." : "Renvoyer le code"}
					</button>
				</div>
			</CardContent>
		</Card>
	);
}

// ── Page — useSearchParams wrappé dans Suspense (requis par Next.js SSG) ──────

export default function VerifyEmailPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
			{/* Effet de fond */}
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
				<div className="w-full max-w-md h-96 rounded-2xl bg-white/80 animate-pulse" />
			}>
				<VerifyEmailContent />
			</Suspense>
		</div>
	);
}

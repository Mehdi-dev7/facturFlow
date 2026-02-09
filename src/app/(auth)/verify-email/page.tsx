"use client";

import { useState, useCallback } from "react";
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

export default function VerifyEmailPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";

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
					await authClient.emailOtp.verifyEmail({
						email,
						otp,
					});

				if (verifyError) {
					toast.error(
						verifyError.message ?? "Code invalide ou expiré.",
					);
				} else {
					toast.success("Email vérifié avec succès !");
					router.push("/dashboard");
				}
			} catch {
				toast.error("Erreur lors de la vérification. Veuillez réessayer.");
			} finally {
				setIsVerifying(false);
			}
		},
		[email, otp, router],
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
				toast.error(
					resendError.message ??
						"Impossible de renvoyer le code.",
				);
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
		<div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
			{/* Effet de fond élégant */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl opacity-20"
					style={{
						background:
							"radial-gradient(circle, rgba(79, 70, 229, 0.4), transparent)",
					}}
				/>
				<div
					className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl opacity-20"
					style={{
						background:
							"radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent)",
					}}
				/>
			</div>

			<Card className="w-full max-w-md shadow-2xl border-slate-200/50 backdrop-blur-sm bg-white/95 relative z-10">
				<CardHeader className="space-y-3 pb-8">
					<Link href="/" className="flex justify-center mb-2 group">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white">
								F
							</span>
						</div>
					</Link>
					<CardTitle className="text-3xl font-bold text-center text-gradient">
						Vérification email
					</CardTitle>
					<CardDescription className="text-center text-base text-slate-600">
						Un code à 6 chiffres a été envoyé à{" "}
						<span className="font-semibold text-slate-800">
							{email}
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
								onChange={(e) =>
									setOtp(
										e.target.value.replace(/\D/g, ""),
									)
								}
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
							{isVerifying
								? "Vérification..."
								: "Vérifier mon email"}
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
							{isResending
								? "Envoi en cours..."
								: "Renvoyer le code"}
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

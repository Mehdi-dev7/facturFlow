"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Player } from "@lordicon/react";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import GOOGLE_ICON from "@/assets/icons/google.json";
import GITHUB_ICON from "@/assets/icons/github.json";

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

// Icône Microsoft colorée
const MicrosoftIcon = () => (
	<svg className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 23 23">
		<path fill="#f35325" d="M0 0h11v11H0z" />
		<path fill="#81bc06" d="M12 0h11v11H12z" />
		<path fill="#05a6f0" d="M0 12h11v11H0z" />
		<path fill="#ffba08" d="M12 12h11v11H12z" />
	</svg>
);

export default function SignUpPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const googleRef = useRef<Player>(null);
	const githubRef = useRef<Player>(null);

	const handleOAuthSignIn = useCallback(
		async (provider: "google" | "github" | "microsoft") => {
			try {
				setError("");
				await signIn.social({
					provider,
					callbackURL: "/dashboard",
				});
			} catch (err) {
				toast.error("Erreur lors de l'inscription avec " + provider);
				console.error(err);
			}
		},
		[],
	);

	const handleEmailSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const result = signUpSchema.safeParse({
			name,
			email,
			password,
			confirmPassword,
		});

		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}

		setIsLoading(true);

		try {
			const { error: signUpError } = await signUp.email({
				email,
				password,
				name,
			});

			if (signUpError) {
				toast.error(
					signUpError.message ??
						"Cet email est peut-être déjà utilisé.",
				);
				setIsLoading(false);
				return;
			}

			toast.success("Compte créé avec succès ! Vérifiez votre e-mail.");

			// Envoyer l'OTP de vérification
			await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "email-verification",
			});

			// Rediriger vers la page de vérification
			router.push(
				`/verify-email?email=${encodeURIComponent(email)}`,
			);
		} catch (err) {
			toast.error(
				"Erreur lors de l'inscription. Veuillez réessayer.",
			);
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-linear-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
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
					<Link href="/" className="flex justify-center mb-2 group  w-fit mx-auto">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white ">F</span>
						</div>
					</Link>
					<CardTitle className="text-3xl font-bold text-center text-gradient">
						Créer un compte
					</CardTitle>
					<CardDescription className="text-center text-base text-slate-600">
						Commencez à gérer vos factures gratuitement
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Section OAuth */}
					<div className="space-y-3">
						<Button
							variant="outline"
							className="w-full h-12 border-slate-300 hover:border-primary hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
							onClick={() => handleOAuthSignIn("google")}
							onMouseEnter={() => googleRef.current?.playFromBeginning()}
						>
							<Player ref={googleRef} icon={GOOGLE_ICON} size={28} />
							<span className="ml-3">Continuer avec Google</span>
						</Button>
						<Button
							variant="outline"
							className="w-full h-12 border-slate-300 hover:border-primary hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
							onClick={() => handleOAuthSignIn("github")}
							onMouseEnter={() => githubRef.current?.playFromBeginning()}
						>
							<Player ref={githubRef} icon={GITHUB_ICON} size={28} />
							<span className="ml-3">Continuer avec GitHub</span>
						</Button>
						<Button
							variant="outline"
							className="group w-full h-12 border-slate-300 hover:border-primary hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
							onClick={() => handleOAuthSignIn("microsoft")}
						>
							<MicrosoftIcon />
							<span className="ml-3">Continuer avec Microsoft</span>
						</Button>
					</div>

					{/* Séparateur */}
					<div className="relative py-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-slate-200" />
						</div>
						<div className="relative flex justify-center text-sm font-medium">
							<span className="bg-white px-6 text-slate-500">
								Ou avec votre email
							</span>
						</div>
					</div>

					{/* Formulaire Email/Password */}
					<form onSubmit={handleEmailSignUp} className="space-y-4">
						<div className="space-y-2">
							<Input
								type="text"
								placeholder="Nom complet"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 border-slate-300 shadow-sm"
							/>
						</div>
						<div className="space-y-2">
							<Input
								type="email"
								placeholder="Adresse email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 border-slate-300 shadow-sm"
							/>
						</div>
					<div className="space-y-1">
						<div className="relative">
							<Input
								type={showPassword ? "text" : "password"}
								placeholder="Mot de passe"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 pr-11 border-slate-300 shadow-sm"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
						<PasswordStrength password={password} />
					</div>
					<div className="space-y-1">
						<div className="relative">
							<Input
								type={showConfirm ? "text" : "password"}
								placeholder="Confirmer le mot de passe"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
								className={`h-12 pr-11 border-slate-300 shadow-sm ${confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : ""}`}
							/>
							<button
								type="button"
								onClick={() => setShowConfirm((v) => !v)}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
							>
								{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
						{confirmPassword && confirmPassword !== password && (
							<p className="text-red-500 text-xs pl-1">Les mots de passe ne correspondent pas</p>
						)}
					</div>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}

						<Button
							type="submit"
							variant="gradient"
							size="lg"
							className="w-full h-12 font-semibold cursor-pointer hover:scale-103 transition-all duration-300"
							disabled={isLoading}
						>
							{isLoading ? "Création en cours..." : "Créer mon compte"}
						</Button>
					</form>

					{/* Lien vers connexion */}
					<div className="text-center text-sm pt-4 border-t border-slate-100">
						<span className="text-slate-600">Déjà un compte ? </span>
						<Link
							href="/login"
							className="text-primary hover:text-secondary font-semibold transition-colors underline-offset-4 hover:underline"
						>
							Se connecter
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Github } from "lucide-react";

// Icône Google colorée
const GoogleIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 24 24">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
	</svg>
);

// Icône Microsoft colorée
const MicrosoftIcon = () => (
	<svg className="h-5 w-5" viewBox="0 0 23 23">
		<path fill="#f35325" d="M0 0h11v11H0z" />
		<path fill="#81bc06" d="M12 0h11v11H12z" />
		<path fill="#05a6f0" d="M0 12h11v11H0z" />
		<path fill="#ffba08" d="M12 12h11v11H12z" />
	</svg>
);

export default function SignUpPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleOAuthSignIn = async (
		provider: "google" | "github" | "microsoft",
	) => {
		try {
			setError("");
			await signIn.social({
				provider,
				callbackURL: "/dashboard",
			});
		} catch (err) {
			setError("Erreur lors de l'inscription avec " + provider);
			console.error(err);
		}
	};

	const validatePassword = (pwd: string): string | null => {
		if (pwd.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
		if (!/[a-z]/.test(pwd)) return "Le mot de passe doit contenir au moins une minuscule";
		if (!/[A-Z]/.test(pwd)) return "Le mot de passe doit contenir au moins une majuscule";
		if (!/[0-9]/.test(pwd)) return "Le mot de passe doit contenir au moins un chiffre";
		if (!/[!@#$%^&*(),.?":{}|<>_\-+=;'\/\[\]\\`~]/.test(pwd)) return "Le mot de passe doit contenir au moins un caractère spécial (!@#$%...)";
		return null;
	};

	const handleEmailSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (password !== confirmPassword) {
			setError("Les mots de passe ne correspondent pas");
			return;
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			setError(passwordError);
			return;
		}

		setIsLoading(true);

		try {
			await signUp.email({
				email,
				password,
				name,
				callbackURL: "/dashboard",
			});
		} catch (err) {
			setError(
				"Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.",
			);
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

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
							<span className="text-2xl font-bold text-white">F</span>
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
						>
							<GoogleIcon />
							<span className="ml-3">Continuer avec Google</span>
						</Button>
						<Button
							variant="outline"
							className="w-full h-12 border-slate-300 hover:border-primary hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
							onClick={() => handleOAuthSignIn("github")}
						>
							<Github className="h-5 w-5" />
							<span className="ml-3">Continuer avec GitHub</span>
						</Button>
						<Button
							variant="outline"
							className="w-full h-12 border-slate-300 hover:border-primary hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
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
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Mot de passe (Aa1! min. 8 car.)"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								minLength={8}
								className="h-12 border-slate-300 shadow-sm"
							/>
						</div>
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Confirmer le mot de passe"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 border-slate-300 shadow-sm"
							/>
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
							className="w-full h-12 font-semibold cursor-pointer"
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

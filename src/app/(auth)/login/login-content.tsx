"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function GoogleIcon() {
	return (
		<svg className="group-hover:rotate-180 transition-transform duration-500" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
		</svg>
	);
}

function GitHubIcon() {
	return (
		<svg className="group-hover:rotate-180 transition-transform duration-500" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
		</svg>
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

export default function LoginContent() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);


	const handleOAuthSignIn = async (
		provider: "google" | "github" | "microsoft",
	) => {
		try {
			await signIn.social({
				provider,
				callbackURL: "/dashboard",
			});
		} catch (err) {
			toast.error("Erreur lors de la connexion avec " + provider);
			console.error(err);
		}
	};

	const handleEmailSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await signIn.email({
				email,
				password,
				callbackURL: "/dashboard",
			});
		} catch (err) {
			toast.error("Email ou mot de passe incorrect");
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
					<Link href="/" className="flex justify-center mb-2 group w-fit mx-auto">
						<div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
							<span className="text-2xl font-bold text-white">F</span>
						</div>
					</Link>
					<CardTitle className="text-3xl font-bold text-center text-gradient">
						Connexion
					</CardTitle>
					<CardDescription className="text-center text-base text-slate-600">
						Accédez à votre espace FacturNow
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
					<form onSubmit={handleEmailSignIn} className="space-y-4">
						<div className="space-y-2">
							<Input
								type="email"
								placeholder="Adresse email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 border-slate-300 focus:border-primary shadow-sm"
							/>
						</div>
					<div className="space-y-2">
						<Input
							type="password"
							placeholder="Mot de passe"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={isLoading}
							className="h-12 border-slate-300 focus:border-primary shadow-sm"
						/>
						<div className="flex justify-end">
							<Link
								href="/forgot-password"
								className="text-xs text-slate-500 hover:text-primary transition-colors"
							>
								Mot de passe oublié ?
							</Link>
						</div>
					</div>

						<Button
							type="submit"
							variant="gradient"
							size="lg"
							className="w-full h-12 font-semibold hover:scale-103 transition-all duration-300 cursor-pointer"
							disabled={isLoading}
						>
							{isLoading ? "Connexion en cours..." : "Se connecter"}
						</Button>
					</form>

					{/* Lien vers inscription */}
					<div className="text-center text-sm pt-4 border-t border-slate-100">
						<span className="text-slate-600">Pas encore de compte ? </span>
						<Link
							href="/signup"
							className="text-primary hover:text-secondary font-semibold transition-colors underline-offset-4 hover:underline"
						>
							Créer un compte
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

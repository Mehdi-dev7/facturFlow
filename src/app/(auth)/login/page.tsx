"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Player } from "@lordicon/react";
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

const GOOGLE_ICON = require("@/assets/icons/google.json");
const GITHUB_ICON = require("@/assets/icons/github.json");

// Icône Microsoft colorée
const MicrosoftIcon = () => (
	<svg className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 23 23">
		<path fill="#f35325" d="M0 0h11v11H0z" />
		<path fill="#81bc06" d="M12 0h11v11H12z" />
		<path fill="#05a6f0" d="M0 12h11v11H0z" />
		<path fill="#ffba08" d="M12 12h11v11H12z" />
	</svg>
);

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const googleRef = useRef<Player>(null);
	const githubRef = useRef<Player>(null);

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
						Accédez à votre espace FacturFlow
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

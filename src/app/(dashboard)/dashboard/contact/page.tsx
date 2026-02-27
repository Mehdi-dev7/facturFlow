import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Send } from "lucide-react";

export const metadata: Metadata = {
	title: "Contact Support | FacturFlow",
	description: "Contactez notre équipe support pour toute question ou assistance",
};

export default function ContactPage() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gradient mb-2">Contact Support</h1>
				<p className="text-slate-600 dark:text-slate-400">
					Besoin d'aide ? Notre équipe est là pour vous accompagner.
				</p>
			</div>

			{/* Placeholder Card */}
			<Card className="shadow-lg border-primary/20">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<div>
							<CardTitle>Formulaire de contact</CardTitle>
							<CardDescription>
								Envoyez-nous un message et nous vous répondrons rapidement
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-8 text-center">
						<MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-3" />
						<p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
							Formulaire de contact en cours de développement
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-500">
							Cette fonctionnalité sera disponible prochainement.
						</p>
					</div>

					{/* Contact alternatif */}
					<div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
						<Send className="h-5 w-5 text-primary shrink-0" />
						<div className="flex-1">
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
								Besoin d'aide immédiate ?
							</p>
							<p className="text-xs text-slate-600 dark:text-slate-400">
								Contactez-nous par email : <a href="mailto:support@facturflow.fr" className="text-primary hover:underline">support@facturflow.fr</a>
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

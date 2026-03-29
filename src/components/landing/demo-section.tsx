"use client";

import { Play } from "lucide-react";
import { useState } from "react";

// ─── Section Démo Vidéo ─────────────────────────────────────────────────────
// Affichée quand l'utilisateur clique sur "Voir la démo" dans le Hero.
// Le bouton Hero scrolle vers l'id="demo" (scroll smooth).

export function DemoSection() {
	const [playing, setPlaying] = useState(false);

	return (
		<section
			id="demo"
			className="relative bg-linear-to-b from-white via-slate-50 to-white py-20 xl:py-28 overflow-hidden"
		>
			{/* Fond décoratif */}
			<div className="absolute inset-0 pointer-events-none">
				<div
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 rounded-full blur-3xl opacity-20"
					style={{
						background:
							"radial-gradient(ellipse, rgba(99,102,241,0.5), rgba(139,92,246,0.4), transparent)",
					}}
				/>
			</div>

			<div className="relative z-10 w-full px-4 sm:px-[8%] xl:px-[12%]">
				{/* En-tête */}
				<div className="text-center mb-10">
					<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold mb-4">
						<Play className="h-3.5 w-3.5 fill-primary" />
						Démo en direct
					</span>
					<h2 className="text-3xl md:text-4xl xl:text-5xl text-slate-900 mb-4">
						Voir <span className="text-gradient">FacturNow</span> en action
					</h2>
					<p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
						Découvrez comment créer une facture, un devis et etre payer en quelques clics.
					</p>
				</div>

				{/* Lecteur vidéo */}
				<div className="max-w-4xl mx-auto">
					<div
						className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 ring-1 ring-black/5 bg-black"
						style={{ aspectRatio: "16/9" }}
					>
						{/* Barre navigateur décorative */}
						<div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/80 backdrop-blur-sm px-4 py-2 flex items-center gap-2">
							<div className="flex gap-1.5">
								<div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
								<div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
								<div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
							</div>
							<div className="flex-1 mx-3 bg-white/10 rounded-md px-3 py-0.5 text-[10px] text-slate-400">
								app.facturnow.fr/dashboard
							</div>
						</div>

						{/* Vidéo */}
						<video
							className="w-full h-full object-cover pt-8"
							controls
							preload="metadata"
							poster=""
							onPlay={() => setPlaying(true)}
							onPause={() => setPlaying(false)}
						>
							<source src="/videos/video_final.mov" type="video/quicktime" />
							<source src="/videos/video_final.mov" type="video/mp4" />
							Votre navigateur ne supporte pas la lecture vidéo.
						</video>

						{/* Overlay play si pas encore démarré */}
						{!playing && (
							<div
								className="absolute inset-0 top-8 flex items-center justify-center bg-black/20 cursor-pointer group"
								onClick={(e) => {
									// Déclenche le play sur la vidéo
									const video = (e.currentTarget.parentElement as HTMLElement)?.querySelector("video");
									video?.play();
								}}
							>
								<div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
									<Play className="h-8 w-8 text-primary fill-primary ml-1" />
								</div>
							</div>
						)}
					</div>

					{/* Sous-texte */}
					<p className="text-center text-xs sm:text-sm text-slate-500 mt-4">
						Durée : ~3 min • Aucune inscription requise pour regarder
					</p>
				</div>
			</div>
		</section>
	);
}

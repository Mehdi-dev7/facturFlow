"use client";

// Bouton de création avec animation de progression (anneau SVG 2s)
// Anti-double-clic : se désactive immédiatement au clic, se réactive après 2s
// Usage : remplace tous les boutons "Créer" du projet

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Durée de l'animation en ms
const DURATION_MS = 2000;
// Rayon du cercle SVG
const R = 7;
// Circonférence = 2πr ≈ 43.98 (utilisé pour strokeDashoffset)
const CIRC = 2 * Math.PI * R;

interface CreateButtonProps {
	label: string;
	/** Prop externe — garde le btn disabled après la fin du countdown (ex: isSubmitting parent) */
	disabled?: boolean;
	size?: "sm" | "default" | "lg";
	/** Pour les boutons type="submit" dans un <form> */
	type?: "button" | "submit";
	/** Pour les boutons type="button" avec handler explicite (steppers) */
	onClick?: () => void;
	className?: string;
	/** Variant du Button shadcn — default: "gradient" */
	variant?: "gradient" | "default" | "outline" | "ghost";
}

export function CreateButton({
	label,
	disabled = false,
	size = "default",
	type = "button",
	onClick,
	className,
	variant = "gradient",
}: CreateButtonProps) {
	const [counting, setCounting] = useState(false);

	const handleClick = useCallback(() => {
		if (counting || disabled) return;
		setCounting(true);
		onClick?.();
		setTimeout(() => setCounting(false), DURATION_MS);
	}, [counting, disabled, onClick]);

	const isDisabled = disabled || counting;

	return (
		<Button
			type={type}
			variant={variant}
			size={size}
			disabled={isDisabled}
			onClick={handleClick}
			className={`cursor-pointer transition-all duration-300 hover:scale-105 disabled:opacity-90 disabled:cursor-not-allowed disabled:scale-100 ${className ?? ""}`}
		>
			{label}
			{counting ? (
				// Anneau SVG de progression — tourne pendant 2s puis disparaît
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					className="-rotate-90 shrink-0"
					aria-hidden
				>
					{/* Track gris semi-transparent (fond de l'anneau) */}
					<circle
						cx="9"
						cy="9"
						r={R}
						fill="none"
						stroke="rgba(255,255,255,0.3)"
						strokeWidth="1.8"
					/>
					{/* Arc animé blanc qui se remplit en 2s */}
					<circle
						cx="9"
						cy="9"
						r={R}
						fill="none"
						stroke="white"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeDasharray={CIRC}
						style={{
							strokeDashoffset: CIRC,
							animation: `create-btn-ring ${DURATION_MS}ms linear forwards`,
						}}
					/>
				</svg>
			) : (
				<Check className="size-4 shrink-0" />
			)}
		</Button>
	);
}

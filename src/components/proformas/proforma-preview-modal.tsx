"use client";
// Modal de prévisualisation d'une proforma enregistrée avec actions

import { useCallback, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Printer,
	Download,
	Send,
	Pencil,
	X,
	Trash2,
	FileText,
	ArrowRight,
	Loader2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	useDeleteProforma,
	useDuplicateProforma,
	useConvertProformaToInvoice,
	type SavedProforma,
} from "@/hooks/use-proformas";
import { sendProformaEmail } from "@/lib/actions/send-proforma-email";
import {
	INVOICE_TYPE_CONFIG,
	INVOICE_TYPE_LABELS,
	type InvoiceType,
} from "@/lib/validations/invoice";
import {
	getFontFamily,
	getFontWeight,
} from "@/components/appearance/theme-config";

// Couleur orange dédiée aux proformas
const PROFORMA_COLOR = "#ea580c";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProformaPreviewModalProps {
	proforma: SavedProforma | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
	return n.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function formatDate(dateStr: string | null) {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function getClientName(client: SavedProforma["client"]) {
	if (client.companyName) return client.companyName;
	const parts = [client.firstName, client.lastName].filter(Boolean);
	return parts.join(" ") || client.email;
}

// ─── Aperçu statique de la proforma ──────────────────────────────────────────

function ProformaPreviewStatic({ proforma }: { proforma: SavedProforma }) {
	const emitter = useMemo(() => {
		if (proforma.user.companyName) return proforma.user;
		try {
			const saved = localStorage.getItem("facturnow_company");
			if (saved) {
				const c = JSON.parse(saved) as {
					name?: string;
					siret?: string;
					address?: string;
					city?: string;
					email?: string;
					zipCode?: string;
				};
				return {
					companyName: c.name ?? null,
					companySiret: c.siret ?? null,
					companyAddress: c.address ?? null,
					companyPostalCode: c.zipCode ?? null,
					companyCity: c.city ?? null,
					companyEmail: c.email ?? null,
				};
			}
		} catch {
			/* ignore */
		}
		return proforma.user;
	}, [proforma.user]);

	const invoiceType = (proforma.invoiceType ?? "basic") as InvoiceType;
	const typeConfig =
		INVOICE_TYPE_CONFIG[invoiceType] ?? INVOICE_TYPE_CONFIG["basic"];
	const isForfait = typeConfig.quantityLabel === null;

	const discount = proforma.discount ?? 0;
	const vatRate = 20;
	const sortedLines = [...proforma.lineItems].sort(
		(a, b) => a.order - b.order,
	);

	const themeColor = proforma.user.themeColor ?? PROFORMA_COLOR;
	const logo = proforma.user.companyLogo;
	const displayName = proforma.user.companyName ?? "";
	const companyFont = proforma.user.companyFont ?? "inter";
	const fontFamily = getFontFamily(companyFont);
	const fontWeight = getFontWeight(companyFont);

	return (
		<div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-sm">
			{/* En-tête */}
			<div
				className="rounded-lg p-4 text-white mb-6"
				style={{ backgroundColor: themeColor }}
			>
				<div className="flex items-start gap-4">
					{/* Gauche : PROFORMA + N° */}
					<div className="flex-1">
						<h1 className="text-lg md:text-xl font-bold mb-1">PROFORMA</h1>
						<p className="text-white/90 text-xs md:text-sm">
							N° {proforma.number}
						</p>
						{invoiceType !== "basic" && (
							<span className="inline-block mt-1.5 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
								{INVOICE_TYPE_LABELS[invoiceType]}
							</span>
						)}
					</div>
					{/* Centre : logo + nom */}
					<div className="flex-1 flex flex-col items-center gap-1.5">
						{logo && (
							<div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
								<img
									src={logo}
									alt="Logo"
									className="w-full h-full object-cover"
								/>
							</div>
						)}
						{displayName && (
							<p
								className="text-white/90 text-sm font-bold text-center"
								style={{ fontFamily, fontWeight }}
							>
								{displayName}
							</p>
						)}
					</div>
					{/* Droite : dates */}
					<div className="flex-1 flex flex-col items-end text-right text-xs md:text-sm">
						<p className="text-white/90">
							Date : {formatDate(proforma.date)}
						</p>
						{proforma.dueDate && (
							<p className="text-white/90">
								Échéance : {formatDate(proforma.dueDate)}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Émetteur et destinataire */}
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h3
						className="font-semibold mb-2 text-xs uppercase tracking-wide"
						style={{ color: themeColor }}
					>
						Émetteur
					</h3>
					{emitter.companyName ? (
						<div className="text-sm space-y-0.5">
							<p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
								{emitter.companyName}
							</p>
							{emitter.companyAddress && (
								<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
									{emitter.companyAddress}
								</p>
							)}
							{(emitter.companyPostalCode || emitter.companyCity) && (
								<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
									{[emitter.companyPostalCode, emitter.companyCity]
										.filter(Boolean)
										.join(" ")}
								</p>
							)}
							{emitter.companySiret && (
								<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
									SIRET : {emitter.companySiret}
								</p>
							)}
							{emitter.companyEmail && (
								<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
									{emitter.companyEmail}
								</p>
							)}
						</div>
					) : (
						<p className="text-slate-400 text-xs lg:text-sm italic">
							Informations émetteur manquantes
						</p>
					)}
				</div>

				<div>
					<h3
						className="font-semibold mb-2 text-xs uppercase tracking-wide"
						style={{ color: themeColor }}
					>
						Destinataire
					</h3>
					<div className="text-sm space-y-0.5">
						<p className="font-medium text-slate-900 dark:text-slate-50 text-xs lg:text-sm">
							{getClientName(proforma.client)}
						</p>
						<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
							{proforma.client.email}
						</p>
						{proforma.client.address && (
							<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
								{proforma.client.address}
							</p>
						)}
						{(proforma.client.postalCode || proforma.client.city) && (
							<p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-xs">
								{[proforma.client.postalCode, proforma.client.city]
									.filter(Boolean)
									.join(" ")}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="h-px bg-slate-200 dark:bg-slate-700" />

			{/* Lignes */}
			<div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
				<table className="w-full text-sm table-fixed">
						<colgroup>
							<col />
							{!isForfait && <col style={{ width: "10%" }} />}
							<col style={{ width: "18%" }} />
							{!isForfait && <col style={{ width: "18%" }} />}
						</colgroup>
					<thead style={{ backgroundColor: themeColor + "1a" }}>
						<tr>
							<th
								className="text-left p-2 lg:p-3 text-xs font-medium uppercase tracking-wide"
								style={{ color: themeColor }}
							>
								{typeConfig.descriptionLabel}
							</th>
							{!isForfait && (
								<th
									className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap"
									style={{ color: themeColor }}
								>
									{typeConfig.quantityLabel}
								</th>
							)}
							<th
								className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap"
								style={{ color: themeColor }}
							>
								{isForfait ? "Montant" : "Prix unit."}
							</th>
							{!isForfait && (
								<th
									className="text-right p-2 lg:p-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap"
									style={{ color: themeColor }}
								>
									Total HT
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{sortedLines.map((line) => (
							<tr
								key={line.id}
								className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
							>
								<td className="p-2 lg:p-3 text-xs lg:text-sm text-slate-900 dark:text-slate-50 break-all">
									{line.description}
								</td>
								{!isForfait && (
									<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50 whitespace-nowrap overflow-hidden">
										{line.quantity}
									</td>
								)}
								<td className="p-2 lg:p-3 text-xs lg:text-sm text-right text-slate-900 dark:text-slate-50 whitespace-nowrap overflow-hidden">
									{fmt(line.unitPrice)} €
								</td>
								{!isForfait && (
									<td
										className="p-2 lg:p-3 text-xs lg:text-sm text-right font-medium whitespace-nowrap overflow-hidden"
										style={{ color: themeColor }}
									>
										{fmt(line.subtotal)} €
									</td>
								)}
							</tr>
						))}
						{sortedLines.length === 0 && (
							<tr>
								<td
									colSpan={isForfait ? 2 : 4}
									className="py-6 text-center text-xs text-slate-400 italic"
								>
									Aucune ligne
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="h-px bg-slate-200 dark:bg-slate-700" />

			{/* Totaux */}
			<div className="flex justify-end">
				<div
					className="w-64 space-y-1.5 rounded-lg p-3 border"
					style={{
						backgroundColor: themeColor + "0d",
						borderColor: themeColor + "33",
					}}
				>
					<div className="flex justify-between text-xs lg:text-sm">
						<span className="text-slate-500 dark:text-slate-400 shrink-0">
							Sous-total HT
						</span>
						<span className="text-slate-800 dark:text-slate-100 font-medium truncate ml-2">
							{fmt(proforma.subtotal)} €
						</span>
					</div>
					{discount > 0 && (
						<div className="flex justify-between text-xs lg:text-sm">
							<span className="text-slate-500 dark:text-slate-400 shrink-0">
								Réduction
							</span>
							<span className="text-rose-600 font-medium truncate ml-2">
								−{fmt(discount)} €
							</span>
						</div>
					)}
					<div className="flex justify-between text-xs lg:text-sm">
						<span className="text-slate-500 dark:text-slate-400 shrink-0">
							TVA ({vatRate}%)
						</span>
						<span className="text-slate-800 dark:text-slate-100 font-medium truncate ml-2">
							{fmt(proforma.taxTotal)} €
						</span>
					</div>
					<div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
					<div className="flex justify-between text-sm lg:text-base font-bold">
						<span className="text-slate-900 dark:text-slate-50 shrink-0">
							Total TTC
						</span>
						<span className="truncate ml-2" style={{ color: themeColor }}>
							{fmt(proforma.total)} €
						</span>
					</div>
				</div>
			</div>

			{/* Notes */}
			{proforma.notes && (
				<div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3 text-[11px] lg:text-xs text-slate-600 dark:text-slate-300">
					<p
						className="font-medium mb-1 text-xs lg:text-sm"
						style={{ color: themeColor }}
					>
						Notes
					</p>
					<p className="whitespace-pre-line">{proforma.notes}</p>
				</div>
			)}

			{/* Lien vers la facture convertie */}
			{proforma.convertedInvoiceId && proforma.convertedInvoiceNumber && (
				<div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-3 flex items-center gap-2">
					<FileText className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
					<p className="text-xs text-emerald-700 dark:text-emerald-300 flex-1">
						Converti en facture{" "}
						<strong>{proforma.convertedInvoiceNumber}</strong>
					</p>
				</div>
			)}

			{/* Footer */}
			<div className="text-center text-[10px] lg:text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700">
				<p>Document généré par FacturNow</p>
			</div>
		</div>
	);
}

// ─── Composant principal : modal ──────────────────────────────────────────────

export function ProformaPreviewModal({
	proforma,
	open,
	onOpenChange,
}: ProformaPreviewModalProps) {
	const router = useRouter();
	const deleteMutation = useDeleteProforma();
	const convertMutation = useConvertProformaToInvoice();
	const duplicateMutation = useDuplicateProforma();

	const [isSending, setIsSending] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	// Peut-on encore convertir ? (pas déjà ACCEPTED + pas déjà convertie)
	const canConvert = useMemo(
		() =>
			proforma &&
			proforma.status !== "ACCEPTED" &&
			!proforma.convertedInvoiceId,
		[proforma],
	);

	const handlePrint = useCallback(() => {
		const printArea = document.getElementById("proforma-print-area");
		if (!printArea) return;
		const styles = Array.from(
			document.querySelectorAll('link[rel="stylesheet"], style'),
		)
			.map((el) => el.outerHTML)
			.join("\n");
		const win = window.open("", "_blank", "width=800,height=1100");
		if (!win) return;
		win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Proforma ${proforma?.number ?? ""}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 10mm; }
    body { margin: 0; padding: 20px; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>${printArea.innerHTML}</body></html>`);
		win.document.close();
		win.onload = () => {
			win.print();
			win.close();
		};
		setTimeout(() => {
			try {
				win.print();
				win.close();
			} catch {
				/* déjà fermé */
			}
		}, 1500);
	}, [proforma]);

	const handleDownload = useCallback(async () => {
		if (!proforma || isDownloading) return;
		setIsDownloading(true);
		try {
			const { downloadProformaPDF } = await import("@/lib/pdf/proforma-pdf");
			await downloadProformaPDF(proforma);
		} catch (err) {
			console.error("[proforma] Erreur PDF:", err);
			toast.error("Erreur lors de la génération du PDF");
		} finally {
			setIsDownloading(false);
		}
	}, [proforma, isDownloading]);

	const handleSend = useCallback(async () => {
		if (!proforma || isSending) return;
		setIsSending(true);
		const result = await sendProformaEmail(proforma.id);
		if (result.success) {
			toast.success(`Proforma envoyée à ${proforma.client.email}`);
		} else {
			toast.error(result.error ?? "Erreur lors de l'envoi");
		}
		setIsSending(false);
	}, [proforma, isSending]);

	const handleEdit = useCallback(() => {
		if (!proforma) return;
		router.push(`/dashboard/proformas/${proforma.id}/edit`);
		onOpenChange(false);
	}, [proforma, router, onOpenChange]);

	const handleConvert = useCallback(() => {
		if (!proforma) return;
		convertMutation.mutate(proforma.id);
	}, [proforma, convertMutation]);

	const handleDelete = useCallback(() => {
		if (!proforma) return;
		onOpenChange(false);
		setDeleteConfirmOpen(true);
	}, [proforma, onOpenChange]);

	const handleConfirmDelete = useCallback(async () => {
		if (!proforma || isDeleting) return;
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync(proforma.id);
			setDeleteConfirmOpen(false);
			onOpenChange(false);
		} catch (error) {
			console.error("Erreur suppression:", error);
		} finally {
			setIsDeleting(false);
		}
	}, [proforma, isDeleting, deleteMutation, onOpenChange]);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className="w-[95vw] h-[90vh] sm:w-[90vw] sm:h-auto sm:max-w-2xl md:max-w-3xl lg:max-w-5xl bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl overflow-hidden p-0"
					showCloseButton={false}
				>
					<DialogHeader className="px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-5 pb-2 sm:pb-3 md:pb-4 border-b border-slate-200 dark:border-violet-500/20">
						{/* Titre + croix */}
						<div className="flex items-center justify-between">
							<DialogTitle className="text-slate-900 dark:text-slate-100 text-base font-semibold mx-2 md:mx-0">
								{proforma ? proforma.number : "Proforma"}
							</DialogTitle>
							<button
								onClick={() => onOpenChange(false)}
								aria-label="Fermer"
								className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
							>
								<X size={16} />
							</button>
						</div>

						{/* Boutons d'action */}
						<div className="mt-3 mx-2 md:mx-0">
							{/* Mobile */}
							<div className="block md:hidden">
								<div className="flex items-center justify-between mb-3">
									<div className="flex gap-2">
										<button
											onClick={handlePrint}
											disabled={!proforma}
											className="rounded-lg border p-2 text-sm font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											<Printer size={16} />
										</button>
										<button
											onClick={handleDownload}
											disabled={!proforma || isDownloading}
											className="rounded-lg border p-2 text-sm font-medium transition-colors border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											{isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
										</button>
										<button
											onClick={handleEdit}
											disabled={!proforma}
											className="rounded-lg border p-2 text-sm font-medium transition-colors border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											<Pencil size={16} />
										</button>
									</div>
									<button
										onClick={handleDelete}
										disabled={!proforma || isDeleting}
										className="rounded-lg border p-2 text-sm font-medium transition-colors border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<Trash2 size={16} />
									</button>
								</div>
								<div className="flex flex-wrap gap-2">
									<button
										onClick={handleSend}
										disabled={!proforma || isSending}
										className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<Send size={14} />
										{isSending ? "Envoi..." : "Envoyer"}
									</button>
									{canConvert && (
										<button
											onClick={handleConvert}
											disabled={convertMutation.isPending}
											className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											<ArrowRight size={14} />
											{convertMutation.isPending ? "Conversion..." : "Convertir"}
										</button>
									)}
								</div>
							</div>

							{/* Desktop */}
							<div className="hidden md:flex items-center justify-between">
								<div className="flex flex-wrap gap-2">
									<button
										onClick={handlePrint}
										disabled={!proforma}
										className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<Printer size={14} />
										Imprimer
									</button>
									<button
										onClick={handleDownload}
										disabled={!proforma || isDownloading}
										className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500 dark:text-sky-400 dark:hover:bg-sky-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										{isDownloading ? (
											<Loader2 size={14} className="animate-spin" />
										) : (
											<Download size={14} />
										)}
										PDF
									</button>
									<button
										onClick={handleEdit}
										disabled={!proforma}
										className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<Pencil size={14} />
										Éditer
									</button>
									<button
										onClick={handleSend}
										disabled={!proforma || isSending}
										className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<Send size={14} />
										{isSending ? "Envoi..." : "Envoyer"}
									</button>
									{canConvert && (
										<button
											onClick={handleConvert}
											disabled={convertMutation.isPending}
											className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										>
											<ArrowRight size={14} />
											{convertMutation.isPending
												? "Conversion..."
												: "Convertir en facture"}
										</button>
									)}
								</div>
								<button
									onClick={handleDelete}
									disabled={!proforma || isDeleting}
									className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors gap-2 flex items-center border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
								>
									<Trash2 size={14} />
									{isDeleting ? "Suppression..." : "Supprimer"}
								</button>
							</div>
						</div>
					</DialogHeader>

					{/* Corps scrollable */}
					<div
						id="proforma-print-area"
						className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[80vh] md:max-h-[70vh] p-2 xs:p-3 md:p-5"
					>
						{proforma ? (
							<ProformaPreviewStatic proforma={proforma} />
						) : (
							<div className="space-y-4 animate-pulse">
								<div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
								<div className="grid grid-cols-2 gap-4">
									<div className="h-20 rounded bg-slate-200 dark:bg-slate-700" />
									<div className="h-20 rounded bg-slate-200 dark:bg-slate-700" />
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<DeleteConfirmModal
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
				documentLabel="la proforma"
				documentNumber={proforma?.number ?? ""}
			/>
		</>
	);
}

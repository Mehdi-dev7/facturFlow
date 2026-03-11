"use client";

import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
	PageHeader,
	KpiCard,
	SearchBar,
	MonthSelector,
	DataTable,
	ActionButtons,
	ArchiveSection,
} from "@/components/dashboard";
import type { KpiData, Column } from "@/components/dashboard";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { AllStatus } from "@/components/dashboard/status-badge";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import {
	useProformas,
	useDeleteProforma,
	type SavedProforma,
} from "@/hooks/use-proformas";
import { ProformaPreviewModal } from "@/components/proformas/proforma-preview-modal";

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface ProformaRow {
	id: string;
	number: string;
	client: string;
	date: string;
	amount: string;
	status: AllStatus;
	dbStatus: string;
	convertedInvoiceNumber: string | null;
	convertedInvoiceId: string | null;
}

function mapDocStatus(status: string): AllStatus {
	switch (status) {
		case "DRAFT":
			return "brouillon";
		case "SENT":
			return "envoyée";
		case "ACCEPTED":
			return "accepté";
		default:
			return "brouillon";
	}
}

function getClientName(client: SavedProforma["client"]): string {
	if (client.companyName) return client.companyName;
	const parts = [client.firstName, client.lastName].filter(Boolean);
	return parts.join(" ") || client.email;
}

function formatDateFR(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatAmountFR(amount: number): string {
	return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function toRow(p: SavedProforma): ProformaRow {
	return {
		id: p.id,
		number: p.number,
		client: getClientName(p.client),
		date: formatDateFR(p.date),
		amount: formatAmountFR(p.total),
		status: mapDocStatus(p.status),
		dbStatus: p.status,
		convertedInvoiceNumber: p.convertedInvoiceNumber ?? null,
		convertedInvoiceId: p.convertedInvoiceId ?? null,
	};
}

function getMonthKey(dateStr: string): string {
	const d = new Date(dateStr);
	const m = String(d.getMonth() + 1).padStart(2, "0");
	return `${d.getFullYear()}-${m}`;
}



// ─── Composant interne (lit searchParams) ─────────────────────────────────────

function ProformasPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const previewId = searchParams.get("preview");

	const [search, setSearch] = useState("");
	const [selectedMonth, setSelectedMonth] = useState(() => new Date());
	const [previewProforma, setPreviewProforma] = useState<SavedProforma | null>(
		null,
	);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	const { data: allProformas = [], isLoading } = useProformas();
	const deleteMutation = useDeleteProforma();

	// Highlight après création (3.5s)
	const [highlightedIds, setHighlightedIds] = useState<Set<string>>(
		new Set(),
	);
	useEffect(() => {
		if (!allProformas.length) return;
		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		const seen = new Set<string>(
			JSON.parse(
				localStorage.getItem("highlight_proformas") ?? "[]",
			),
		);
		const ids = allProformas
			.filter(
				(p) =>
					p.status === "ACCEPTED" &&
					p.updatedAt &&
					new Date(p.updatedAt).getTime() > sevenDaysAgo &&
					!seen.has(p.id),
			)
			.map((p) => p.id);
		if (!ids.length) return;
		const newSeen = [...seen, ...ids];
		localStorage.setItem("highlight_proformas", JSON.stringify(newSeen));
		setHighlightedIds(new Set(ids));
		const t = setTimeout(() => setHighlightedIds(new Set()), 3600);
		return () => clearTimeout(t);
	}, [allProformas]);

	// Map id → SavedProforma pour accès rapide
	const proformaMap = useMemo(() => {
		const m = new Map<string, SavedProforma>();
		for (const p of allProformas) m.set(p.id, p);
		return m;
	}, [allProformas]);

	// Ouvrir la modal si ?preview=<id> dans l'URL
	const previewOpenedRef = useRef(false);
	useEffect(() => {
		if (!previewId || isLoading || previewOpenedRef.current) return;
		const p = proformaMap.get(previewId);
		if (p) {
			previewOpenedRef.current = true;
			setPreviewProforma(p);
			setPreviewOpen(true);
		}
	}, [previewId, proformaMap, isLoading]);

	const handlePreviewClose = useCallback(
		(open: boolean) => {
			setPreviewOpen(open);
			if (!open && previewId) {
				previewOpenedRef.current = false;
				router.replace("/dashboard/proformas", { scroll: false });
			}
		},
		[previewId, router],
	);

	const handleSearch = useCallback(
		(value: string) => setSearch(value),
		[],
	);
	const handleMonthChange = useCallback(
		(date: Date) => setSelectedMonth(date),
		[],
	);

	const selectedMonthKey = useMemo(() => {
		const m = String(selectedMonth.getMonth() + 1).padStart(2, "0");
		return `${selectedMonth.getFullYear()}-${m}`;
	}, [selectedMonth]);

	const allRows = useMemo(
		() => allProformas.map(toRow),
		[allProformas],
	);

	const monthRows = useMemo(
		() =>
			allRows.filter((row) => {
				const p = proformaMap.get(row.id);
				return p ? getMonthKey(p.date) === selectedMonthKey : false;
			}),
		[allRows, proformaMap, selectedMonthKey],
	);

	const filteredRows = useMemo(() => {
		if (!search.trim()) return monthRows;
		const query = search.toLowerCase();
		return monthRows.filter(
			(row) =>
				row.number.toLowerCase().includes(query) ||
				row.client.toLowerCase().includes(query) ||
				row.status.toLowerCase().includes(query),
		);
	}, [monthRows, search]);

	// KPIs du mois courant
	const kpis = useMemo((): KpiData[] => {
		const total = monthRows.length;
		const pending = monthRows.filter((r) => r.status === "envoyée").length;
		const validated = monthRows.filter((r) => r.status === "accepté").length;
		const totalAmount = monthRows.reduce((sum, r) => {
			const p = proformaMap.get(r.id);
			return sum + (p?.total ?? 0);
		}, 0);

		return [
			{
				label: "Total proformas",
				value: String(total),
				change: `${total} proforma${total > 1 ? "s" : ""}`,
				changeType: "up",
				icon: "file",
				iconBg: "bg-orange-500",
				borderAccent: "border-orange-500/30",
				gradientFrom: "#fff7ed",
				gradientTo: "#fed7aa",
				darkGradientFrom: "#3a1a0a",
				darkGradientTo: "#7c2d12",
			},
			{
				label: "En attente",
				value: String(pending),
				change: `${pending} envoyée${pending > 1 ? "s" : ""}`,
				changeType: "neutral",
				icon: "clock",
				iconBg: "bg-amber-500",
				borderAccent: "border-amber-500/30",
				gradientFrom: "#fffbeb",
				gradientTo: "#fde68a",
				darkGradientFrom: "#3a1a0a",
				darkGradientTo: "#78350f",
			},
			{
				label: "Validées",
				value: String(validated),
				change: `${validated} validée${validated > 1 ? "s" : ""}`,
				changeType: "up",
				icon: "check",
				iconBg: "bg-emerald-500",
				borderAccent: "border-emerald-500/30",
				gradientFrom: "#ecfdf5",
				gradientTo: "#a7f3d0",
				darkGradientFrom: "#1e1b4b",
				darkGradientTo: "#064e3b",
			},
			{
				label: "Montant proformas",
				value:
					totalAmount.toLocaleString("fr-FR", {
						minimumFractionDigits: 0,
						maximumFractionDigits: 0,
					}) + " €",
				change: "TTC ce mois",
				changeType: "up",
				icon: "euro",
				iconBg: "bg-orange-600",
				borderAccent: "border-orange-600/30",
				gradientFrom: "#fff7ed",
				gradientTo: "#fdba74",
				darkGradientFrom: "#3a1a0a",
				darkGradientTo: "#9a3412",
			},
		];
	}, [monthRows, proformaMap]);

	// Colonnes
	const columns = useMemo(
		(): Column<ProformaRow>[] => [
			{
				key: "number",
				label: "N° Proforma",
				headerClassName: "md:w-[130px] lg:w-auto",
				cellClassName: "md:w-[130px] lg:w-auto overflow-hidden",
				render: (row) => (
					<span className="text-[11px] lg:text-xs xl:text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-800 transition-colors block truncate md:max-w-[110px] lg:max-w-none">
						{row.number}
					</span>
				),
			},
			{
				key: "client",
				label: "Client",
				headerClassName: "md:w-[120px] lg:w-auto",
				cellClassName: "md:w-[120px] lg:w-auto overflow-hidden",
				render: (row) => (
					<span className="text-[11px] lg:text-xs xl:text-sm text-slate-700 dark:text-slate-300 block truncate md:max-w-[100px] lg:max-w-none">
						{row.client}
					</span>
				),
			},
			{
				key: "date",
				label: "Émission",
				sortable: true,
				getValue: (row) =>
					new Date(row.date.split("/").reverse().join("-")).getTime(),
				render: (row) => (
					<span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
						{row.date}
					</span>
				),
			},
			{
				key: "amount",
				label: "Montant",
				align: "right" as const,
				sortable: true,
				getValue: (row) => proformaMap.get(row.id)?.total ?? 0,
				render: (row) => (
					<span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100">
						{row.amount}
					</span>
				),
			},
			{
				key: "status",
				label: "Statut",
				align: "center" as const,
				render: (row) => <StatusBadge status={row.status} />,
			},
			{
				key: "convertedInvoiceNumber",
				label: "Facture",
				render: (row) =>
					row.convertedInvoiceNumber && row.convertedInvoiceId ? (
						<button
							onClick={(e) => {
								e.stopPropagation();
								router.push(
									`/dashboard/invoices?preview=${row.convertedInvoiceId}`,
								);
							}}
							className="text-[11px] lg:text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
						>
							{row.convertedInvoiceNumber}
						</button>
					) : (
						<span className="text-[11px] text-slate-400">—</span>
					),
			},
		],
		[proformaMap, router],
	);

	// Archive
	const archiveData = useMemo(() => {
		const monthNames = [
			"Janvier",
			"Février",
			"Mars",
			"Avril",
			"Mai",
			"Juin",
			"Juillet",
			"Août",
			"Septembre",
			"Octobre",
			"Novembre",
			"Décembre",
		];

		const grouped: Record<number, Record<number, number>> = {};
		for (const p of allProformas) {
			const d = new Date(p.date);
			const y = d.getFullYear();
			const m = d.getMonth() + 1;
			if (!grouped[y]) grouped[y] = {};
			grouped[y][m] = (grouped[y][m] || 0) + 1;
		}

		const cy = selectedMonth.getFullYear();
		const cm = selectedMonth.getMonth() + 1;
		const currentYear = new Date().getFullYear();

		return Object.entries(grouped)
			.map(([yearStr, months]) => ({
				year: parseInt(yearStr, 10),
				months: Object.entries(months)
					.filter(([mStr]) => {
						const y = parseInt(yearStr, 10);
						const m = parseInt(mStr, 10);
						return !(y === cy && m === cm) && y < currentYear;
					})
					.map(([mStr, count]) => ({
						month: monthNames[parseInt(mStr, 10) - 1],
						count,
					}))
					.sort(
						(a, b) =>
							monthNames.indexOf(b.month) - monthNames.indexOf(a.month),
					),
			}))
			.filter((y) => y.months.length > 0)
			.sort((a, b) => b.year - a.year);
	}, [allProformas, selectedMonth]);

	const handleArchiveSelect = useCallback(
		(year: number, monthName: string) => {
			const monthNames = [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre",
			];
			const idx = monthNames.indexOf(monthName);
			if (idx >= 0) setSelectedMonth(new Date(year, idx, 1));
		},
		[],
	);

	// Clic sur une ligne
	const handleRowClick = useCallback(
		(row: ProformaRow) => {
			const p = proformaMap.get(row.id);
			if (!p) return;

			// Brouillon temporaire → édition
			if (row.dbStatus === "DRAFT" && p.number.startsWith("BROUILLON-")) {
				router.push(`/dashboard/proformas/${row.id}/edit`);
				return;
			}

			setPreviewProforma(p);
			setPreviewOpen(true);
		},
		[proformaMap, router],
	);

	const handleEdit = useCallback(
		(row: ProformaRow) => {
			router.push(`/dashboard/proformas/${row.id}/edit`);
		},
		[router],
	);

	const handleDeleteConfirm = useCallback(() => {
		if (!deleteTargetId) return;
		deleteMutation.mutate(deleteTargetId);
		setDeleteTargetId(null);
	}, [deleteTargetId, deleteMutation]);

	return (
		<div>
			{/* Header */}
			<PageHeader
				title="Proformas"
				subtitle="Créez et gérez vos factures proforma"
				ctaLabel="Nouvelle proforma"
				ctaHref="/dashboard/proformas/new"
				ctaIcon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
				ctaVariant="gradient"
			/>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
				{kpis.map((kpi, i) => (
					<KpiCard key={kpi.label} data={kpi} index={i} />
				))}
			</div>

			{/* Search + Month Selector */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
				<div className="flex-1">
					<SearchBar
						placeholder="Rechercher par n°, client, statut..."
						onSearch={handleSearch}
					/>
				</div>
				<MonthSelector value={selectedMonth} onChange={handleMonthChange} />
			</div>

			{/* Data Table */}
			<div className="rounded-2xl border border-slate-300/80 dark:border-orange-500/20 shadow-lg shadow-slate-200/50 dark:shadow-orange-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden mb-8">
				<DataTable<ProformaRow>
					data={filteredRows}
					columns={columns}
					getRowId={(row) => row.id}
					limit={10}
					mobileFields={["number", "client"]}
					mobileStatusKey="status"
					mobileAmountKey="amount"
					onRowClick={handleRowClick}
					getRowClassName={(row) =>
						highlightedIds.has(row.id) ? "row-highlight" : ""
					}
					actions={(row) => (
						<ActionButtons
							onEdit={() => handleEdit(row)}
							onDelete={() => setDeleteTargetId(row.id)}
						/>
					)}
					emptyTitle={isLoading ? "Chargement..." : "Aucune proforma trouvée"}
					emptyDescription={
						isLoading
							? "Récupération des proformas en cours..."
							: "Aucune proforma ne correspond à votre recherche pour ce mois."
					}
				/>
			</div>

			{/* Archive */}
			{archiveData.length > 0 && (
				<ArchiveSection data={archiveData} onSelect={handleArchiveSelect} />
			)}

			{/* Modal aperçu */}
			<ProformaPreviewModal
				proforma={previewProforma}
				open={previewOpen}
				onOpenChange={handlePreviewClose}
			/>

			{/* Confirmation suppression */}
			<DeleteConfirmModal
				open={!!deleteTargetId}
				onOpenChange={(o) => !o && setDeleteTargetId(null)}
				onConfirm={handleDeleteConfirm}
				isDeleting={deleteMutation.isPending}
				documentLabel="la proforma"
				documentNumber={
					deleteTargetId
						? (proformaMap.get(deleteTargetId)?.number ?? "")
						: ""
				}
			/>
		</div>
	);
}

// ─── Page principale avec Suspense ────────────────────────────────────────────

export default function ProformasPage() {
	return (
		<Suspense>
			<ProformasPageContent />
		</Suspense>
	);
}

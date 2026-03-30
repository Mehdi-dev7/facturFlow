"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";
import { PwaInstallBanner, PwaInstallSidebarButton } from "@/components/pwa/pwa-install-banner";

import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { TopProgressBar, useRouteLoader } from "@/components/ui/page-loader";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { useUpgradeStore } from "@/stores/use-upgrade-store";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { LucideIcon } from "lucide-react";
import type { NotificationCounts } from "@/lib/actions/notifications";
import {
	Menu,
	LayoutDashboard,
	Users,
	FileText,
	FileCheck,
	Receipt,
	FolderOpen,
	Repeat,
	Banknote,
	BarChart3,
	Calculator,
	Building2,
	CreditCard,
	Paintbrush,
	LogOut,
	ChevronDown,
	PanelLeftClose,
	PanelLeftOpen,
	Crown,
	Sparkles,
	Sun,
	Moon,
	Mail,
	BookOpen,
	UserCircle2,
	Shield,
	Code2,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
	dot?: boolean  // affiche le point rouge pulsant
}

interface NavSection {
	title: string;
	color: string;
	activeColor: string;
	items: NavItem[];
}

const dashboardItem: NavItem = {
	label: "Tableau de bord",
	href: "/dashboard",
	icon: LayoutDashboard,
};

const navSections: NavSection[] = [
	{
		title: "Facturation",
		color: "text-violet-500 dark:text-violet-400",
		activeColor: "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300",
		items: [
			{ label: "Factures", href: "/dashboard/invoices", icon: FileText },
			{ label: "Devis", href: "/dashboard/quotes", icon: FileCheck },
			{ label: "Acomptes", href: "/dashboard/deposits", icon: Banknote },
			{ label: "Reçus", href: "/dashboard/receipts", icon: Receipt },
			{ label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
			{ label: "Récurrences", href: "/dashboard/recurring", icon: Repeat },
		],
	},
	{
		title: "Gestion",
		color: "text-accent dark:text-accent",
		activeColor: "border-accent bg-accent/10 text-accent",
		items: [
			{ label: "Clients", href: "/dashboard/clients", icon: Users },
			{ label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
			{ label: "Comptabilité", href: "/dashboard/compta", icon: Calculator },
			{ label: "Paiements", href: "/dashboard/payments", icon: CreditCard },
		],
	},
	{
		title: "Mon Compte",
		color: "text-quinary dark:text-quinary",
		activeColor: "border-quinary bg-quinary/10 text-quinary",
		items: [
			{ label: "Mon profil", href: "/dashboard/account", icon: UserCircle2 },
			{ label: "Mon entreprise", href: "/dashboard/company", icon: Building2 },
			{ label: "Abonnement", href: "/dashboard/subscription", icon: Crown },
			// "API & Webhooks" est ajouté dynamiquement pour le plan Business (voir SidebarNav)
		],
	},
	{
		title: "Personnalisation",
		color: "text-tertiary dark:text-tertiary",
		activeColor: "border-tertiary bg-tertiary/10 text-tertiary",
		items: [
			{ label: "Apparence", href: "/dashboard/appearance", icon: Paintbrush },
		],
	},
];

const helpSection: NavSection = {
	title: "Aide",
	color: "text-blue-500 dark:text-blue-400",
	activeColor: "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300",
	items: [
		{ label: "Contact", href: "/dashboard/contact", icon: Mail },
		{ label: "Tutoriels", href: "/dashboard/tutorials", icon: BookOpen },
	],
};

function isItemActive(href: string, pathname: string) {
	return href === "/dashboard"
		? pathname === "/dashboard"
		: pathname.startsWith(href);
}

// Petit point rouge pulsant — version sidebar collapsed (sur l'icône) ou étendue (à droite)
function NotifDot({ collapsed }: { collapsed: boolean }) {
	if (collapsed) {
		return (
			<span className="absolute top-1 right-1 flex h-2 w-2">
				<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
				<span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
			</span>
		);
	}
	return (
		<span className="ml-auto flex h-2.5 w-2.5 shrink-0">
			<span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
			<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
		</span>
	);
}

function NavLink({
	item,
	collapsed,
	onNavigate,
	isActive,
	activeClassName,
	isDimmed = false,
	isSpotlit = false,
}: {
	item: NavItem;
	collapsed: boolean;
	onNavigate?: () => void;
	isActive: boolean;
	activeClassName: string;
	/** Atténué pendant le spotlight : opacity réduite + non cliquable */
	isDimmed?: boolean;
	/** Mis en évidence pendant le spotlight : ring + pleine visibilité */
	isSpotlit?: boolean;
}) {
	const link = (
		<Link
			href={item.href}
			onClick={isDimmed ? undefined : onNavigate}
			className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
				collapsed ? "justify-center" : ""
			} ${
				isDimmed
					? "opacity-25 pointer-events-none select-none"
					: "cursor-pointer"
			} ${
				// Ring pulsant sur le lien ciblé par le spotlight
				isSpotlit
					? "ring-2 ring-violet-400/80 dark:ring-violet-400/60 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
					: ""
			} ${
				isActive
					? `border-l-4 font-semibold ${activeClassName}`
					: "border-l-4 border-transparent text-slate-600 hover:bg-primary/10 hover:text-primary dark:text-slate-400 dark:hover:text-white"
			}`}
		>
			<item.icon className="h-5 w-5 shrink-0" />
			{!collapsed && <span className="truncate">{item.label}</span>}
			{item.dot && <NotifDot collapsed={collapsed} />}
		</Link>
	);

	if (!collapsed) return link;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{link}</TooltipTrigger>
			<TooltipContent
				side="right"
				sideOffset={8}
				className="bg-primary text-white dark:bg-violet-600 dark:text-white font-medium"
				arrowClassName="bg-primary fill-primary dark:bg-violet-600 dark:fill-violet-600"
			>
				{item.label}
			</TooltipContent>
		</Tooltip>
	);
}

function SidebarNav({
	pathname,
	onNavigate,
	collapsed = false,
	notifications,
	dismissedNotifs,
	effectivePlan,
	spotlitHref,
}: {
	pathname: string;
	onNavigate?: () => void;
	collapsed?: boolean;
	notifications?: NotificationCounts;
	dismissedNotifs?: Set<string>;
	effectivePlan?: string;
	/** Lien mis en évidence pendant le spotlight (tous les autres sont atténués) */
	spotlitHref?: string | null;
}) {
	const isDashboardActive = pathname === "/dashboard";

	return (
		<TooltipProvider delayDuration={100}>
			<nav className="flex flex-col gap-1 px-3" aria-label="Menu principal">
				{/* Dashboard standalone — atténué si spotlight actif */}
				<NavLink
					item={dashboardItem}
					collapsed={collapsed}
					onNavigate={onNavigate}
					isActive={isDashboardActive}
					activeClassName="border-primary bg-primary/10 text-primary"
					isDimmed={!!spotlitHref && spotlitHref !== dashboardItem.href}
					isSpotlit={spotlitHref === dashboardItem.href}
				/>

				{/* Sections */}
				{navSections.map((section, sectionIndex) => {
					// Injecter "API & Webhooks" dans la section "Mon Compte" pour les plans Business
					const items =
						section.title === "Mon Compte" && effectivePlan === "BUSINESS"
							? [
									...section.items,
									{ label: "API & Webhooks", href: "/dashboard/api", icon: Code2 },
								]
							: section.items;

					return (
						<div key={section.title} className="flex flex-col gap-1">
							{/* Section header / divider */}
							{collapsed ? (
								<div className={`mx-auto my-2 h-px w-6 bg-slate-200 dark:bg-slate-700 ${sectionIndex === 0 ? "mt-3" : ""}`} />
							) : (
								<p className={`mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider ${section.color}`}>
									{section.title}
								</p>
							)}

							{/* Section items */}
							{items.map((item) => {
								const dot =
									(item.href === "/dashboard/invoices" && notifications?.invoices && !dismissedNotifs?.has("invoices")) ||
									(item.href === "/dashboard/quotes" && notifications?.quotes && !dismissedNotifs?.has("quotes")) ||
									(item.href === "/dashboard/deposits" && notifications?.deposits && !dismissedNotifs?.has("deposits")) ||
									false;
								return (
									<NavLink
										key={item.href}
										item={{ ...item, dot }}
										collapsed={collapsed}
										onNavigate={onNavigate}
										isActive={isItemActive(item.href, pathname)}
										activeClassName={section.activeColor}
										isDimmed={!!spotlitHref && spotlitHref !== item.href}
										isSpotlit={spotlitHref === item.href}
									/>
								);
							})}
						</div>
					);
				})}
			</nav>
		</TooltipProvider>
	);
}

function UserAvatar({
	name,
	image,
}: {
	name?: string | null;
	image?: string | null;
}) {
	if (image) {
		return (
			<Image
				src={image}
				alt={name || "Avatar"}
				width={32}
				height={32}
				className="rounded-full object-cover"
			/>
		);
	}

	const initials = name
		? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white transition-colors dark:group-hover:bg-white dark:group-hover:text-primary">
			{initials}
		</div>
	);
}

// Props d'abonnement passées par le layout Server Component parent
interface SubscriptionData {
	plan: string;
	effectivePlan: string;
	trialDaysLeft: number | null;
	documentsThisMonth: number;
}

export default function DashboardShell({
	children,
	subscription,
	notifications,
	isAdmin = false,
	pendingReviewsCount = 0,
}: {
	children: React.ReactNode;
	subscription?: SubscriptionData;
	notifications?: NotificationCounts;
	isAdmin?: boolean;
	pendingReviewsCount?: number;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	// Collapsed par défaut sur tablette (md→lg), ouvert sur desktop (lg+)
	const [collapsed, setCollapsed] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < 1024;
	});
	const pathname = usePathname();

	// Spotlight onboarding — lien mis en évidence dans la sidebar
	const { activeStep } = useOnboardingStore();
	// hrefs ciblés par chaque étape d'onboarding (même ordre que STEPS dans onboarding-tutorial)
	const ONBOARDING_HREFS = ["/dashboard/company", "/dashboard/payments", "/dashboard/appearance"];
	const spotlitHref = activeStep !== null ? ONBOARDING_HREFS[activeStep] ?? null : null;
	// Spotlight actif uniquement si on n'est PAS sur la page cible
	const isSpotlightMode = spotlitHref !== null && !pathname.startsWith(spotlitHref);

	// Dot dismissal : persiste dans localStorage (survit aux fermetures du navigateur)
	// Initialisé à Set vide pour éviter le mismatch hydratation server/client,
	// puis synchronisé avec localStorage après montage dans un useEffect.
	const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());

	useEffect(() => {
		try {
			const stored = localStorage.getItem("notif_dismissed");
			if (stored) setDismissedNotifs(new Set(JSON.parse(stored) as string[]));
		} catch { /* ignore */ }
	}, []);

	// Aide pour persister le Set dans localStorage
	const persistDismissed = useCallback((next: Set<string>) => {
		try { localStorage.setItem("notif_dismissed", JSON.stringify([...next])); } catch { /* ignore */ }
	}, []);

	// Dismiss uniquement quand l'utilisateur visite une section QUI A une notification active
	useEffect(() => {
		const map: Array<[string, keyof NotificationCounts]> = [
			["/dashboard/invoices", "invoices"],
			["/dashboard/quotes",   "quotes"],
			["/dashboard/deposits", "deposits"],
			["/admin",              "admin"],
		];
		for (const [prefix, key] of map) {
			if (pathname.startsWith(prefix) && notifications?.[key]) {
				setDismissedNotifs((prev) => {
					if (prev.has(key)) return prev;
					const next = new Set([...prev, key]);
					persistDismissed(next);
					return next;
				});
			}
		}
	}, [pathname, notifications, persistDismissed]);

	// Quand le serveur dit qu'une notif n'existe plus, on efface son dismissed
	// → la prochaine nouvelle notif pourra s'afficher correctement
	useEffect(() => {
		if (!notifications) return;
		setDismissedNotifs((prev) => {
			const next = new Set(prev);
			let changed = false;
			if (!notifications.invoices && next.has("invoices")) { next.delete("invoices"); changed = true; }
			if (!notifications.quotes  && next.has("quotes"))   { next.delete("quotes");   changed = true; }
			if (!notifications.deposits && next.has("deposits")) { next.delete("deposits"); changed = true; }
			if (!notifications.admin   && next.has("admin"))    { next.delete("admin");    changed = true; }
			if (!changed) return prev;
			persistDismissed(next);
			return next;
		});
	}, [notifications, persistDismissed]);
	const { data: session } = useSession();

	// Initialiser dark mode avec une fonction pour éviter l'accès SSR à window
	const [dark, setDark] = useState(() => {
		if (typeof window === "undefined") return false;
		const saved = localStorage.getItem("theme");
		return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
	});

	// État d'hydratation (évite les mismatches Radix UI)
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// Appliquer le thème au DOM au montage et aux changements
		document.documentElement.classList.toggle("dark", dark);
	}, [dark]);

	useEffect(() => {
		// Attendre l'hydratation complète avant de rendre les composants interactifs
		const timeout = setTimeout(() => setIsHydrated(true), 0);
		return () => clearTimeout(timeout);
	}, []);

	const toggleDark = useCallback(() => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	}, [dark]);

	const user = session?.user;

	// Store global pour l'UpgradeModal (déclenché depuis les hooks)
	const { open: upgradeOpen, feature: upgradeFeature, closeUpgradeModal } = useUpgradeStore();

	// Loader barre de progression lors des navigations entre pages
	const routeLoading = useRouteLoader();

	return (
		<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
			{/* Barre de progression violette en haut lors des navigations */}
			<TopProgressBar loading={routeLoading} />
			{/* Desktop Sidebar */}
			<aside
				className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex transition-all duration-300 ${
					collapsed ? "w-18" : "w-70"
				} ${
					// Élever la sidebar au-dessus de l'overlay d'onboarding (z-40)
					isSpotlightMode ? "relative z-50" : ""
				}`}
			>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between px-4">
					{!collapsed && (
						<Link
							href="/dashboard"
							className="text-xl lg:text-2xl font-semibold text-gradient golos-text cursor-pointer"
						>
							FacturNow
						</Link>
						
					)}
					<span className=""></span>
					<button
						onClick={() => setCollapsed((prev) => !prev)}
						className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary/20 dark:text-slate-200 dark:hover:text-white dark:hover:bg-primary/80 transition-colors cursor-pointer"
						aria-label={collapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
					>
						{collapsed ? (
							<PanelLeftOpen className="h-5 w-5" />
						) : (
							<PanelLeftClose className="h-5 w-5" />
						)}
					</button>
				</div>

				<div className="mx-4 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-400/30 to-transparent" />

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto py-4">
					<SidebarNav pathname={pathname} collapsed={collapsed} notifications={notifications} dismissedNotifs={dismissedNotifs} effectivePlan={subscription?.effectivePlan} spotlitHref={isSpotlightMode ? spotlitHref : null} />
				</div>

				{/* Aide section (sticky en bas avec espacement) */}
				<div className="mt-auto mb-15 border-t border-slate-200 dark:border-slate-800 py-4">
					<TooltipProvider delayDuration={100}>
						<div className="flex flex-col gap-1 px-3">
							{collapsed ? (
								<div className="mx-auto mb-2 h-px w-6 bg-slate-200 dark:bg-slate-700" />
							) : (
								<p className={`mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider ${helpSection.color}`}>
									{helpSection.title}
								</p>
							)}
							{helpSection.items.map((item) => (
								<NavLink
									key={item.href}
									item={item}
									collapsed={collapsed}
									isActive={isItemActive(item.href, pathname)}
									activeClassName={helpSection.activeColor}
									isDimmed={isSpotlightMode}
								/>
							))}

							{/* Bouton install PWA — Pro/Business, caché si déjà installé */}
						{(subscription?.effectivePlan === "PRO" || subscription?.effectivePlan === "BUSINESS") && (
							<PwaInstallSidebarButton collapsed={collapsed} />
						)}

						{/* Lien Admin — visible uniquement pour l'admin */}
							{isAdmin && (
								<NavLink
									item={{ label: "Admin", href: "/admin", icon: Shield, dot: !!(notifications?.admin && !dismissedNotifs?.has("admin")) }}
									collapsed={collapsed}
									isActive={isItemActive("/admin", pathname)}
									activeClassName="border-violet-600 bg-violet-600/10 text-violet-600 dark:text-violet-300"
									isDimmed={isSpotlightMode}
								/>
							)}
						</div>
					</TooltipProvider>
				</div>
			</aside>

			{/* Main Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Header */}
				<header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
					{/* Left: Mobile menu + Page title */}
					<div className="flex items-center gap-3">
						{/* Mobile menu — rendu client uniquement pour éviter le mismatch d'IDs Radix */}
						{isHydrated ? (
							<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
								<SheetTrigger asChild>
									<button
										className="md:hidden p-2 text-slate-500 hover:text-primary transition-colors cursor-pointer"
										aria-label="Ouvrir le menu"
									>
										<Menu className="h-5 w-5" strokeWidth={2.5} />
									</button>
								</SheetTrigger>
								<SheetContent
									side="left"
									className="w-78 p-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
								>
									<SheetTitle className="sr-only">
										Menu de navigation
									</SheetTitle>
									<div className="flex h-16 items-center px-6">
										<span className="text-xl font-semibold text-gradient golos-text font-heading">
											FacturNow
										</span>
									</div>
									<div className="mx-6 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-400/30 to-transparent" />
									<div className="flex-1 overflow-y-auto py-4">
										<SidebarNav
											pathname={pathname}
											onNavigate={() => setSidebarOpen(false)}
											notifications={notifications}
											dismissedNotifs={dismissedNotifs}
											effectivePlan={subscription?.effectivePlan}
										/>
									</div>

									{/* Aide section (mobile - sticky en bas) */}
									<div className="border-t border-slate-200 dark:border-slate-800 py-4">
										<TooltipProvider delayDuration={100}>
											<div className="flex flex-col gap-1 px-3">
												<p className={`mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider ${helpSection.color}`}>
													{helpSection.title}
												</p>
												{helpSection.items.map((item) => (
													<NavLink
														key={item.href}
														item={item}
														collapsed={false}
														onNavigate={() => setSidebarOpen(false)}
														isActive={isItemActive(item.href, pathname)}
														activeClassName={helpSection.activeColor}
													/>
												))}

												{/* Bouton install PWA mobile */}
												{(subscription?.effectivePlan === "PRO" || subscription?.effectivePlan === "BUSINESS") && (
													<PwaInstallSidebarButton collapsed={false} />
												)}

												{/* Admin link mobile */}
												{isAdmin && (
													<NavLink
														item={{ label: "Admin", href: "/admin", icon: Shield, dot: !!(notifications?.admin && !dismissedNotifs?.has("admin")) }}
														collapsed={false}
														onNavigate={() => setSidebarOpen(false)}
														isActive={isItemActive("/admin", pathname)}
														activeClassName="border-violet-600 bg-violet-600/10 text-violet-600 dark:text-violet-300"
													/>
												)}
											</div>
										</TooltipProvider>
									</div>
								</SheetContent>
							</Sheet>
						) : (
							<button
								className="md:hidden p-2 text-slate-500"
								aria-label="Ouvrir le menu"
								disabled
							>
								<Menu className="h-5 w-5" strokeWidth={2.5} />
							</button>
						)}

						{/* Page title */}
						<h1 className="text-lg lg:text-2xl font-semibold text-slate-900 dark:text-slate-100">
							{pathname === "/dashboard"
								? "Tableau de bord"
								: pathname.startsWith("/dashboard/api")
								? "API & Webhooks"
								: [...navSections.flatMap((s) => s.items), ...helpSection.items].find((item) => pathname.startsWith(item.href))?.label ?? "Tableau de bord"}
						</h1>
					</div>

					{/* Right: Dark mode + User menu */}
					<div className="flex items-center gap-2">
					<button
						onClick={toggleDark}
						className="relative p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/20 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
						aria-label="Changer le thème"
					>
						<Sun className={`h-5 w-5 transition-all duration-300 ${isHydrated && dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
						<Moon className={`absolute inset-0 m-auto h-5 w-5 text-slate-200 transition-all duration-300 ${isHydrated && dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
					</button>
					{isHydrated ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									className="group flex items-center gap-2 rounded-md p-1.5 text-secondary hover:text-primary hover:bg-primary/20 dark:text-slate-200 dark:hover:text-white dark:hover:bg-primary/80 transition-colors cursor-pointer"
									aria-label="Menu utilisateur"
								>
									<UserAvatar
										name={user?.name}
										image={user?.image}
									/>
									<span className="hidden max-w-30 truncate hover:text-primary dark:text-slate-200 dark:hover:text-white  text-sm font-medium sm:inline-block">
										{user?.name ?? "Utilisateur"}
									</span>
									<ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-200 dark:hover:text-white" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-[#1a1438] dark:to-[#1a1438] border border-primary/20 dark:border-violet-500/20 shadow-lg dark:shadow-violet-950/40 rounded-xl p-0 overflow-hidden">
								{/* User info */}
								<div className="px-4 py-3">
									<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
										{user?.name ?? "Utilisateur"}
									</p>
									<p className="text-xs text-muted-foreground truncate dark:text-slate-100">
										{user?.email ?? ""}
									</p>
								</div>

								{/* Séparateur gradient */}
								<div className="mx-3 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent " />

								{/* Abonnement — badge dynamique */}
								<div className="px-4 py-3">
									<div className="flex items-center justify-between">
										{subscription ? (
											<PlanBadge
												plan={subscription.plan}
												effectivePlan={subscription.effectivePlan}
												trialDaysLeft={subscription.trialDaysLeft}
											/>
										) : (
											<div className="flex items-center gap-2">
												<Crown className="h-4 w-4 text-primary dark:text-violet-400" />
												<span className="text-xs font-medium text-slate-700 dark:text-violet-200">
													Plan Gratuit
												</span>
											</div>
										)}
										{(!subscription || subscription.effectivePlan === "FREE") && (
											<Link
												href="/dashboard/subscription"
												className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary dark:text-violet-400 dark:hover:text-violet-500 transition-colors cursor-pointer"
											>
												<Sparkles className="h-3 w-3" />
												Upgrade
											</Link>
										)}
									</div>
								</div>

								{/* Séparateur gradient */}
								<div className="mx-3 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />

								{/* Déconnexion */}
								<div className="p-1">
									<DropdownMenuItem
										onClick={() =>
											signOut({
												fetchOptions: {
													onSuccess: () => {
														window.location.href = "/";
													},
												},
											})
										}
										className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-500/10 dark:focus:text-red-400 cursor-pointer rounded-lg"
									>
										<LogOut className="mr-2 h-4 w-4" />
										Déconnexion
									</DropdownMenuItem>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<button
							className="group flex items-center gap-2 rounded-md p-1.5 text-secondary dark:text-slate-200"
							aria-label="Menu utilisateur"
							disabled
						>
							<UserAvatar name={user?.name} image={user?.image} />
						</button>
					)}
					</div>
				</header>

				{/* Main content */}
				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					{/* Bannière upgrade intelligente */}
					{subscription && (
						<UpgradeBanner
							plan={subscription.plan}
							effectivePlan={subscription.effectivePlan}
							trialDaysLeft={subscription.trialDaysLeft}
							documentsThisMonth={subscription.documentsThisMonth}
						/>
					)}
					{children}
				</main>
			</div>

			{/* Modale upgrade globale — déclenchée depuis les hooks via useUpgradeStore */}
			<UpgradeModal
				open={upgradeOpen}
				onClose={closeUpgradeModal}
				feature={upgradeFeature}
				plan="PRO"
			/>

			{/* Bannière install PWA — Pro/Business, après 3 jours, une seule fois */}
			{(subscription?.effectivePlan === "PRO" || subscription?.effectivePlan === "BUSINESS") && (
				<PwaInstallBanner />
			)}
		</div>
	);
}

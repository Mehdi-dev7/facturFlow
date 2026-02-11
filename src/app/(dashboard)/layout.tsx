"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
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
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";
import {
	Menu,
	LayoutDashboard,
	Users,
	FileText,
	FileCheck,
	Receipt,
	FolderOpen,
	Repeat,
	BarChart3,
	Building2,
	CreditCard,
	LayoutTemplate,
	Paintbrush,
	LogOut,
	ChevronDown,
	PanelLeftClose,
	PanelLeftOpen,
	Crown,
	Sparkles,
	Sun,
	Moon,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

interface NavSection {
	title: string;
	color: string;
	activeColor: string;
	items: NavItem[];
}

const dashboardItem: NavItem = {
	label: "Dashboard",
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
			{ label: "Statistiques", href: "/dashboard/reports", icon: BarChart3 },
		],
	},
	{
		title: "Mon Compte",
		color: "text-quinary dark:text-quinary",
		activeColor: "border-quinary bg-quinary/10 text-quinary",
		items: [
			{ label: "Mon entreprise", href: "/dashboard/company", icon: Building2 },
			{ label: "Paiements", href: "/dashboard/payments", icon: CreditCard },
			{ label: "Abonnement", href: "/dashboard/subscription", icon: Crown },
		],
	},
	{
		title: "Personnalisation",
		color: "text-tertiary dark:text-tertiary",
		activeColor: "border-tertiary bg-tertiary/10 text-tertiary",
		items: [
			{ label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
			{ label: "Apparence", href: "/dashboard/appearance", icon: Paintbrush },
		],
	},
];

function isItemActive(href: string, pathname: string) {
	return href === "/dashboard"
		? pathname === "/dashboard"
		: pathname.startsWith(href);
}

function NavLink({
	item,
	collapsed,
	onNavigate,
	isActive,
	activeClassName,
}: {
	item: NavItem;
	collapsed: boolean;
	onNavigate?: () => void;
	isActive: boolean;
	activeClassName: string;
}) {
	const link = (
		<Link
			href={item.href}
			onClick={onNavigate}
			className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors cursor-pointer ${
				collapsed ? "justify-center" : ""
			} ${
				isActive
					? `border-l-4 font-semibold ${activeClassName}`
					: "border-l-4 border-transparent text-slate-600 hover:bg-primary/10 hover:text-primary dark:text-slate-400 dark:hover:text-white"
			}`}
		>
			<item.icon className="h-5 w-5 shrink-0" />
			{!collapsed && <span className="truncate">{item.label}</span>}
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
}: {
	pathname: string;
	onNavigate?: () => void;
	collapsed?: boolean;
}) {
	const isDashboardActive = pathname === "/dashboard";

	return (
		<TooltipProvider delayDuration={100}>
			<nav className="flex flex-col gap-1 px-3" aria-label="Menu principal">
				{/* Dashboard standalone */}
				<NavLink
					item={dashboardItem}
					collapsed={collapsed}
					onNavigate={onNavigate}
					isActive={isDashboardActive}
					activeClassName="border-primary bg-primary/10 text-primary"
				/>

				{/* Sections */}
				{navSections.map((section, sectionIndex) => (
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
						{section.items.map((item) => (
							<NavLink
								key={item.href}
								item={item}
								collapsed={collapsed}
								onNavigate={onNavigate}
								isActive={isItemActive(item.href, pathname)}
								activeClassName={section.activeColor}
							/>
						))}
					</div>
				))}
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
			<img
				src={image}
				alt={name || "Avatar"}
				className="h-8 w-8 rounded-full object-cover"
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
		<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
			{initials}
		</div>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [dark, setDark] = useState(false);
	const pathname = usePathname();
	const { data: session } = useSession();

	useEffect(() => {
		const saved = localStorage.getItem("theme");
		const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggleDark = useCallback(() => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	}, [dark]);

	const user = session?.user;

	return (
		<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
			{/* Desktop Sidebar */}
			<aside
				className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex transition-all duration-300 ${
					collapsed ? "w-18" : "w-70"
				}`}
			>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between px-4">
					{!collapsed && (
						<Link
							href="/dashboard"
							className="text-xl lg:text-2xl font-semibold text-gradient golos-text cursor-pointer"
						>
							FacturFlow
						</Link>
						
					)}
					<span className=""></span>
					<button
						onClick={() => setCollapsed((prev) => !prev)}
						className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary/10 dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
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
					<SidebarNav pathname={pathname} collapsed={collapsed} />
				</div>
			</aside>

			{/* Main Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Header */}
				<header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
					{/* Left: Mobile menu + Page title */}
					<div className="flex items-center gap-3">
						{/* Mobile menu */}
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
										FacturFlow
									</span>
								</div>
								<div className="mx-6 h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-400/30 to-transparent" />
								<div className="flex-1 overflow-y-auto py-4">
									<SidebarNav
										pathname={pathname}
										onNavigate={() =>
											setSidebarOpen(false)
										}
									/>
								</div>
							</SheetContent>
						</Sheet>

						{/* Page title */}
						<h1 className="text-lg lg:text-2xl font-semibold text-slate-900 dark:text-slate-100">
							{pathname === "/dashboard"
								? "Dashboard"
								: navSections.flatMap((s) => s.items).find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard"}
						</h1>
					</div>

					{/* Right: Dark mode + User menu */}
					<div className="flex items-center gap-2">
					<button
						onClick={toggleDark}
						className="relative p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all duration-300 cursor-pointer"
						aria-label={dark ? "Mode clair" : "Mode sombre"}
					>
						<Sun className={`h-5 w-5 transition-all duration-300 ${dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
						<Moon className={`absolute inset-0 m-auto h-5 w-5 text-slate-200 transition-all duration-300 ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
					</button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex items-center hover:bg-primary/10 gap-2 p-2  cursor-pointer"
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
							</Button>
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

							{/* Abonnement */}
							<div className="px-4 py-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Crown className="h-4 w-4 text-primary dark:text-violet-400" />
										<span className="text-xs font-medium text-slate-700 dark:text-violet-200">
											Plan Gratuit
										</span>
									</div>
									<Link
										href="/dashboard/settings"
										className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary dark:text-violet-400 dark:hover:text-violet-500 transition-colors cursor-pointer"
									>
										<Sparkles className="h-3 w-3" />
										Upgrade
									</Link>
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
					</div>
				</header>

				{/* Main content */}
				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}

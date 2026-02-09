"use client";

import { useState } from "react";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Menu,
	LayoutDashboard,
	Users,
	Package,
	FileText,
	FileCheck,
	Settings,
	LogOut,
	ChevronDown,
} from "lucide-react";

const navItems = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Clients", href: "/dashboard/clients", icon: Users },
	{ label: "Produits", href: "/dashboard/products", icon: Package },
	{ label: "Factures", href: "/dashboard/invoices", icon: FileText },
	{ label: "Devis", href: "/dashboard/quotes", icon: FileCheck },
	{ label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

function SidebarNav({
	pathname,
	onNavigate,
}: {
	pathname: string;
	onNavigate?: () => void;
}) {
	return (
		<nav className="flex flex-col gap-1 px-3" aria-label="Menu principal">
			{navItems.map((item) => {
				const isActive =
					item.href === "/dashboard"
						? pathname === "/dashboard"
						: pathname.startsWith(item.href);

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
							isActive
								? "border-l-4 border-primary bg-primary/10 font-semibold text-primary"
								: "border-l-4 border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
						}`}
					>
						<item.icon className="h-5 w-5 shrink-0" />
						{item.label}
					</Link>
				);
			})}
		</nav>
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
	const pathname = usePathname();
	const { data: session } = useSession();

	const user = session?.user;

	return (
		<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
			{/* Desktop Sidebar */}
			<aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
				{/* Logo */}
				<div className="flex h-16 items-center px-6">
					<Link
						href="/dashboard"
						className="text-xl font-bold text-primary"
					>
						FacturFlow
					</Link>
				</div>

				<Separator />

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto py-4">
					<SidebarNav pathname={pathname} />
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
								<Button
									variant="ghost"
									size="icon"
									className="md:hidden"
									aria-label="Ouvrir le menu"
								>
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side="left"
								className="w-72 p-0"
							>
								<SheetTitle className="sr-only">
									Menu de navigation
								</SheetTitle>
								<div className="flex h-16 items-center px-6">
									<span className="text-xl font-bold text-primary">
										FacturFlow
									</span>
								</div>
								<Separator />
								<div className="py-4">
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
						<h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							{navItems.find((item) =>
								item.href === "/dashboard"
									? pathname === "/dashboard"
									: pathname.startsWith(item.href),
							)?.label ?? "Dashboard"}
						</h1>
					</div>

					{/* Right: User menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex items-center gap-2 px-2"
								aria-label="Menu utilisateur"
							>
								<UserAvatar
									name={user?.name}
									image={user?.image}
								/>
								<span className="hidden max-w-30 truncate text-sm font-medium sm:inline-block">
									{user?.name ?? "Utilisateur"}
								</span>
								<ChevronDown className="h-4 w-4 text-slate-500" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-3 py-2">
								<p className="text-sm font-medium">
									{user?.name ?? "Utilisateur"}
								</p>
								<p className="text-xs text-muted-foreground">
									{user?.email ?? ""}
								</p>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() =>
									signOut({
										fetchOptions: {
											onSuccess: () => {
												window.location.href = "/login";
											},
										},
									})
								}
								className="text-red-600 focus:text-red-600"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Déconnexion
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>

				{/* Main content */}
				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
	ClipboardList,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	MapPin,
	Menu,
	Settings,
	Shield,
	Users,
	type LucideIcon
} from "lucide-react";

import { clearBrowserAuthSession } from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface AppShellProps {
	role: UserRole;
	auditorCode: string | null;
	children: React.ReactNode;
}

interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

function getNavItems(role: UserRole): NavItem[] {
	if (role === "admin") {
		return [
			{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
			{ label: "Accounts", href: "/admin/accounts", icon: Shield },
			{ label: "Projects", href: "/admin/projects", icon: FolderKanban },
			{ label: "Places", href: "/admin/places", icon: MapPin },
			{ label: "Auditors", href: "/admin/auditors", icon: Users },
			{ label: "Audits", href: "/admin/audits", icon: ClipboardList },
			{ label: "System", href: "/admin/system", icon: Settings },
			{ label: "Settings", href: "/settings", icon: Settings }
		];
	}

	if (role === "manager") {
		return [
			{ label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
			{ label: "Projects", href: "/manager/projects", icon: FolderKanban },
			{ label: "Places", href: "/manager/places", icon: MapPin },
			{ label: "Audits", href: "/manager/audits", icon: ClipboardList },
			{ label: "Auditors", href: "/manager/auditors", icon: Users },
			{ label: "Assignments", href: "/manager/assignments", icon: ClipboardList },
			{ label: "Settings", href: "/settings", icon: Settings }
		];
	}

	return [
		{ label: "Dashboard", href: "/auditor/dashboard", icon: LayoutDashboard },
		{ label: "Places", href: "/auditor/places", icon: MapPin },
		{ label: "Reports", href: "/auditor/reports", icon: ClipboardList },
		{ label: "Settings", href: "/settings", icon: Settings }
	];
}

function NavLinks({ items, onNavigate }: Readonly<{ items: NavItem[]; onNavigate?: () => void }>) {
	const pathname = usePathname();

	return (
		<nav className="grid gap-1.5">
			{items.map(item => {
				const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
				const Icon = item.icon;

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
							isActive && "bg-accent text-foreground shadow-field"
						)}>
						<Icon className="h-4 w-4" aria-hidden="true" />
						<span className="leading-5">{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}

function UserMenu({ role, auditorCode }: Readonly<{ role: UserRole; auditorCode: string | null }>) {
	const router = useRouter();

	const label =
		role === "auditor"
			? auditorCode
				? `Auditor (${auditorCode})`
				: "Auditor"
			: role === "admin"
				? "Administrator"
				: "Manager";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary" className="gap-2">
					<span className="max-w-56 truncate">{label}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/settings" className="flex items-center gap-2">
						<Settings className="h-4 w-4" aria-hidden="true" />
						<span>Settings</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex items-center gap-2"
					onClick={() => {
						clearBrowserAuthSession();
						router.push("/login");
					}}>
					<LogOut className="h-4 w-4" aria-hidden="true" />
					<span>Sign out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function AppShell({ role, auditorCode, children }: Readonly<AppShellProps>) {
	const navItems = getNavItems(role);
	const roleLabel =
		role === "admin" ? "Administrator Workspace" : role === "manager" ? "Manager Workspace" : "Auditor Workspace";

	return (
		<div className="min-h-dvh bg-background">
			<div className="mx-auto grid w-full grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[296px_1fr]">
				<aside className="hidden border-r border-sidebar-border bg-sidebar/90 md:block">
					<div className="flex h-dvh flex-col">
						<div className="space-y-3 px-5 py-5">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-accent">
									PA
								</div>
								<div className="grid">
									<span className="text-base font-semibold leading-5">Playspace Audit Tool</span>
									<span className="text-xs text-muted-foreground">Play Value &amp; Usability</span>
								</div>
							</div>
							<div className="inline-flex w-fit rounded-pill border border-border/70 bg-muted/60 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
								{roleLabel}
							</div>
						</div>
						<Separator />
						<div className="flex-1 overflow-auto p-3">
							<p className="px-3 pb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								Workspace
							</p>
							<NavLinks items={navItems} />
						</div>
					</div>
				</aside>

				<div className="min-w-0">
					<header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
						<div className="flex h-16 items-center gap-3 px-4 md:px-6">
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
										<Menu className="h-5 w-5" aria-hidden="true" />
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-80 p-0">
									<SheetHeader className="px-4 py-4">
										<SheetTitle>Navigation</SheetTitle>
									</SheetHeader>
									<Separator />
									<div className="p-3">
										<NavLinks items={navItems} />
									</div>
								</SheetContent>
							</Sheet>

							<div className="text-sm font-semibold md:hidden">Playspace</div>
							<div className="flex-1" />
							<UserMenu role={role} auditorCode={auditorCode} />
						</div>
					</header>

					<main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
				</div>
			</div>
		</div>
	);
}

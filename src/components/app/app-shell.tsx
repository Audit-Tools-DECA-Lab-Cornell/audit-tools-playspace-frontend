"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { FolderKanban, LayoutDashboard, LogOut, Menu, Settings, type LucideIcon } from "lucide-react";

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
	if (role === "manager") {
		return [
			{ label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
			{ label: "Projects", href: "/manager/projects", icon: FolderKanban },
			{ label: "Settings", href: "/settings", icon: Settings }
		];
	}

	return [
		{ label: "Dashboard", href: "/auditor/dashboard", icon: LayoutDashboard },
		{ label: "Settings", href: "/settings", icon: Settings }
	];
}

function NavLinks({ items, onNavigate }: Readonly<{ items: NavItem[]; onNavigate?: () => void }>) {
	const pathname = usePathname();

	return (
		<nav className="grid gap-1">
			{items.map(item => {
				const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
				const Icon = item.icon;

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
							isActive && "bg-accent text-accent-foreground"
						)}>
						<Icon className="h-4 w-4" aria-hidden="true" />
						<span>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}

function UserMenu({ role, auditorCode }: Readonly<{ role: UserRole; auditorCode: string | null }>) {
	const router = useRouter();

	const label =
		role === "auditor" && auditorCode ? `Auditor (${auditorCode})` : role === "auditor" ? "Auditor" : "Manager";

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

	return (
		<div className="min-h-dvh bg-background">
			<div className="mx-auto grid w-full grid-cols-1 md:grid-cols-[260px_1fr]">
				<aside className="hidden border-r border-sidebar-border bg-sidebar md:block">
					<div className="flex h-dvh flex-col">
						<div className="flex items-center justify-between px-5 py-5">
							<div className="grid">
								<span className="text-base font-semibold leading-5">Playspace Audit Tool</span>
								<span className="text-xs text-muted-foreground">Play Value &amp; Usability</span>
							</div>
						</div>
						<Separator />
						<div className="flex-1 overflow-auto p-3">
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

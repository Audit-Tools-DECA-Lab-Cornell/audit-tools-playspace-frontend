"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
	ChevronDown,
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
	userName: string | null;
	userEmail: string | null;
	children: React.ReactNode;
}

interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

type NavigationTranslator = (key: string) => string;

function getNavItems(role: UserRole, t: NavigationTranslator): NavItem[] {
	if (role === "admin") {
		return [
			{ label: t("dashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
			{ label: t("accounts"), href: "/admin/accounts", icon: Shield },
			{ label: t("projects"), href: "/admin/projects", icon: FolderKanban },
			{ label: t("places"), href: "/admin/places", icon: MapPin },
			{ label: t("auditors"), href: "/admin/auditors", icon: Users },
			{ label: t("audits"), href: "/admin/audits", icon: ClipboardList },
			{ label: t("system"), href: "/admin/system", icon: Settings },
			{ label: t("settings"), href: "/settings", icon: Settings }
		];
	}

	if (role === "manager") {
		return [
			{ label: t("dashboard"), href: "/manager/dashboard", icon: LayoutDashboard },
			{ label: t("projects"), href: "/manager/projects", icon: FolderKanban },
			{ label: t("places"), href: "/manager/places", icon: MapPin },
			{ label: t("audits"), href: "/manager/audits", icon: ClipboardList },
			{ label: t("auditors"), href: "/manager/auditors", icon: Users },
			{ label: t("assignments"), href: "/manager/assignments", icon: ClipboardList },
			{ label: t("settings"), href: "/settings", icon: Settings }
		];
	}

	return [
		{ label: t("dashboard"), href: "/auditor/dashboard", icon: LayoutDashboard },
		{ label: t("places"), href: "/auditor/places", icon: MapPin },
		{ label: t("reports"), href: "/auditor/reports", icon: ClipboardList },
		{ label: t("settings"), href: "/settings", icon: Settings }
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

function UserMenu({
	role,
	auditorCode,
	userName,
	userEmail
}: Readonly<{ role: UserRole; auditorCode: string | null; userName: string | null; userEmail: string | null }>) {
	const router = useRouter();
	const t = useTranslations("shell.userMenu");
	const commonT = useTranslations("common.roles");

	const label = userName
		? userName
		: role === "auditor"
			? auditorCode
				? t("auditorWithCode", { code: auditorCode })
				: commonT("auditor")
			: role === "admin"
				? commonT("administrator")
				: commonT("manager");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary" className="gap-2 border border-action-outline-border bg-secondary/75">
					<span className="max-w-56 truncate">{label}</span>
					<ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="flex flex-col gap-1">
					<span className="text-lg font-semibold tracking-normal">{userName ?? t("accountLabel")}</span>
					{userEmail ? <span className="text-xs font-normal text-muted-foreground">{userEmail}</span> : null}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/settings" className="flex items-center gap-2">
						<Settings className="h-4 w-4" aria-hidden="true" />
						<span>{t("settings")}</span>
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
					<span>{t("signOut")}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function AppShell({ role, auditorCode, userName, userEmail, children }: Readonly<AppShellProps>) {
	const navigationT = useTranslations("shell.navigation");
	const shellT = useTranslations("shell");
	const roleT = useTranslations("common.workspace");
	const navItems = getNavItems(role, navigationT);
	const roleLabel =
		role === "admin" ? roleT("administrator") : role === "manager" ? roleT("manager") : roleT("auditor");

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
									<span className="text-base font-semibold leading-5">{shellT("productName")}</span>
									<span className="text-sm text-muted-foreground">{shellT("productTagline")}</span>
								</div>
							</div>
							<div className="inline-flex w-fit rounded-pill border border-primary/30 bg-primary/10 px-3 py-1 text-(length:--workspace-label-size) font-semibold tracking-(--workspace-label-tracking) text-primary uppercase">
								{roleLabel}
							</div>
						</div>
						<Separator />
						<div className="flex-1 overflow-auto p-3">
							<p className="px-3 pb-2 text-(length:--workspace-label-size) font-semibold tracking-(--workspace-label-tracking) text-text-secondary uppercase">
								{shellT("workspaceLabel")}
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
									<Button
										variant="ghost"
										size="icon"
										className="md:hidden"
										aria-label={shellT("openMenu")}>
										<Menu className="h-5 w-5" aria-hidden="true" />
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-80 p-0">
									<SheetHeader className="px-4 py-4">
										<SheetTitle>{shellT("navigationTitle")}</SheetTitle>
									</SheetHeader>
									<Separator />
									<div className="p-3">
										<NavLinks items={navItems} />
									</div>
								</SheetContent>
							</Sheet>

							<div className="text-sm font-semibold md:hidden">{shellT("mobileBrand")}</div>
							<div className="flex-1" />
							<UserMenu role={role} auditorCode={auditorCode} userName={userName} userEmail={userEmail} />
						</div>
					</header>

					<main className="px-4 py-6 md:px-6 md:py-4">{children}</main>
				</div>
			</div>
		</div>
	);
}

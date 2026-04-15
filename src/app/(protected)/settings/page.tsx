"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
	Accessibility,
	Building2,
	Globe,
	LogOut,
	Monitor,
	Moon,
	Palette,
	ShieldCheck,
	Sun,
	Type,
	UserRound,
	type LucideIcon
} from "lucide-react";

import { playspaceApi, type AccountDetail, type ManagerProfile } from "@/lib/api/playspace";
import { clearBrowserAuthSession } from "@/lib/auth/browser-session";
import type { AuthSession } from "@/lib/auth/session";
import { useAuthSession } from "@/components/app/auth-session-provider";
import {
	usePreferences,
	WEB_LANGUAGE_OPTIONS,
	WEB_MAX_FONT_SCALE,
	WEB_MIN_FONT_SCALE,
	type LanguagePreference,
	type ThemeMode
} from "@/components/app/preferences-provider";
import { BackButton } from "@/components/dashboard/back-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDateLabel, type DashboardTranslator } from "@/components/dashboard/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SETTINGS_SKELETON_CARD_IDS = ["profile", "security", "appearance", "accessibility"] as const;
const MANAGER_CONTACT_SKELETON_IDS = ["primary", "secondary"] as const;

interface ChoiceOption<TValue extends string> {
	value: TValue;
	label: string;
	description: string;
	icon: LucideIcon;
}

type SettingsTranslator = (key: string, values?: Record<string, string | number>) => string;
type SettingsRoleTranslator = (key: "administrator" | "manager" | "auditor") => string;

function getRoleTranslationKey(role: AuthSession["role"]): "administrator" | "manager" | "auditor" {
	if (role === "admin") {
		return "administrator";
	}

	return role;
}

function getThemeOptions(t: SettingsTranslator): readonly ChoiceOption<ThemeMode>[] {
	return [
		{
			value: "system",
			label: t("themeOptions.system.label"),
			description: t("themeOptions.system.description"),
			icon: Monitor
		},
		{
			value: "light",
			label: t("themeOptions.light.label"),
			description: t("themeOptions.light.description"),
			icon: Sun
		},
		{
			value: "dark",
			label: t("themeOptions.dark.label"),
			description: t("themeOptions.dark.description"),
			icon: Moon
		}
	] as const;
}

function getLanguageLabel(language: LanguagePreference, t: SettingsTranslator): string {
	return t(`languageOptions.${language}.label`);
}

function getLanguageOptions(t: SettingsTranslator): readonly ChoiceOption<LanguagePreference>[] {
	return WEB_LANGUAGE_OPTIONS.map(language => ({
		value: language,
		label: getLanguageLabel(language, t),
		description: t(`languageOptions.${language}.description`),
		icon: Globe
	}));
}

/**
 * Format a stored role into a user-facing label.
 */
function formatRoleLabel(role: AuthSession["role"], roleT: SettingsRoleTranslator): string {
	return roleT(getRoleTranslationKey(role));
}

/**
 * Resolve the dashboard path for the signed-in role.
 */
function getDashboardHref(role: AuthSession["role"]): string {
	if (role === "admin") {
		return "/admin/dashboard";
	}

	if (role === "manager") {
		return "/manager/dashboard";
	}

	return "/auditor/dashboard";
}

/**
 * Resolve a user-facing workspace label from the current role.
 */
function getWorkspaceLabel(role: AuthSession["role"], workspaceT: SettingsRoleTranslator): string {
	return workspaceT(getRoleTranslationKey(role));
}

/**
 * Resolve a user-facing display name from the current session.
 */
function getSessionDisplayName(
	session: AuthSession,
	managerAccount: AccountDetail | null,
	t: SettingsTranslator
): string {
	if (session.role === "manager") {
		return managerAccount?.primary_manager?.full_name ?? managerAccount?.name ?? t("managerFallback");
	}

	if (session.role === "admin") {
		return t("adminDisplayName");
	}

	return session.auditorCode ? t("auditorWithCode", { code: session.auditorCode }) : t("auditorFallback");
}

/**
 * Resolve a subtitle line for the signed-in user.
 */
function getProfileSubtitle(session: AuthSession, managerAccount: AccountDetail | null, t: SettingsTranslator): string {
	if (session.role === "manager") {
		return managerAccount?.name ?? t("managerWorkspaceFallback");
	}

	if (session.role === "admin") {
		return t("adminSubtitle");
	}

	return session.auditorCode ? t("auditorCodeSubtitle", { code: session.auditorCode }) : t("auditorSubtitle");
}

/**
 * Resolve the most appropriate account email visible in settings.
 */
function getProfileEmail(session: AuthSession, managerAccount: AccountDetail | null, t: SettingsTranslator): string {
	if (session.role === "manager" && managerAccount) {
		return managerAccount.email;
	}

	return t("emailFallback");
}

/**
 * Read a display-safe error message for independently hydrated settings sections.
 */
function getErrorMessageFromUnknown(error: unknown): string | null {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return null;
}

/**
 * Resolve the best primary manager profile for one manager account.
 */
function getPrimaryManagerProfile(account: AccountDetail, managerProfiles: ManagerProfile[]): ManagerProfile | null {
	const explicitPrimaryProfile = managerProfiles.find(profile => profile.is_primary);
	if (explicitPrimaryProfile) {
		return explicitPrimaryProfile;
	}

	return account.primary_manager ?? managerProfiles[0] ?? null;
}

/**
 * Resolve initials for avatar fallbacks without exposing raw identifiers.
 */
function getAvatarFallbackLabel(value: string): string {
	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		return "PS";
	}

	const initials = trimmedValue
		.split(/\s+/)
		.filter(part => part.length > 0)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase() ?? "")
		.join("");

	return initials || trimmedValue.slice(0, 2).toUpperCase();
}

/**
 * Reusable key-value row for settings detail panels.
 */
function DetailItem({ label, value }: Readonly<{ label: string; value: string }>) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">{label}</p>
			<p className="text-sm font-medium text-foreground">{value}</p>
		</div>
	);
}

/**
 * Compact skeleton line used for progressive loading inside settings cards.
 */
function SettingsInlineSkeleton({ className }: Readonly<{ className: string }>) {
	return <Skeleton className={cn("rounded-md", className)} />;
}

/**
 * Skeleton version of a detail item used while account-specific values are loading.
 */
function DetailItemSkeleton({ label }: Readonly<{ label: string }>) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">{label}</p>
			<SettingsInlineSkeleton className="h-4 w-28" />
		</div>
	);
}

/**
 * Shared loading shell shown before preferences hydrate.
 */
function SettingsPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-3.5 w-32" />
				<Skeleton className="h-10 w-40" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<div className="grid items-start gap-4 md:grid-cols-2">
				{SETTINGS_SKELETON_CARD_IDS.map(cardId => (
					<Card key={cardId}>
						<CardHeader>
							<Skeleton className={cn("h-5", cardId === "appearance" ? "w-28" : "w-24")} />
							<Skeleton className={cn("h-4", cardId === "accessibility" ? "w-64" : "w-56")} />
						</CardHeader>
						<CardContent className="space-y-4 pb-5">
							<Skeleton className={cn("h-10 rounded-full", cardId === "profile" ? "w-36" : "w-28")} />
							<Skeleton className={cn("h-10", cardId === "security" ? "w-full" : "w-5/6")} />
							<Skeleton className={cn("h-10", cardId === "appearance" ? "w-4/5" : "w-full")} />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

/**
 * Empty state shown when a protected screen has no auth session.
 */
function SessionUnavailableState() {
	const t = useTranslations("settings.sessionUnavailable");

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				actions={
					<Button asChild variant="outline">
						<Link href="/login">{t("header.goToLogin")}</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>{t("card.title")}</CardTitle>
					<CardDescription>{t("card.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">{t("card.body")}</p>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Header action buttons for the role-aware settings page.
 */
function SettingsActionBar({ dashboardHref }: Readonly<{ dashboardHref: string }>) {
	const t = useTranslations("settings.header");

	return <BackButton href={dashboardHref} label={t("backToDashboard")} />;
}

/**
 * Compact segmented control used for theme and language preferences.
 */
function ChoiceCardGroup<TValue extends string>({
	title,
	description,
	value,
	options,
	onChange
}: Readonly<{
	title: string;
	description: string;
	value: TValue;
	options: readonly ChoiceOption<TValue>[];
	onChange: (nextValue: TValue) => void;
}>) {
	const selectedOption = options.find(option => option.value === value) ?? options[0];

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<p className="text-sm font-semibold text-foreground">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{options.map(option => {
					const isSelected = option.value === value;
					const Icon = option.icon;

					return (
						<button
							key={option.value}
							type="button"
							aria-pressed={isSelected}
							onClick={() => {
								onChange(option.value);
							}}
							className={cn(
								"inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
								isSelected
									? "border-primary bg-primary/10 shadow-field"
									: "border-border bg-card text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
							)}>
							<Icon
								className={cn(
									"h-4 w-4 shrink-0",
									isSelected ? "text-primary" : "text-muted-foreground"
								)}
								aria-hidden="true"
							/>
							<span className={cn("leading-none", isSelected ? "text-foreground" : "text-inherit")}>
								{option.label}
							</span>
						</button>
					);
				})}
			</div>
			{selectedOption ? (
				<p className="text-xs leading-5 text-muted-foreground">{selectedOption.description}</p>
			) : null}
		</div>
	);
}

/**
 * Toggle row for boolean accessibility preferences.
 */
function PreferenceToggleRow({
	icon: Icon,
	title,
	description,
	enabled,
	onToggle
}: Readonly<{
	icon: LucideIcon;
	title: string;
	description: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
}>) {
	const t = useTranslations("settings.common");

	return (
		<div className="flex flex-col gap-4 rounded-card border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-start gap-3">
				<div className="rounded-lg bg-secondary p-2">
					<Icon className="h-4 w-4 text-primary" aria-hidden="true" />
				</div>
				<div className="space-y-1">
					<p className="font-medium text-foreground">{title}</p>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
			</div>
			<Button
				type="button"
				size="sm"
				variant={enabled ? "default" : "outline"}
				onClick={() => {
					onToggle(!enabled);
				}}>
				{enabled ? t("on") : t("off")}
			</Button>
		</div>
	);
}

/**
 * Top-level account summary shared across roles.
 */
function ProfileSummaryCard({
	session,
	managerAccount,
	isLoading,
	formatT
}: Readonly<{
	session: AuthSession;
	managerAccount: AccountDetail | null;
	isLoading: boolean;
	formatT: DashboardTranslator;
}>) {
	const t = useTranslations("settings.profile");
	const roleT = useTranslations("common.roles");
	const workspaceT = useTranslations("common.workspace");
	const isManagerIdentityLoading = session.role === "manager" && isLoading && managerAccount === null;
	const resolvedDisplayName = getSessionDisplayName(session, managerAccount, t);
	const profileSubtitle = getProfileSubtitle(session, managerAccount, t);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-start gap-4">
					{isManagerIdentityLoading ? (
						<SettingsInlineSkeleton className="size-10 rounded-full" />
					) : (
						<Avatar size="lg">
							<AvatarFallback>{getAvatarFallbackLabel(resolvedDisplayName)}</AvatarFallback>
						</Avatar>
					)}
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							{isManagerIdentityLoading ? (
								<SettingsInlineSkeleton className="h-6 w-40" />
							) : (
								<p className="text-lg font-medium text-foreground">{resolvedDisplayName}</p>
							)}
							{isManagerIdentityLoading ? (
								<SettingsInlineSkeleton className="h-6 w-20 rounded-full" />
							) : (
								<Badge>{formatRoleLabel(session.role, roleT)}</Badge>
							)}
						</div>
						{isManagerIdentityLoading ? (
							<SettingsInlineSkeleton className="h-4 w-32" />
						) : (
							<p className="text-sm text-muted-foreground">{profileSubtitle}</p>
						)}
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{isManagerIdentityLoading ? (
						<>
							<DetailItemSkeleton label={t("fields.role")} />
							<DetailItemSkeleton label={t("fields.workspace")} />
							<DetailItemSkeleton label={t("fields.email")} />
							<DetailItemSkeleton label={t("fields.memberSince")} />
						</>
					) : (
						<>
							<DetailItem label={t("fields.role")} value={formatRoleLabel(session.role, roleT)} />
							<DetailItem
								label={t("fields.workspace")}
								value={getWorkspaceLabel(session.role, workspaceT)}
							/>
							<DetailItem label={t("fields.email")} value={getProfileEmail(session, managerAccount, t)} />
							<DetailItem
								label={t("fields.memberSince")}
								value={
									managerAccount
										? formatDateLabel(managerAccount.created_at, formatT)
										: t("memberSinceFallback")
								}
							/>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Session and sign-out controls.
 */
function SecurityCard({
	session,
	onSignOut
}: Readonly<{
	session: AuthSession;
	onSignOut: () => void;
}>) {
	const t = useTranslations("settings.security");
	const roleT = useTranslations("common.roles");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailItem label={t("fields.status")} value={t("values.signedIn")} />
					<DetailItem label={t("fields.currentAccess")} value={formatRoleLabel(session.role, roleT)} />
					<DetailItem
						label={t("fields.auditorCode")}
						value={session.auditorCode ?? t("values.notApplicable")}
					/>
					<DetailItem label={t("fields.device")} value={t("values.currentBrowserSession")} />
				</div>

				<div className="rounded-card border border-border bg-secondary/40 p-4">
					<p className="text-sm font-medium text-foreground">{t("sharedDeviceTitle")}</p>
					<p className="mt-2 text-sm text-muted-foreground">{t("sharedDeviceDescription")}</p>
				</div>

				<Button type="button" variant="secondary" onClick={onSignOut}>
					<LogOut className="h-4 w-4" aria-hidden="true" />
					{t("signOut")}
				</Button>
			</CardContent>
		</Card>
	);
}

/**
 * Theme and language settings backed by the global preference provider.
 */
function AppearancePreferencesCard() {
	const preferences = usePreferences();
	const t = useTranslations("settings.appearance");
	const themeOptions = React.useMemo(() => getThemeOptions(t), [t]);
	const languageOptions = React.useMemo(() => getLanguageOptions(t), [t]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<Palette className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-6 xl:grid-cols-2">
					<ChoiceCardGroup
						title={t("themeTitle")}
						description={t("currentTheme", {
							value: t(`resolvedTheme.${preferences.resolvedTheme === "dark" ? "dark" : "light"}`)
						})}
						value={preferences.themeMode}
						options={themeOptions}
						onChange={preferences.setThemeMode}
					/>

					<ChoiceCardGroup
						title={t("languageTitle")}
						description={t("currentLocale", {
							value: getLanguageLabel(preferences.resolvedLanguage, t)
						})}
						value={preferences.languagePreference}
						options={languageOptions}
						onChange={preferences.setLanguagePreference}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Accessibility preferences backed by the global preference provider.
 */
function AccessibilityPreferencesCard() {
	const preferences = usePreferences();
	const t = useTranslations("settings.accessibility");
	const fontScalePercent = Math.round(preferences.fontScale * 100);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-4">
				<PreferenceToggleRow
					icon={Accessibility}
					title={t("highContrast.title")}
					description={t("highContrast.description")}
					enabled={preferences.highContrast}
					onToggle={preferences.setHighContrast}
				/>
				<PreferenceToggleRow
					icon={Type}
					title={t("dyslexicFont.title")}
					description={t("dyslexicFont.description")}
					enabled={preferences.dyslexicFont}
					onToggle={preferences.setDyslexicFont}
				/>

				<div className="rounded-card border border-border bg-card p-4">
					<div className="flex items-center justify-between gap-3">
						<div className="space-y-1">
							<p className="font-medium text-foreground">{t("fontSize.title")}</p>
							<p id="font_scale_description" className="text-sm text-muted-foreground">
								{t("fontSize.description", {
									min: Math.round(WEB_MIN_FONT_SCALE * 100),
									max: Math.round(WEB_MAX_FONT_SCALE * 100)
								})}
							</p>
						</div>
						<Badge variant="secondary">{fontScalePercent}%</Badge>
					</div>
					<input
						id="font_scale"
						name="fontScale"
						type="range"
						min={String(WEB_MIN_FONT_SCALE)}
						max={String(WEB_MAX_FONT_SCALE)}
						step="0.05"
						value={String(preferences.fontScale)}
						aria-label={t("fontSize.title")}
						aria-describedby="font_scale_description"
						onChange={event => {
							preferences.setFontScale(Number(event.target.value));
						}}
						className="mt-4 w-full accent-primary"
					/>
				</div>

				<div className="flex justify-end">
					<Button type="button" size="sm" variant="outline" onClick={preferences.resetPreferences}>
						{t("reset")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Manager-only account and organization settings.
 */
function ManagerWorkspaceSection({
	account,
	managerProfiles,
	accountIsLoading,
	managerProfilesIsLoading,
	accountErrorMessage,
	managerProfilesErrorMessage,
	formatT
}: Readonly<{
	account: AccountDetail | null;
	managerProfiles: ManagerProfile[];
	accountIsLoading: boolean;
	managerProfilesIsLoading: boolean;
	accountErrorMessage: string | null;
	managerProfilesErrorMessage: string | null;
	formatT: DashboardTranslator;
}>) {
	const t = useTranslations("settings.managerOrganization");
	const queryClient = useQueryClient();
	const [isEditingOrganization, setIsEditingOrganization] = React.useState(false);
	const [accountNameInput, setAccountNameInput] = React.useState(account?.name ?? "");
	const [accountEmailInput, setAccountEmailInput] = React.useState(account?.email ?? "");
	const [saveError, setSaveError] = React.useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

	React.useEffect(() => {
		setAccountNameInput(account?.name ?? "");
		setAccountEmailInput(account?.email ?? "");
		setIsEditingOrganization(false);
	}, [account?.id, account?.name, account?.email]);

	const updateAccountMutation = useMutation({
		mutationFn: async () => {
			if (!account) {
				throw new Error(t("messages.organizationUnavailable"));
			}

			return playspaceApi.management.accounts.update(account.id, {
				name: accountNameInput.trim(),
				email: accountEmailInput.trim()
			});
		},
		onSuccess: async () => {
			if (!account) {
				return;
			}

			setSaveError(null);
			setSaveSuccess(t("messages.organizationSaved"));
			setIsEditingOrganization(false);
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["playspace", "settings", "account", account.id]
				}),
				queryClient.invalidateQueries({
					queryKey: ["playspace", "account", account.id]
				})
			]);
		},
		onError: error => {
			setSaveSuccess(null);
			setSaveError(error instanceof Error ? error.message : t("messages.unableToUpdate"));
		}
	});

	const primaryManagerProfile = account ? getPrimaryManagerProfile(account, managerProfiles) : null;
	const clearSaveMessages = () => {
		setSaveError(null);
		setSaveSuccess(null);
	};

	const handleToggleEditing = () => {
		setIsEditingOrganization(currentValue => !currentValue);
		clearSaveMessages();
	};

	const handleAccountNameChange = (value: string) => {
		setAccountNameInput(value);
		clearSaveMessages();
	};

	const handleAccountEmailChange = (value: string) => {
		setAccountEmailInput(value);
		clearSaveMessages();
	};

	const handleSave = () => {
		if (accountNameInput.trim().length === 0) {
			setSaveError(t("messages.organizationNameRequired"));
			return;
		}

		if (accountEmailInput.trim().length === 0) {
			setSaveError(t("messages.accountEmailRequired"));
			return;
		}

		updateAccountMutation.mutate();
	};

	const handleCancelEditing = () => {
		if (!account) {
			return;
		}

		setAccountNameInput(account.name);
		setAccountEmailInput(account.email);
		clearSaveMessages();
		setIsEditingOrganization(false);
	};

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<ManagerOrganizationCard
				account={account}
				accountIsLoading={accountIsLoading}
				primaryManagerProfile={primaryManagerProfile}
				errorMessage={accountErrorMessage}
				isEditingOrganization={isEditingOrganization}
				accountNameInput={accountNameInput}
				accountEmailInput={accountEmailInput}
				saveError={saveError}
				saveSuccess={saveSuccess}
				isPending={updateAccountMutation.isPending}
				formatT={formatT}
				onToggleEditing={handleToggleEditing}
				onAccountNameChange={handleAccountNameChange}
				onAccountEmailChange={handleAccountEmailChange}
				onSave={handleSave}
				onCancelEditing={handleCancelEditing}
			/>
			<ManagerContactsCard
				managerProfiles={managerProfiles}
				isLoading={managerProfilesIsLoading}
				errorMessage={managerProfilesErrorMessage}
			/>
		</div>
	);
}

function ManagerOrganizationCard({
	account,
	accountIsLoading,
	primaryManagerProfile,
	errorMessage,
	isEditingOrganization,
	accountNameInput,
	accountEmailInput,
	saveError,
	saveSuccess,
	isPending,
	formatT,
	onToggleEditing,
	onAccountNameChange,
	onAccountEmailChange,
	onSave,
	onCancelEditing
}: Readonly<{
	account: AccountDetail | null;
	accountIsLoading: boolean;
	primaryManagerProfile: ManagerProfile | null;
	errorMessage: string | null;
	isEditingOrganization: boolean;
	accountNameInput: string;
	accountEmailInput: string;
	saveError: string | null;
	saveSuccess: string | null;
	isPending: boolean;
	formatT: DashboardTranslator;
	onToggleEditing: () => void;
	onAccountNameChange: (value: string) => void;
	onAccountEmailChange: (value: string) => void;
	onSave: () => void;
	onCancelEditing: () => void;
}>) {
	const t = useTranslations("settings.managerOrganization");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={accountIsLoading || !account}
						onClick={onToggleEditing}>
						{isEditingOrganization ? t("actions.cancel") : t("actions.edit")}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				{accountIsLoading && !account ? (
					<>
						<div className="grid gap-4 sm:grid-cols-2">
							<DetailItemSkeleton label={t("fields.organization")} />
							<DetailItemSkeleton label={t("fields.accountEmail")} />
							<DetailItemSkeleton label={t("fields.primaryContact")} />
							<DetailItemSkeleton label={t("fields.memberSince")} />
						</div>
						<div className="rounded-card border border-border bg-secondary/40 p-4">
							<SettingsInlineSkeleton className="h-4 w-28" />
							<SettingsInlineSkeleton className="mt-3 h-4 w-40" />
							<SettingsInlineSkeleton className="mt-2 h-4 w-52" />
						</div>
					</>
				) : account === null ? (
					<p className="text-sm text-muted-foreground">{errorMessage ?? t("messages.loadFailed")}</p>
				) : (
					<>
						<div className="grid gap-4 sm:grid-cols-2">
							<DetailItem label={t("fields.organization")} value={account.name} />
							<DetailItem label={t("fields.accountEmail")} value={account.email} />
							<DetailItem
								label={t("fields.primaryContact")}
								value={primaryManagerProfile?.full_name ?? t("values.pending")}
							/>
							<DetailItem
								label={t("fields.memberSince")}
								value={formatDateLabel(account.created_at, formatT)}
							/>
						</div>

						{isEditingOrganization ? (
							<div className="space-y-4 rounded-card border border-border bg-secondary/40 p-4">
								<div className="grid gap-2">
									<Label htmlFor="organization_name">{t("fields.organizationName")}</Label>
									<Input
										id="organization_name"
										name="organizationName"
										autoComplete="organization"
										value={accountNameInput}
										onChange={event => onAccountNameChange(event.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="organization_email">{t("fields.accountEmail")}</Label>
									<Input
										id="organization_email"
										name="organizationEmail"
										type="email"
										autoComplete="email"
										spellCheck={false}
										value={accountEmailInput}
										onChange={event => onAccountEmailChange(event.target.value)}
									/>
								</div>
								{saveError ? (
									<p aria-live="polite" className="text-sm text-destructive">
										{saveError}
									</p>
								) : null}
								{saveSuccess ? (
									<p aria-live="polite" className="text-sm text-green-600 dark:text-green-400">
										{saveSuccess}
									</p>
								) : null}
								<div className="flex flex-wrap gap-2">
									<Button type="button" disabled={isPending} onClick={onSave}>
										{t("actions.saveChanges")}
									</Button>
									<Button type="button" variant="outline" onClick={onCancelEditing}>
										{t("actions.cancel")}
									</Button>
								</div>
							</div>
						) : (
							<div className="rounded-card border border-border bg-secondary/40 p-4">
								<p className="text-sm font-medium text-foreground">{t("primaryContact.title")}</p>
								{primaryManagerProfile ? (
									<div className="mt-3 space-y-1">
										<p className="text-sm text-foreground">{primaryManagerProfile.full_name}</p>
										<p className="text-sm text-muted-foreground">
											{primaryManagerProfile.position ?? t("primaryContact.positionPending")}
										</p>
										<p className="text-sm text-muted-foreground">{primaryManagerProfile.email}</p>
										<p className="text-sm text-muted-foreground">
											{primaryManagerProfile.phone ?? t("primaryContact.phonePending")}
										</p>
									</div>
								) : (
									<p className="mt-3 text-sm text-muted-foreground">{t("primaryContact.empty")}</p>
								)}
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function ManagerContactsCard({
	managerProfiles,
	isLoading,
	errorMessage
}: Readonly<{
	managerProfiles: ManagerProfile[];
	isLoading: boolean;
	errorMessage: string | null;
}>) {
	const t = useTranslations("settings.managerContacts");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
				<CardAction>
					<Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-3">
				{isLoading ? (
					<>
						{MANAGER_CONTACT_SKELETON_IDS.map(skeletonId => (
							<div
								key={`manager-profile-skeleton-${skeletonId}`}
								className="flex items-start gap-3 rounded-card border border-border bg-card p-4">
								<SettingsInlineSkeleton className="size-6 rounded-full" />
								<div className="min-w-0 flex-1 space-y-2">
									<SettingsInlineSkeleton className="h-4 w-32" />
									<SettingsInlineSkeleton className="h-4 w-28" />
									<SettingsInlineSkeleton className="h-4 w-44" />
								</div>
							</div>
						))}
					</>
				) : errorMessage ? (
					<p className="text-sm text-muted-foreground">{errorMessage}</p>
				) : managerProfiles.length === 0 ? (
					<p className="text-sm text-muted-foreground">{t("empty")}</p>
				) : null}
				{errorMessage
					? null
					: managerProfiles.map(profile => (
							<div
								key={profile.id}
								className="flex items-start gap-3 rounded-card border border-border bg-card p-4">
								<Avatar size="sm">
									<AvatarFallback>{getAvatarFallbackLabel(profile.full_name)}</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium text-foreground">{profile.full_name}</p>
										{profile.is_primary ? (
											<Badge>{t("primaryContactBadge")}</Badge>
										) : (
											<Badge variant="secondary">{t("managerBadge")}</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										{profile.position ?? t("positionPending")}
									</p>
									<p className="text-sm text-muted-foreground">{profile.email}</p>
								</div>
							</div>
						))}
			</CardContent>
		</Card>
	);
}

/**
 * Administrator-only workspace summary.
 */
function AdminWorkspaceCard() {
	const t = useTranslations("settings.adminWorkspace");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<DetailItem label={t("fields.role")} value={t("values.role")} />
				<DetailItem label={t("fields.scope")} value={t("values.scope")} />
				<DetailItem label={t("fields.emailVisibility")} value={t("values.emailVisibility")} />
				<DetailItem label={t("fields.auditorIdentity")} value={t("values.auditorIdentity")} />
			</CardContent>
		</Card>
	);
}

/**
 * Auditor-only workspace summary.
 */
function AuditorWorkspaceCard({ session }: Readonly<{ session: AuthSession }>) {
	const t = useTranslations("settings.auditorWorkspace");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<DetailItem label={t("fields.role")} value={t("values.role")} />
				<DetailItem label={t("fields.auditorCode")} value={session.auditorCode ?? t("values.codePending")} />
				<DetailItem label={t("fields.workspace")} value={t("values.workspace")} />
				<DetailItem label={t("fields.accessType")} value={t("values.accessType")} />
			</CardContent>
		</Card>
	);
}

export default function SettingsPage() {
	const router = useRouter();
	const session = useAuthSession();
	const preferences = usePreferences();
	const t = useTranslations("settings");
	const formatT = useTranslations("common.format");

	const isManager = session?.role === "manager";
	const managerAccountId = isManager ? session.accountId : null;

	const accountQuery = useQuery({
		queryKey: ["playspace", "settings", "account", managerAccountId],
		queryFn: async () => {
			if (!managerAccountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}

			return playspaceApi.accounts.get(managerAccountId);
		},
		enabled: preferences.isHydrated && managerAccountId !== null
	});

	const managerProfilesQuery = useQuery({
		queryKey: ["playspace", "settings", "account", managerAccountId, "managerProfiles"],
		queryFn: async () => {
			if (!managerAccountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}

			return playspaceApi.accounts.managerProfiles(managerAccountId);
		},
		enabled: preferences.isHydrated && managerAccountId !== null
	});

	if (!preferences.isHydrated) {
		return <SettingsPageSkeleton />;
	}

	if (!session) {
		return <SessionUnavailableState />;
	}

	const managerAccount = accountQuery.data ?? null;
	const managerProfiles = managerProfilesQuery.data ?? [];
	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: getDashboardHref(session.role) },
					{ label: t("breadcrumbs.settings") }
				]}
				actions={<SettingsActionBar dashboardHref={getDashboardHref(session.role)} />}
			/>

			<div className="grid gap-4 xl:grid-cols-2">
				<ProfileSummaryCard
					session={session}
					managerAccount={managerAccount}
					isLoading={session.role === "manager" && accountQuery.isLoading}
					formatT={formatT}
				/>
				<SecurityCard
					session={session}
					onSignOut={() => {
						clearBrowserAuthSession();
						router.push("/login");
					}}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<AppearancePreferencesCard />
				<AccessibilityPreferencesCard />
			</div>

			{session.role === "manager" ? (
				<ManagerWorkspaceSection
					account={managerAccount}
					managerProfiles={managerProfiles}
					accountIsLoading={accountQuery.isLoading}
					managerProfilesIsLoading={managerProfilesQuery.isLoading}
					accountErrorMessage={getErrorMessageFromUnknown(accountQuery.error)}
					managerProfilesErrorMessage={getErrorMessageFromUnknown(managerProfilesQuery.error)}
					formatT={formatT}
				/>
			) : session.role === "admin" ? (
				<AdminWorkspaceCard />
			) : (
				<AuditorWorkspaceCard session={session} />
			)}
		</div>
	);
}

"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	LayoutDashboard,
	LogOut,
	Palette,
	ShieldCheck,
	Sparkles,
	UserRound
} from "lucide-react";
import { z } from "zod";

import {
	PLAYSPACE_DEMO_ACCOUNT_ID,
	playspaceApi,
	type AccountDetail,
	type ManagerProfile
} from "@/lib/api/playspace";
import {
	clearBrowserAuthSession,
	getBrowserAuthSession,
	type BrowserAuthSession
} from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDateLabel } from "@/components/dashboard/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SETTINGS_STORAGE_KEY = "playspace_settings_page_preferences";
const SETTINGS_SKELETON_CARD_IDS = ["role", "stats", "session", "preferences"] as const;

const localSettingsSchema = z.object({
	density: z.enum(["comfortable", "compact"]),
	notifications: z.enum(["important", "daily", "off"]),
	scoreDisplay: z.enum(["highlighted", "standard"]),
	guidance: z.enum(["visible", "minimal"]),
	workspaceNote: z.string().max(280)
});

type LocalSettingsState = z.infer<typeof localSettingsSchema>;

interface ChoiceOption<TValue extends string> {
	value: TValue;
	label: string;
	description: string;
}

const DEFAULT_LOCAL_SETTINGS: LocalSettingsState = {
	density: "comfortable",
	notifications: "important",
	scoreDisplay: "highlighted",
	guidance: "visible",
	workspaceNote: ""
};

const DENSITY_OPTIONS: ChoiceOption<LocalSettingsState["density"]>[] = [
	{
		value: "comfortable",
		label: "Comfortable",
		description: "Larger spacing and calmer scanning for long review sessions."
	},
	{
		value: "compact",
		label: "Compact",
		description: "Denser rows and tighter cards when you want more information visible."
	}
];

const NOTIFICATION_OPTIONS: ChoiceOption<LocalSettingsState["notifications"]>[] = [
	{
		value: "important",
		label: "Important only",
		description: "Keep settings focused on blockers, submissions, and auth changes."
	},
	{
		value: "daily",
		label: "Daily digest",
		description: "Bundle updates into a lower-noise summary for regular check-ins."
	},
	{
		value: "off",
		label: "Muted",
		description: "Hide non-critical nudges while the workflow is still being built."
	}
];

const SCORE_DISPLAY_OPTIONS: ChoiceOption<LocalSettingsState["scoreDisplay"]>[] = [
	{
		value: "highlighted",
		label: "Highlight scores",
		description: "Emphasize metrics and performance values throughout the dashboard."
	},
	{
		value: "standard",
		label: "Balanced view",
		description: "Keep scores visible without letting them dominate each panel."
	}
];

const GUIDANCE_OPTIONS: ChoiceOption<LocalSettingsState["guidance"]>[] = [
	{
		value: "visible",
		label: "Guided",
		description: "Show explanatory helper text while the platform is still evolving."
	},
	{
		value: "minimal",
		label: "Minimal",
		description: "Reduce helper text once you are comfortable with the flow."
	}
];

/**
 * Convert unknown errors into readable settings-page copy.
 */
function getSettingsErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return fallbackMessage;
}

/**
 * Format a stored role into a UI-friendly label.
 */
function formatRoleLabel(role: UserRole | null | undefined): string {
	if (role === "manager") {
		return "Manager";
	}

	if (role === "auditor") {
		return "Auditor";
	}

	return "Unknown";
}

/**
 * Convert the stored density preference into its UI label.
 */
function getDensityLabel(density: LocalSettingsState["density"]): string {
	return density === "comfortable" ? "Comfortable" : "Compact";
}

/**
 * Convert the stored notification preference into its UI label.
 */
function getNotificationLabel(notifications: LocalSettingsState["notifications"]): string {
	if (notifications === "important") {
		return "Important only";
	}

	if (notifications === "daily") {
		return "Daily digest";
	}

	return "Muted";
}

/**
 * Convert the stored score display preference into its UI label.
 */
function getScoreDisplayLabel(scoreDisplay: LocalSettingsState["scoreDisplay"]): string {
	return scoreDisplay === "highlighted" ? "Highlight scores" : "Balanced view";
}

/**
 * Convert the stored guidance preference into its UI label.
 */
function getGuidanceLabel(guidance: LocalSettingsState["guidance"]): string {
	return guidance === "visible" ? "Guided" : "Minimal";
}

/**
 * Resolve initials for avatar fallbacks without exposing full identifiers.
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
 * Read locally stored settings with runtime validation.
 */
function readStoredLocalSettings(): LocalSettingsState {
	if (globalThis.window === undefined) {
		return DEFAULT_LOCAL_SETTINGS;
	}

	try {
		const rawValue = globalThis.window.localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!rawValue) {
			return DEFAULT_LOCAL_SETTINGS;
		}

		const parsedValue: unknown = JSON.parse(rawValue);
		const result = localSettingsSchema.safeParse(parsedValue);
		return result.success ? result.data : DEFAULT_LOCAL_SETTINGS;
	} catch {
		return DEFAULT_LOCAL_SETTINGS;
	}
}

/**
 * Persist settings locally for this device.
 */
function writeStoredLocalSettings(settings: LocalSettingsState): void {
	if (globalThis.window === undefined) {
		return;
	}

	try {
		globalThis.window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore storage failures so the rest of the settings page remains usable.
	}
}

/**
 * Build a session-aware display name for the profile summary card.
 */
function getSessionDisplayName(session: BrowserAuthSession | null, account: AccountDetail | null): string {
	if (session?.role === "manager") {
		return account?.primary_manager?.full_name ?? account?.name ?? "Manager";
	}

	if (session?.role === "auditor") {
		return session.auditorCode ? `Auditor ${session.auditorCode}` : "Auditor";
	}

	return "Playspace User";
}

/**
 * Build the subtitle shown under the main profile name.
 */
function getProfileSubtitle(session: BrowserAuthSession, account: AccountDetail | null): string {
	if (session.role === "manager") {
		return account?.name ?? "Manager workspace";
	}

	if (session.auditorCode) {
		return `Auditor code ${session.auditorCode}`;
	}

	return "Auditor workspace";
}

/**
 * Resolve a user-facing workspace label from the current role.
 */
function getWorkspaceLabel(role: UserRole): string {
	return role === "manager" ? "Manager workspace" : "Auditor workspace";
}

/**
 * Resolve the best manager settings error message from the active queries.
 */
function getManagerSettingsErrorMessage(input: Readonly<{
	isManager: boolean;
	accountError: unknown;
	managerProfilesError: unknown;
}>): string | null {
	if (!input.isManager) {
		return null;
	}

	if (input.accountError) {
		return getSettingsErrorMessage(input.accountError, "Unable to load account settings.");
	}

	if (input.managerProfilesError) {
		return getSettingsErrorMessage(input.managerProfilesError, "Unable to load manager profiles.");
	}

	return null;
}

/**
 * Resolve the best primary manager to show for account settings.
 */
function getPrimaryManagerProfile(account: AccountDetail, managerProfiles: ManagerProfile[]): ManagerProfile | null {
	const explicitPrimaryProfile = managerProfiles.find(profile => profile.is_primary);
	if (explicitPrimaryProfile) {
		return explicitPrimaryProfile;
	}

	if (account.primary_manager) {
		return account.primary_manager;
	}

	return managerProfiles[0] ?? null;
}

/**
 * Reusable key-value row for settings detail panels.
 */
function DetailItem({ label, value }: Readonly<{ label: string; value: string }>) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
			<p className="text-sm font-medium text-foreground">{value}</p>
		</div>
	);
}

/**
 * Multi-option selector used for settings controls.
 */
function ChoiceGroup<TValue extends string>({
	label,
	helper,
	value,
	options,
	onChange,
	columnsClassName
}: Readonly<{
	label: string;
	helper: string;
	value: TValue;
	options: ChoiceOption<TValue>[];
	onChange: (nextValue: TValue) => void;
	columnsClassName?: string;
}>) {
	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<Label>{label}</Label>
				<p className="text-sm text-muted-foreground">{helper}</p>
			</div>
			<div className={cn("grid gap-3 md:grid-cols-2", columnsClassName)}>
				{options.map(option => {
					const isSelected = option.value === value;

					return (
						<button
							key={option.value}
							type="button"
							onClick={() => onChange(option.value)}
							className={cn(
								"flex min-h-24 flex-col items-start justify-start rounded-field border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
								isSelected
									? "border-primary/30 bg-primary/10 text-foreground shadow-field"
									: "border-border bg-secondary/50 text-foreground hover:bg-secondary"
							)}>
							<span className="font-medium">{option.label}</span>
							<span className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Lightweight loading shell used while settings state hydrates.
 */
function SettingsPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<div className="h-4 w-32 animate-pulse rounded bg-secondary" />
				<div className="h-8 w-56 animate-pulse rounded bg-secondary" />
				<div className="h-4 w-80 animate-pulse rounded bg-secondary" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{SETTINGS_SKELETON_CARD_IDS.map(cardId => {
					return (
						<Card key={cardId} className="animate-pulse">
							<CardContent className="space-y-3 py-6">
								<div className="h-4 w-24 rounded bg-secondary" />
								<div className="h-8 w-24 rounded bg-secondary" />
								<div className="h-4 w-40 rounded bg-secondary" />
							</CardContent>
						</Card>
					);
				})}
			</div>
			<Card className="animate-pulse">
				<CardContent className="py-12">
					<div className="h-48 rounded bg-secondary" />
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Session-missing state used when the protected page cannot find sign-in context.
 */
function SessionUnavailableState() {
	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Workspace Settings"
				title="Settings"
				description="Sign in to view account details, security information, and display preferences."
				actions={
					<Button asChild>
						<Link href="/login">Go to login</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Sign-in required</CardTitle>
					<CardDescription>You need to sign in before you can open settings.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Sign in again to review your account details and update how the workspace looks on this device.
					</p>
					<Button asChild variant="outline">
						<Link href="/login">Go to login</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Header action buttons for the role-aware settings page.
 */
function SettingsActionBar({ dashboardHref }: Readonly<{ dashboardHref: string }>) {
	return (
		<Button asChild variant="outline">
			<Link href={dashboardHref}>
				<LayoutDashboard className="h-4 w-4" aria-hidden="true" />
				Back to dashboard
			</Link>
		</Button>
	);
}


/**
 * Session profile summary card shared across both roles.
 */
function ProfileAccessCard({
	session,
	managerAccount,
	resolvedDisplayName,
	profileSubtitle
}: Readonly<{
	session: BrowserAuthSession;
	managerAccount: AccountDetail | null;
	resolvedDisplayName: string;
	profileSubtitle: string;
}>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Your account</CardTitle>
				<CardDescription>Review the name, role, and contact details shown in this workspace.</CardDescription>
				<CardAction>
					<UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-start gap-4">
					<Avatar size="lg">
						<AvatarFallback>{getAvatarFallbackLabel(resolvedDisplayName)}</AvatarFallback>
					</Avatar>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-lg font-medium text-foreground">{resolvedDisplayName}</p>
							<Badge>{formatRoleLabel(session.role)}</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{profileSubtitle}</p>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<DetailItem label="Role" value={formatRoleLabel(session.role)} />
					<DetailItem label="Workspace" value={getWorkspaceLabel(session.role)} />
					<DetailItem
						label="Account email"
						value={managerAccount?.email ?? "Not available"}
					/>
					<DetailItem
						label="Member since"
						value={managerAccount ? formatDateLabel(managerAccount.created_at) : "Not available"}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Security/session card with masked token display and sign-out action.
 */
function SecuritySessionCard({
	session,
	onSignOut
}: Readonly<{
	session: BrowserAuthSession;
	onSignOut: () => void;
}>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Sign-in and security</CardTitle>
				<CardDescription>Review your current sign-in and sign out when you are done.</CardDescription>
				<CardAction>
					<ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailItem label="Status" value="Signed in" />
					<DetailItem label="Access" value={getWorkspaceLabel(session.role)} />
					<DetailItem
						label="Auditor code"
						value={session.auditorCode ?? "Not applicable"}
					/>
					<DetailItem label="This device" value="Active session" />
				</div>

				<div className="rounded-field border border-border bg-secondary/40 p-4">
					<p className="text-sm font-medium text-foreground">Using a shared device?</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Sign out before you leave to keep your account secure.
					</p>
				</div>

				<Button type="button" variant="secondary" onClick={onSignOut}>
					<LogOut className="h-4 w-4" aria-hidden="true" />
					Sign out
				</Button>
			</CardContent>
		</Card>
	);
}

/**
 * Frontend-only preference controls persisted to browser storage.
 */
function LocalPreferencesCard({
	localSettings,
	setLocalSettings
}: Readonly<{
	localSettings: LocalSettingsState;
	setLocalSettings: React.Dispatch<React.SetStateAction<LocalSettingsState>>;
}>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Display preferences</CardTitle>
				<CardDescription>Choose how the workspace looks and feels while you work.</CardDescription>
				<CardAction>
					<Badge variant="outline">Saved on this device</Badge>
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="space-y-6">
					<ChoiceGroup
						label="Dashboard density"
						helper="Choose how spacious or compact the workspace feels."
						value={localSettings.density}
						options={DENSITY_OPTIONS}
						onChange={nextValue => {
							setLocalSettings(currentValue => ({
								...currentValue,
								density: nextValue
							}));
						}}
					/>

					<ChoiceGroup
						label="Notifications"
						helper="Choose how much guidance and reminder text you want to see."
						value={localSettings.notifications}
						options={NOTIFICATION_OPTIONS}
						onChange={nextValue => {
							setLocalSettings(currentValue => ({
								...currentValue,
								notifications: nextValue
							}));
						}}
						columnsClassName="md:grid-cols-3"
					/>

					<ChoiceGroup
						label="Score presentation"
						helper="Choose how strongly scores stand out across the workspace."
						value={localSettings.scoreDisplay}
						options={SCORE_DISPLAY_OPTIONS}
						onChange={nextValue => {
							setLocalSettings(currentValue => ({
								...currentValue,
								scoreDisplay: nextValue
							}));
						}}
					/>

					<ChoiceGroup
						label="Guidance density"
						helper="Choose how much explanatory text you want while moving through the app."
						value={localSettings.guidance}
						options={GUIDANCE_OPTIONS}
						onChange={nextValue => {
							setLocalSettings(currentValue => ({
								...currentValue,
								guidance: nextValue
							}));
						}}
					/>

					<div className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<div className="space-y-1">
								<Label htmlFor="workspace-note">Workspace note</Label>
								<p className="text-sm text-muted-foreground">Add a short note for yourself.</p>
							</div>
							<Badge variant="secondary">{localSettings.workspaceNote.length}/280</Badge>
						</div>
						<Textarea
							id="workspace-note"
							value={localSettings.workspaceNote}
							maxLength={280}
							placeholder="Example: Keep the layout compact and score highlights subtle while reviewing results."
							onChange={event => {
								setLocalSettings(currentValue => ({
									...currentValue,
									workspaceNote: event.target.value
								}));
							}}
						/>
					</div>
				</div>

				<div className="space-y-4 rounded-field border border-border bg-secondary/40 p-5">
					<div className="flex items-center gap-2">
						<Palette className="h-4 w-4 text-primary" aria-hidden="true" />
						<p className="font-medium text-foreground">Preference summary</p>
					</div>
					<p className="text-sm text-muted-foreground">
						These choices change how the workspace feels while you use it.
					</p>
					<div className="space-y-4">
						<DetailItem label="Density" value={getDensityLabel(localSettings.density)} />
						<DetailItem label="Notifications" value={getNotificationLabel(localSettings.notifications)} />
						<DetailItem label="Score display" value={getScoreDisplayLabel(localSettings.scoreDisplay)} />
						<DetailItem label="Guidance" value={getGuidanceLabel(localSettings.guidance)} />
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setLocalSettings(DEFAULT_LOCAL_SETTINGS);
						}}>
						<Sparkles className="h-4 w-4" aria-hidden="true" />
						Reset local defaults
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Manager-only settings panels powered by the shared account endpoints.
 */
function ManagerSettingsSection({
	account,
	managerProfiles,
	isLoading,
	errorMessage
}: Readonly<{
	account: AccountDetail | null;
	managerProfiles: ManagerProfile[];
	isLoading: boolean;
	errorMessage: string | null;
}>) {
	if (isLoading) {
		return (
			<div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
				<Card className="animate-pulse">
					<CardContent className="py-12">
						<div className="h-48 rounded bg-secondary" />
					</CardContent>
				</Card>
				<Card className="animate-pulse">
					<CardContent className="py-12">
						<div className="h-48 rounded bg-secondary" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!account) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Organization account</CardTitle>
					<CardDescription>Organization details will appear here when they are available.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">{errorMessage ?? "We could not load your organization details right now."}</p>
					<Button asChild variant="outline">
						<Link href="/manager/dashboard">Return to dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const primaryManagerProfile = getPrimaryManagerProfile(account, managerProfiles);
	const additionalManagerProfiles = managerProfiles.filter(profile => {
		if (!primaryManagerProfile) {
			return true;
		}

		return profile.id !== primaryManagerProfile.id;
	});

	return (
		<div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
			<Card>
				<CardHeader>
					<CardTitle>Organization account</CardTitle>
					<CardDescription>Review the organization and main contact attached to this workspace.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailItem label="Organization" value={account.name} />
						<DetailItem label="Account email" value={account.email} />
						<DetailItem label="Primary contact" value={primaryManagerProfile?.full_name ?? "Pending"} />
						<DetailItem label="Member since" value={formatDateLabel(account.created_at)} />
					</div>

					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<p className="text-sm font-medium text-foreground">Primary contact</p>
						{primaryManagerProfile ? (
							<div className="mt-3 space-y-1">
								<p className="text-sm text-foreground">{primaryManagerProfile.full_name}</p>
								<p className="text-sm text-muted-foreground">
									{primaryManagerProfile.position ?? "Position pending"}
								</p>
								<p className="text-sm text-muted-foreground">{primaryManagerProfile.email}</p>
								<p className="text-sm text-muted-foreground">
									{primaryManagerProfile.phone ?? "Phone pending"}
								</p>
							</div>
						) : (
							<p className="mt-3 text-sm text-muted-foreground">
								Primary contact information will appear here once the account owner is configured.
							</p>
						)}
					</div>

					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<p className="text-sm font-medium text-foreground">Organization details</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Use this section to confirm that the organization name, contact email, and primary owner are
							correct.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Access contacts</CardTitle>
					<CardDescription>People with manager access to this workspace.</CardDescription>
					<CardAction>
						<Badge variant="secondary">{`${managerProfiles.length} contact${managerProfiles.length === 1 ? "" : "s"}`}</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailItem label="Primary contact" value={primaryManagerProfile?.full_name ?? "Pending"} />
						<DetailItem label="Other contacts" value={String(additionalManagerProfiles.length)} />
						<DetailItem label="Access level" value="Manager" />
						<DetailItem label="Contact list" value="Shown below" />
					</div>

					{managerProfiles.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Manager contact information will appear here once the account roster is configured.
						</p>
					) : null}

					<div className="space-y-3">
						{managerProfiles.map(profile => {
							return (
								<div
									key={profile.id}
									className="flex items-start gap-3 rounded-field border border-border bg-secondary/40 p-4">
									<Avatar size="sm">
										<AvatarFallback>{getAvatarFallbackLabel(profile.full_name)}</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium text-foreground">{profile.full_name}</p>
											{profile.is_primary ? (
												<Badge>Primary contact</Badge>
											) : (
												<Badge variant="secondary">Admin contact</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{profile.position ?? "Position pending"}
										</p>
										<p className="text-sm text-muted-foreground">{profile.email}</p>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Auditor-facing placeholder panel until dedicated auditor settings endpoints land.
 */
function AuditorSettingsSection({ session }: Readonly<{ session: BrowserAuthSession }>) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
			<Card>
				<CardHeader>
					<CardTitle>Your access</CardTitle>
					<CardDescription>Review the details tied to your auditor sign-in.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailItem label="Role" value="Auditor" />
						<DetailItem label="Auditor code" value={session.auditorCode ?? "Code pending"} />
						<DetailItem label="Access level" value="Auditor" />
						<DetailItem label="Workspace" value="Field audits" />
					</div>

					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<p className="text-sm font-medium text-foreground">Need to switch accounts?</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Sign out and sign back in if your auditor code or access looks incorrect.
						</p>
					</div>

					<Button asChild variant="outline">
						<Link href="/auditor/dashboard">
							<LayoutDashboard className="h-4 w-4" aria-hidden="true" />
							Open auditor dashboard
						</Link>
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Workspace tips</CardTitle>
					<CardDescription>Helpful reminders while you work through audits.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<div className="flex items-center gap-2">
							<Badge>Signed in</Badge>
							<p className="font-medium text-foreground">Your access is active</p>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							You can use this page to review your details and return to the audit workspace.
						</p>
					</div>
					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<div className="flex items-center gap-2">
							<Badge variant="secondary">Preferences</Badge>
							<p className="font-medium text-foreground">Saved on this device</p>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Display preferences on this page apply to this device.
						</p>
					</div>
					<div className="rounded-field border border-border bg-secondary/40 p-4">
						<div className="flex items-center gap-2">
							<Badge variant="outline">Tip</Badge>
							<p className="font-medium text-foreground">Check your code before starting</p>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							If your auditor code is missing, sign out and sign back in before beginning an audit.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function SettingsPage() {
	const router = useRouter();
	const [isSessionReady, setIsSessionReady] = React.useState(false);
	const [session, setSession] = React.useState<BrowserAuthSession | null>(null);
	const [localSettings, setLocalSettings] = React.useState<LocalSettingsState>(DEFAULT_LOCAL_SETTINGS);

	/**
	 * Hydrate browser-only session and settings state after mount.
	 */
	React.useEffect(() => {
		setSession(getBrowserAuthSession());
		setLocalSettings(readStoredLocalSettings());
		setIsSessionReady(true);
	}, []);

	/**
	 * Persist local-only preview settings after hydration.
	 */
	React.useEffect(() => {
		if (!isSessionReady) {
			return;
		}

		writeStoredLocalSettings(localSettings);
	}, [isSessionReady, localSettings]);

	const isManager = session?.role === "manager";
	const dashboardHref = isManager ? "/manager/dashboard" : "/auditor/dashboard";

	const accountQuery = useQuery({
		queryKey: ["playspace", "settings", "account", PLAYSPACE_DEMO_ACCOUNT_ID],
		queryFn: () => playspaceApi.accounts.get(PLAYSPACE_DEMO_ACCOUNT_ID),
		enabled: isSessionReady && isManager
	});

	const managerProfilesQuery = useQuery({
		queryKey: ["playspace", "settings", "account", PLAYSPACE_DEMO_ACCOUNT_ID, "managerProfiles"],
		queryFn: () => playspaceApi.accounts.managerProfiles(PLAYSPACE_DEMO_ACCOUNT_ID),
		enabled: isSessionReady && isManager
	});

	const managerAccount = accountQuery.data ?? null;
	const managerProfiles = managerProfilesQuery.data ?? [];
	const resolvedDisplayName = getSessionDisplayName(session, managerAccount);
	const managerSettingsErrorMessage = getManagerSettingsErrorMessage({
		isManager,
		accountError: accountQuery.error,
		managerProfilesError: managerProfilesQuery.error
	});

	if (!isSessionReady) {
		return <SettingsPageSkeleton />;
	}

	if (!session) {
		return <SessionUnavailableState />;
	}

	const profileSubtitle = getProfileSubtitle(session, managerAccount);

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Workspace Settings"
				title="Settings"
				description="Manage account details, sign-in information, and display preferences."
				actions={<SettingsActionBar dashboardHref={dashboardHref} />}
			/>

			<div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
				<ProfileAccessCard
					session={session}
					managerAccount={managerAccount}
					resolvedDisplayName={resolvedDisplayName}
					profileSubtitle={profileSubtitle}
				/>
				<SecuritySessionCard
					session={session}
					onSignOut={() => {
						clearBrowserAuthSession();
						router.push("/login");
					}}
				/>
			</div>

			<LocalPreferencesCard localSettings={localSettings} setLocalSettings={setLocalSettings} />

			{isManager ? (
				<ManagerSettingsSection
					account={managerAccount}
					managerProfiles={managerProfiles}
					isLoading={accountQuery.isLoading || managerProfilesQuery.isLoading}
					errorMessage={managerSettingsErrorMessage}
				/>
			) : (
				<AuditorSettingsSection session={session} />
			)}
		</div>
	);
}

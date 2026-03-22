"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { playspaceApi, type AccountDetail, type AuditorSummary, type ManagerProfile } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { AuditorsTable } from "@/components/dashboard/auditors-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatAuditCodeReference, formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOADING_STAT_CARD_IDS = ["projects", "places", "auditors", "audits"] as const;

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}

	return fallbackMessage;
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{LOADING_STAT_CARD_IDS.map((cardId, index) => {
					return (
						<Card key={cardId}>
							<CardContent className="space-y-3 py-6">
								<Skeleton className={index % 2 === 0 ? "h-3.5 w-24" : "h-3.5 w-20"} />
								<Skeleton className={index === 2 ? "h-9 w-24" : "h-9 w-20"} />
								<Skeleton className={index === 1 ? "h-4 w-44" : "h-4 w-36"} />
							</CardContent>
						</Card>
					);
				})}
			</div>
			<Card>
				<CardContent className="py-10">
					<div className="space-y-4">
						<Skeleton className="h-5 w-36" />
						<Skeleton className="h-4 w-full max-w-lg" />
						<Skeleton className="h-28 w-full rounded-card" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function OverviewPanels({
	account,
	managerProfiles,
	auditors
}: Readonly<{
	account: AccountDetail;
	managerProfiles: ManagerProfile[];
	auditors: AuditorSummary[];
}>) {
	const t = useTranslations("manager.dashboard.overview");

	return (
		<div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
			<Card>
				<CardHeader>
					<CardTitle>{t("primaryManager.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{account.primary_manager ? (
						<>
							<div className="space-y-1">
								<p className="text-lg font-medium text-foreground">
									{account.primary_manager.full_name}
								</p>
								<p className="text-sm text-muted-foreground">
									{account.primary_manager.position ?? t("primaryManager.positionPending")}
								</p>
								<p className="text-sm text-muted-foreground">{account.primary_manager.email}</p>
								<p className="text-sm text-muted-foreground">
									{account.primary_manager.phone ?? t("primaryManager.phonePending")}
								</p>
							</div>
							<p className="text-sm text-muted-foreground">{t("primaryManager.accountEmail", { email: account.email })}</p>
						</>
					) : (
						<p className="text-sm text-muted-foreground">{t("primaryManager.empty")}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("teamSnapshot.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{t("teamSnapshot.managerCount", { count: managerProfiles.length })}</Badge>
						<Badge variant="outline">{t("teamSnapshot.auditorCount", { count: auditors.length })}</Badge>
					</div>
					<div className="space-y-3">
						{managerProfiles.map(profile => {
							return (
								<div
									key={profile.id}
									className="flex items-start justify-between gap-4 rounded-card border border-border/70 bg-card/60 p-4">
									<div className="space-y-1">
										<p className="font-medium text-foreground">{profile.full_name}</p>
										<p className="text-sm text-muted-foreground">
											{profile.position ?? t("teamSnapshot.positionPending")}
										</p>
									</div>
									{profile.is_primary ? (
										<Badge>{t("teamSnapshot.primary")}</Badge>
									) : (
										<Badge variant="secondary">{t("teamSnapshot.manager")}</Badge>
									)}
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function ManagerDashboardPage() {
	const t = useTranslations("manager.dashboard");
	const formatT = useTranslations("common.format");
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const accountQuery = useQuery({
		queryKey: ["playspace", "account", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.get(accountId);
		},
		enabled: accountId !== null
	});

	const managerProfilesQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "managerProfiles"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.managerProfiles(accountId);
		},
		enabled: accountId !== null
	});

	const projectsQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "projects"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "auditors"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});

	if (!accountId) {
		return (
			<EmptyState
				title={t("emptyState.title")}
				description={t("emptyState.missingAccount")}
			/>
		);
	}

	if (
		accountQuery.isLoading ||
		managerProfilesQuery.isLoading ||
		projectsQuery.isLoading ||
		auditorsQuery.isLoading
	) {
		return <LoadingState />;
	}

	if (accountQuery.isError || managerProfilesQuery.isError || projectsQuery.isError || auditorsQuery.isError) {
		const error = accountQuery.error ?? managerProfilesQuery.error ?? projectsQuery.error ?? auditorsQuery.error;

		return (
			<EmptyState
				title={t("emptyState.title")}
				description={getErrorMessage(error, t("errors.loadFailed"))}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.tryAgain")}
					</Button>
				}
			/>
		);
	}

	if (!accountQuery.data || !managerProfilesQuery.data || !projectsQuery.data || !auditorsQuery.data) {
		return <LoadingState />;
	}

	const account = accountQuery.data;
	const managerProfiles = managerProfilesQuery.data;
	const projects = projectsQuery.data;
	const auditors = auditorsQuery.data;
	const recentActivity = account.recent_activity.slice(0, 5);

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={account.name}
				description={t("header.description")}
				actions={
					<Button asChild>
						<Link href="/manager/projects">{t("header.viewProjects")}</Link>
					</Button>
				}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title={t("stats.projects.title")}
					value={String(account.stats.total_projects)}
					helper={t("stats.projects.helper")}
				/>
				<StatCard
					title={t("stats.places.title")}
					value={String(account.stats.total_places)}
					helper={t("stats.places.helper")}
					tone="violet"
				/>
				<StatCard
					title={t("stats.auditors.title")}
					value={String(account.stats.total_auditors)}
					helper={t("stats.auditors.helper")}
					tone="warning"
				/>
				<StatCard
					title={t("stats.completedAudits.title")}
					value={String(account.stats.total_audits_completed)}
					helper={t("stats.completedAudits.helper")}
					tone="success"
				/>
			</div>

			<OverviewPanels account={account} managerProfiles={managerProfiles} auditors={auditors} />

			<div className="flex flex-col gap-6">
				<Tabs defaultValue={projects.length > 0 ? "projects" : "auditors"} className="gap-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<TabsList>
							<TabsTrigger value="projects">{t("tabs.projects")}</TabsTrigger>
							<TabsTrigger value="auditors">{t("tabs.auditors")}</TabsTrigger>
						</TabsList>
						<p className="text-sm text-muted-foreground">{t("tabs.description")}</p>
					</div>
					<TabsContent value="projects">
						{projects.length > 0 ? (
							<ProjectsTable
								projects={projects}
								title={t("projectOverview.title")}
								description={t("projectOverview.description")}
								pageSize={5}
								action={
									<Button asChild size="sm" variant="outline" className="h-9 gap-2 px-3.5">
										<Link href="/manager/projects">{t("projectOverview.viewAll")}</Link>
									</Button>
								}
							/>
						) : (
							<EmptyState
								title={t("projectOverview.emptyTitle")}
								description={t("projectOverview.emptyDescription")}
								action={
									<Button asChild variant="outline">
										<Link href="/manager/projects">{t("projectOverview.openProjects")}</Link>
									</Button>
								}
							/>
						)}
					</TabsContent>
					<TabsContent value="auditors">
						{auditors.length > 0 ? (
							<AuditorsTable
								auditors={auditors}
								title={t("auditorOverview.title")}
								description={t("auditorOverview.description")}
								pageSize={5}
								action={
									<Button asChild size="sm" variant="outline">
										<Link href="/manager/auditors">{t("auditorOverview.viewAll")}</Link>
									</Button>
								}
							/>
						) : (
							<EmptyState
								title={t("auditorOverview.emptyTitle")}
								description={t("auditorOverview.emptyDescription")}
								action={
									<Button asChild variant="outline">
										<Link href="/manager/auditors">{t("auditorOverview.openAuditors")}</Link>
									</Button>
								}
							/>
						)}
					</TabsContent>
				</Tabs>
				<Card>
					<CardHeader>
						<CardTitle>{t("recentActivity.title")}</CardTitle>
						<CardAction>
							<Button asChild size="sm" variant="outline">
								<Link href="/manager/audits">{t("recentActivity.viewAll")}</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentActivity.length > 0 ? (
							recentActivity.map(activity => {
								return (
									<div
										key={activity.audit_id}
										className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4">
										<div className="space-y-1">
											<p className="font-medium text-foreground">{activity.place_name}</p>
											<p className="text-sm text-muted-foreground">{activity.project_name}</p>
											<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
												<code
													title={activity.audit_code}
													className="rounded-md bg-muted/65 px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground/80">
													{formatAuditCodeReference(activity.audit_code)}
												</code>
												<span>{formatDateTimeLabel(activity.completed_at, formatT)}</span>
											</div>
										</div>
										<div className="flex items-center justify-between gap-2">
											<Badge variant="secondary" className="font-medium">
												{t("recentActivity.submitted")}
											</Badge>
											<Badge className="font-mono tabular-nums">
												{formatScoreLabel(activity.score, formatT)}
											</Badge>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-sm text-muted-foreground">{t("recentActivity.empty")}</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

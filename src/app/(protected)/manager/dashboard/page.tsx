"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Something went wrong while loading the dashboard.";
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
	return (
		<div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
			<Card>
				<CardHeader>
					<CardTitle>Primary manager</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{account.primary_manager ? (
						<>
							<div className="space-y-1">
								<p className="text-lg font-medium text-foreground">
									{account.primary_manager.full_name}
								</p>
								<p className="text-sm text-muted-foreground">
									{account.primary_manager.position ?? "Position pending"}
								</p>
								<p className="text-sm text-muted-foreground">{account.primary_manager.email}</p>
								<p className="text-sm text-muted-foreground">
									{account.primary_manager.phone ?? "Phone pending"}
								</p>
							</div>
							<p className="text-sm text-muted-foreground">Account email: {account.email}</p>
						</>
					) : (
						<p className="text-sm text-muted-foreground">No primary manager profile has been added yet.</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Team snapshot</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{managerProfiles.length} managers</Badge>
						<Badge variant="outline">{auditors.length} auditors</Badge>
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
											{profile.position ?? "Position pending"}
										</p>
									</div>
									{profile.is_primary ? (
										<Badge>Primary</Badge>
									) : (
										<Badge variant="secondary">Manager</Badge>
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
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const accountQuery = useQuery({
		queryKey: ["playspace", "account", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.get(accountId);
		},
		enabled: accountId !== null
	});

	const managerProfilesQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "managerProfiles"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.managerProfiles(accountId);
		},
		enabled: accountId !== null
	});

	const projectsQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "projects"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "auditors"],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});

	if (!accountId) {
		return (
			<EmptyState
				title="Dashboard unavailable"
				description="Manager account context is missing from the current session."
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
				title="Dashboard unavailable"
				description={getErrorMessage(error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
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
				eyebrow="Manager Dashboard"
				title={account.name}
				description="Shared account-level view across projects, places, auditors, and recent submissions."
				actions={
					<Button asChild>
						<Link href="/manager/projects">View projects</Link>
					</Button>
				}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Projects"
					value={String(account.stats.total_projects)}
					helper="Active and planned projects in this account."
				/>
				<StatCard
					title="Places"
					value={String(account.stats.total_places)}
					helper="Total places connected to those projects."
					tone="violet"
				/>
				<StatCard
					title="Auditors"
					value={String(account.stats.total_auditors)}
					helper="Auditors currently assigned under this account."
					tone="warning"
				/>
				<StatCard
					title="Completed Audits"
					value={String(account.stats.total_audits_completed)}
					helper="Submitted audits available for review and reporting."
					tone="success"
				/>
			</div>

			<OverviewPanels account={account} managerProfiles={managerProfiles} auditors={auditors} />

			<div className="flex flex-col gap-6">
				<Tabs defaultValue={projects.length > 0 ? "projects" : "auditors"} className="gap-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<TabsList>
							<TabsTrigger value="projects">Projects</TabsTrigger>
							<TabsTrigger value="auditors">Auditors</TabsTrigger>
						</TabsList>
						<p className="text-sm text-muted-foreground">
							Focus on the highest-signal rows here, then open the full worklists when you need more
							detail.
						</p>
					</div>
					<TabsContent value="projects">
						{projects.length > 0 ? (
							<ProjectsTable
								projects={projects}
								title="Project overview"
								description="Highest-signal projects for daily monitoring."
								pageSize={5}
								action={
									<Button asChild size="sm" variant="outline" className="h-9 gap-2 px-3.5">
										<Link href="/manager/projects">View all projects</Link>
									</Button>
								}
							/>
						) : (
							<EmptyState
								title="No projects yet"
								description="Projects will appear here once the team starts creating audit workstreams."
								action={
									<Button asChild variant="outline">
										<Link href="/manager/projects">Open projects</Link>
									</Button>
								}
							/>
						)}
					</TabsContent>
					<TabsContent value="auditors">
						{auditors.length > 0 ? (
							<AuditorsTable
								auditors={auditors}
								title="Assigned auditors"
								description="Current roster activity and assignment load."
								pageSize={5}
								action={
									<Button asChild size="sm" variant="outline">
										<Link href="/manager/auditors">View all auditors</Link>
									</Button>
								}
							/>
						) : (
							<EmptyState
								title="No auditors assigned"
								description="Invite or assign auditors to see role, workload, and activity here."
								action={
									<Button asChild variant="outline">
										<Link href="/manager/auditors">Open auditors</Link>
									</Button>
								}
							/>
						)}
					</TabsContent>
				</Tabs>
				<Card>
					<CardHeader>
						<CardTitle>Recent activity</CardTitle>
						<CardAction>
							<Button asChild size="sm" variant="outline">
								<Link href="/manager/audits">View all audits</Link>
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
												<span>{formatDateTimeLabel(activity.completed_at)}</span>
											</div>
										</div>
										<div className="flex items-center justify-between gap-2">
											<Badge variant="secondary" className="font-medium">
												Submitted
											</Badge>
											<Badge className="font-mono tabular-nums">
												{formatScoreLabel(activity.score)}
											</Badge>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-sm text-muted-foreground">No submitted audits yet.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

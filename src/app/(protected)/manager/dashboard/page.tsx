"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import {
	PLAYSPACE_DEMO_ACCOUNT_ID,
	playspaceApi,
	type AccountDetail,
	type AuditorSummary,
	type ManagerProfile
} from "@/lib/api/playspace";
import { AuditorAccessRequestsPanel } from "@/components/dashboard/auditor-access-requests-panel";
import { AuditorsTable } from "@/components/dashboard/auditors-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LOADING_CARD_IDS = ["projects", "places", "auditors", "audits"] as const;

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
				{LOADING_CARD_IDS.map(cardId => {
					return (
						<Card key={cardId} className="animate-pulse">
							<CardContent className="space-y-3 py-6">
								<div className="h-4 w-24 rounded bg-secondary" />
								<div className="h-8 w-20 rounded bg-secondary" />
								<div className="h-4 w-40 rounded bg-secondary" />
							</CardContent>
						</Card>
					);
				})}
			</div>
			<Card className="animate-pulse">
				<CardContent className="py-10">
					<div className="h-40 rounded bg-secondary" />
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
									className="flex items-start justify-between gap-4 rounded-field border border-border bg-secondary/60 p-3">
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
	const accountQuery = useQuery({
		queryKey: ["playspace", "account", PLAYSPACE_DEMO_ACCOUNT_ID],
		queryFn: () => playspaceApi.accounts.get(PLAYSPACE_DEMO_ACCOUNT_ID)
	});

	const managerProfilesQuery = useQuery({
		queryKey: ["playspace", "account", PLAYSPACE_DEMO_ACCOUNT_ID, "managerProfiles"],
		queryFn: () => playspaceApi.accounts.managerProfiles(PLAYSPACE_DEMO_ACCOUNT_ID)
	});

	const projectsQuery = useQuery({
		queryKey: ["playspace", "account", PLAYSPACE_DEMO_ACCOUNT_ID, "projects"],
		queryFn: () => playspaceApi.accounts.projects(PLAYSPACE_DEMO_ACCOUNT_ID)
	});

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "account", PLAYSPACE_DEMO_ACCOUNT_ID, "auditors"],
		queryFn: () => playspaceApi.accounts.auditors(PLAYSPACE_DEMO_ACCOUNT_ID)
	});

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
					<Button
						type="button"
						onClick={() => {
							globalThis.window.location.reload();
						}}>
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

			<AuditorAccessRequestsPanel accountId={account.id} projects={projects} />

			{projects.length > 0 ? (
				<ProjectsTable projects={projects} title="Project overview" />
			) : (
				<EmptyState
					title="No projects yet"
					description="Projects will appear here once the team starts creating audit workstreams."
				/>
			)}

			{auditors.length > 0 ? (
				<AuditorsTable auditors={auditors} title="Assigned auditors" />
			) : (
				<EmptyState
					title="No auditors assigned"
					description="Invite or assign auditors to see role, workload, and activity here."
				/>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Recent activity</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{account.recent_activity.length > 0 ? (
						account.recent_activity.map(activity => {
							return (
								<div
									key={activity.audit_id}
									className="flex flex-col gap-3 rounded-field border border-border bg-secondary/50 p-4 lg:flex-row lg:items-center lg:justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">{activity.place_name}</p>
										<p className="text-sm text-muted-foreground">
											{activity.project_name} · {activity.audit_code}
										</p>
										<p className="text-sm text-muted-foreground">
											{formatDateTimeLabel(activity.completed_at)}
										</p>
									</div>
									<Badge>{formatScoreLabel(activity.score)}</Badge>
								</div>
							);
						})
					) : (
						<p className="text-sm text-muted-foreground">No submitted audits yet.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

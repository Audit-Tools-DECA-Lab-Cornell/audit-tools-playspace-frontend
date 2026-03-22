"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
	const overviewQuery = useQuery({
		queryKey: ["playspace", "admin", "overview"],
		queryFn: () => playspaceApi.admin.overview()
	});
	const auditsQuery = useQuery({
		queryKey: ["playspace", "admin", "audits", "dashboardPreview"],
		queryFn: () => playspaceApi.admin.audits()
	});

	if (overviewQuery.isLoading || auditsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (overviewQuery.isError || auditsQuery.isError || !overviewQuery.data || !auditsQuery.data) {
		return (
			<EmptyState
				title="Administrator dashboard unavailable"
				description="Refresh this page to retry. If the issue continues, verify the administrator sign-in context and reopen the dashboard."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const overview = overviewQuery.data;
	const latestAudits = auditsQuery.data.slice(0, 5);

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="Platform overview"
				description="Global visibility across accounts, projects, places, auditors, and audit state."
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button asChild variant="secondary">
							<Link href="/admin/accounts">Accounts</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/admin/audits">Audits</Link>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
				<StatCard
					title="Accounts"
					value={String(overview.total_accounts)}
					helper="Registered workspace accounts."
				/>
				<StatCard
					title="Projects"
					value={String(overview.total_projects)}
					helper="Tracked programs across accounts."
				/>
				<StatCard
					title="Places"
					value={String(overview.total_places)}
					helper="Active audit locations in the platform."
					tone="violet"
				/>
				<StatCard
					title="Auditors"
					value={String(overview.total_auditors)}
					helper="Profiles with field delivery access."
					tone="warning"
				/>
				<StatCard
					title="Audits"
					value={String(overview.total_audits)}
					helper="All audit sessions discovered platform-wide."
				/>
				<StatCard
					title="Submitted"
					value={String(overview.submitted_audits)}
					helper="Completed sessions with scoring."
					tone="success"
				/>
				<StatCard
					title="In progress"
					value={String(overview.in_progress_audits)}
					helper="Sessions still being worked on."
					tone="warning"
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Latest audits</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{latestAudits.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Recent audit activity will appear here once accounts begin submitting sessions.
						</p>
					) : (
						latestAudits.map(audit => (
							<div
								key={audit.audit_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="space-y-1">
									<p className="font-mono text-sm font-semibold tracking-[0.08em] text-foreground uppercase">
										{audit.audit_code}
									</p>
									<p className="text-sm text-muted-foreground">
										{audit.account_name} · {audit.project_name} · {audit.place_name}
									</p>
								</div>
								<p className="text-sm text-muted-foreground">
									Auditor:{" "}
									<span className="font-mono uppercase tracking-[0.08em] text-foreground">
										{audit.auditor_code}
									</span>
								</p>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}

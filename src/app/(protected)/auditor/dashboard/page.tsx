"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getStatusBadgeVariant(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | null) {
	if (status === "SUBMITTED") return "default";
	if (status === "IN_PROGRESS" || status === "PAUSED") return "secondary";
	return "outline";
}

function getStatusLabel(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | null): string {
	if (!status) return "not started";
	return status.toLowerCase().replaceAll("_", " ");
}

export default function AuditorDashboardPage() {
	const placesQuery = useQuery({
		queryKey: ["playspace", "auditor", "assignedPlaces"],
		queryFn: () => playspaceApi.auditor.assignedPlaces()
	});
	const summaryQuery = useQuery({
		queryKey: ["playspace", "auditor", "dashboardSummary"],
		queryFn: () => playspaceApi.auditor.dashboardSummary()
	});
	const places = placesQuery.data ?? [];
	const featuredPlaces = places.slice(0, 5);

	if (placesQuery.isLoading || summaryQuery.isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-24 animate-pulse rounded-card border border-border bg-card" />
				<div className="h-64 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (placesQuery.isError || summaryQuery.isError || !placesQuery.data || !summaryQuery.data) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Auditor Workspace"
					title="Auditor dashboard"
					description="Your assigned places and audit execution tasks."
				/>
				<Card>
					<CardHeader>
						<CardTitle>Unable to load auditor dashboard</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Try refreshing the page. If the issue persists, verify your sign-in role and auditor code.
						</p>
						<Button type="button" onClick={() => globalThis.location.reload()}>
							Refresh
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const summary = summaryQuery.data;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Auditor Workspace"
				title="Auditor dashboard"
				description="Your assigned places and audit execution tasks."
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<StatCard
					title="Assigned places"
					value={String(summary.total_assigned_places)}
					helper="Places currently in your field roster."
				/>
				<StatCard
					title="In progress"
					value={String(summary.in_progress_audits)}
					helper="Active or paused sessions awaiting completion."
					tone="warning"
				/>
				<StatCard
					title="Submitted"
					value={String(summary.submitted_audits)}
					helper="Completed sessions already turned in."
					tone="success"
				/>
				<StatCard
					title="Pending places"
					value={String(summary.pending_places)}
					helper="Assigned locations without a submitted audit yet."
				/>
				<StatCard
					title="Mean submitted score"
					value={formatScoreLabel(summary.average_submitted_score)}
					helper="Average across submitted sessions only."
					tone="violet"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Assigned places</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{places.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Assigned places will appear here after a manager grants access. Refresh if you were just
							assigned.
						</p>
					) : null}
					{featuredPlaces.map(place => {
						const actionHref = `/auditor/execute/${encodeURIComponent(place.place_id)}`;
						const reportHref =
							place.audit_id !== null
								? `/auditor/reports/${encodeURIComponent(place.audit_id)}`
								: "/auditor/reports";
						const actionLabel =
							place.audit_status === "IN_PROGRESS" || place.audit_status === "PAUSED"
								? "Resume audit"
								: "Start audit";

						return (
							<div
								key={place.place_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<p className="truncate font-medium">{place.place_name}</p>
									<p className="text-sm text-muted-foreground">{place.project_name}</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant={getStatusBadgeVariant(place.audit_status)}
										className="font-medium tracking-[0.14em] uppercase">
										{getStatusLabel(place.audit_status)}
									</Badge>
									{place.audit_status === "SUBMITTED" ? (
										<Button asChild size="sm" variant="secondary">
											<Link href={reportHref}>Open report</Link>
										</Button>
									) : (
										<Button asChild size="sm">
											<Link href={actionHref}>{actionLabel}</Link>
										</Button>
									)}
								</div>
							</div>
						);
					})}
					{places.length > featuredPlaces.length ? (
						<div className="border-t border-border pt-4">
							<Button asChild variant="outline">
								<Link href="/auditor/places">View all assigned places</Link>
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

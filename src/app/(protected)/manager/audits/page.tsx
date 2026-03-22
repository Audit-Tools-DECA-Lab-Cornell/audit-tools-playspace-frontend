"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardListIcon, MapPinnedIcon } from "lucide-react";

import { playspaceApi } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to load manager audits.";
}

export default function ManagerAuditsPage() {
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const auditsQuery = useQuery({
		queryKey: ["playspace", "manager", "audits", accountId],
		queryFn: async (): Promise<AuditActivityRow[]> => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}

			const projects = await playspaceApi.accounts.projects(accountId);
			const placesByProject = await Promise.all(
				projects.map(async project => {
					const places = await playspaceApi.projects.places(project.id);
					return places.map(place => ({
						id: place.id,
						name: place.name,
						project_id: project.id,
						project_name: project.name
					}));
				})
			);

			const places = placesByProject.flat();
			const histories = await Promise.all(
				places.map(async place => {
					const history = await playspaceApi.places.history(place.id);
					return history.audits.map(audit => ({
						id: audit.audit_id,
						auditCode: audit.audit_code,
						status: audit.status,
						auditorCode: audit.auditor_code,
						projectName: place.project_name,
						placeName: place.name,
						startedAt: audit.started_at,
						submittedAt: audit.submitted_at,
						score: audit.summary_score
					}));
				})
			);

			return histories.flat();
		},
		enabled: accountId !== null
	});

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audits"
					description="Track audit throughput and session health across your account."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Audits" }]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">
							Manager account context is missing from the current session.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (auditsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audits"
					description="Track audit throughput and session health across your account."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Audits" }]}
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={`audit-stat-skeleton-${index}`}
							className="h-32 animate-pulse rounded-card border border-border bg-card"
						/>
					))}
				</div>
				<div className="h-[420px] animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (auditsQuery.isError || !auditsQuery.data) {
		return (
			<EmptyState
				title="Audits unavailable"
				description={getErrorMessage(auditsQuery.error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const audits = auditsQuery.data;
	const submittedAudits = audits.filter(audit => audit.status === "SUBMITTED").length;
	const inProgressAudits = audits.filter(audit => audit.status === "IN_PROGRESS" || audit.status === "PAUSED").length;
	const scoredAudits = audits.filter((audit): audit is AuditActivityRow & { score: number } => audit.score !== null);
	const meanScore =
		scoredAudits.length > 0
			? `${Math.round((scoredAudits.reduce((runningTotal, audit) => runningTotal + audit.score, 0) / scoredAudits.length) * 10) / 10}`
			: "Pending";

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Audits"
				description="Track audit throughput and session health across your account."
				breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Audits" }]}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button asChild variant="outline">
							<Link href="/manager/places" className="gap-2">
								<MapPinnedIcon className="size-4" />
								<span>Open places</span>
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/manager/assignments" className="gap-2">
								<ClipboardListIcon className="size-4" />
								<span>Manage assignments</span>
							</Link>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Audits"
					value={String(audits.length)}
					helper="All audit sessions discovered across manager places."
				/>
				<StatCard
					title="Submitted"
					value={String(submittedAudits)}
					helper="Sessions that have been completed and submitted."
					tone="success"
				/>
				<StatCard
					title="In Progress"
					value={String(inProgressAudits)}
					helper="Sessions still being worked on or paused."
					tone="warning"
				/>
				<StatCard
					title="Mean Score"
					value={meanScore}
					helper="Average across submitted sessions with scoring."
					tone="violet"
				/>
			</div>
			<AuditsTable
				rows={audits}
				title="Audit Activity"
				description="Search and filter audit sessions across projects and places."
				emptyMessage={
					audits.length === 0
						? "No audits yet. Assign auditors to a project or place, then ask them to start the first audit."
						: "No audits match the current filters."
				}
			/>
		</div>
	);
}

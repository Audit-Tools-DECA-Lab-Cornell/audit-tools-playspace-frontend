"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerPlaceDetailPage() {
	const params = useParams<{ placeId: string }>();
	const placeId = params.placeId;

	const historyQuery = useQuery({
		queryKey: ["playspace", "manager", "placeHistory", placeId],
		queryFn: () => playspaceApi.places.history(placeId),
		enabled: typeof placeId === "string" && placeId.length > 0
	});
	const history = historyQuery.data;

	if (historyQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (historyQuery.isError || !history) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Unable to load place history</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Try refreshing this page. If needed, return to places and open this location again.
					</p>
					<Button asChild>
						<Link href="/manager/places">Back to places</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const auditRows = history.audits.map(audit => ({
		id: audit.audit_id,
		auditCode: audit.audit_code,
		status: audit.status,
		auditorCode: audit.auditor_code,
		placeName: history.place_name,
		startedAt: audit.started_at,
		submittedAt: audit.submitted_at,
		score: audit.summary_score
	}));

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Place Activity"
				title={history.place_name}
				description="Audit history, submission recency, and score trends for this place."
				breadcrumbs={[
					{ label: "Dashboard", href: "/manager/dashboard" },
					{ label: "Places", href: "/manager/places" },
					{ label: history.place_name }
				]}
				actions={
					<Button asChild variant="outline">
						<Link href="/manager/places" className="gap-2">
							<ArrowLeftIcon className="size-4" />
							<span>Back to places</span>
						</Link>
					</Button>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<StatCard
					title="Total Audits"
					value={String(history.total_audits)}
					helper="All draft and submitted audit sessions for this place."
				/>
				<StatCard
					title="Submitted"
					value={String(history.submitted_audits)}
					helper="Completed audit sessions with final scoring."
					tone="success"
				/>
				<StatCard
					title="In Progress"
					value={String(history.in_progress_audits)}
					helper="Sessions that still need completion."
					tone="warning"
				/>
				<StatCard
					title="Mean Score"
					value={formatScoreLabel(history.average_submitted_score)}
					helper="Average across submitted audits only."
					tone="violet"
				/>
				<Card>
					<CardHeader>
						<CardTitle className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
							Latest submitted
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p className="text-sm font-medium text-foreground tabular-nums">
							{history.latest_submitted_at ? formatDateTimeLabel(history.latest_submitted_at) : "Pending"}
						</p>
						<p className="text-sm text-muted-foreground">Most recent completed submission timestamp.</p>
					</CardContent>
				</Card>
			</div>
			<AuditsTable
				rows={auditRows}
				title="Audit History"
				description="Track every audit session for this place in a filterable activity table."
				pageSize={8}
				emptyMessage="No audits have been created for this place yet."
			/>
		</div>
	);
}

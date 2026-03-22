"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

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

export default function AuditorDashboardPage() {
	const t = useTranslations("auditor.dashboard");
	const formatT = useTranslations("common.format");
	const placesQuery = useQuery({
		queryKey: ["playspace", "auditor", "assignedPlaces", "dashboardPreview"],
		queryFn: () =>
			playspaceApi.auditor.assignedPlaces({
				page: 1,
				pageSize: 5,
				sort: "place_name"
			})
	});
	const summaryQuery = useQuery({
		queryKey: ["playspace", "auditor", "dashboardSummary"],
		queryFn: () => playspaceApi.auditor.dashboardSummary()
	});
	const places = placesQuery.data?.items ?? [];

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
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.description")}
				/>
				<Card>
					<CardHeader>
						<CardTitle>{t("error.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">{t("error.description")}</p>
						<Button type="button" onClick={() => globalThis.location.reload()}>
							{t("actions.refresh")}
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
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<StatCard
					title={t("stats.assignedPlaces.title")}
					value={String(summary.total_assigned_places)}
					helper={t("stats.assignedPlaces.helper")}
				/>
				<StatCard
					title={t("stats.inProgress.title")}
					value={String(summary.in_progress_audits)}
					helper={t("stats.inProgress.helper")}
					tone="warning"
				/>
				<StatCard
					title={t("stats.submitted.title")}
					value={String(summary.submitted_audits)}
					helper={t("stats.submitted.helper")}
					tone="success"
				/>
				<StatCard
					title={t("stats.pendingPlaces.title")}
					value={String(summary.pending_places)}
					helper={t("stats.pendingPlaces.helper")}
				/>
				<StatCard
					title={t("stats.meanSubmittedScore.title")}
					value={formatScoreLabel(summary.average_submitted_score, formatT)}
					helper={t("stats.meanSubmittedScore.helper")}
					tone="violet"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("assignedPlaces.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{places.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("assignedPlaces.empty")}</p>
					) : null}
					{places.map(place => {
						const actionHref = `/auditor/execute/${encodeURIComponent(place.place_id)}`;
						const reportHref =
							place.audit_id !== null
								? `/auditor/reports/${encodeURIComponent(place.audit_id)}`
								: "/auditor/reports";
						const isResumeAction = place.audit_status === "IN_PROGRESS" || place.audit_status === "PAUSED";
						const actionLabel = isResumeAction
							? t("assignedPlaces.resumeAudit")
							: t("assignedPlaces.startAudit");

						return (
							<div
								key={place.place_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<p className="truncate font-medium">{place.place_name}</p>
									<p className="text-sm text-muted-foreground">{place.project_name}</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={getStatusBadgeVariant(place.audit_status)} className="font-medium">
										{place.audit_status
											? t(`status.${place.audit_status.toLowerCase()}`)
											: t("status.not_started")}
									</Badge>
									{place.audit_status === "SUBMITTED" ? (
										<Button asChild size="sm" variant="secondary">
											<Link href={reportHref}>{t("assignedPlaces.openReport")}</Link>
										</Button>
									) : (
										<Button asChild size="sm" variant={isResumeAction ? "outline" : "default"}>
											<Link href={actionHref}>{actionLabel}</Link>
										</Button>
									)}
								</div>
							</div>
						);
					})}
					{placesQuery.data.total_count > places.length ? (
						<div className="border-t border-border pt-4">
							<Button asChild variant="outline">
								<Link href="/auditor/places">{t("assignedPlaces.viewAll")}</Link>
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

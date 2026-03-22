"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable } from "@/components/dashboard/audits-table";
import { BackButton } from "@/components/dashboard/back-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerPlaceDetailPage() {
	const t = useTranslations("manager.placeDetail");
	const formatT = useTranslations("common.format");
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
					<CardTitle>{t("error.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("error.description")}</p>
					<BackButton href="/manager/places" label={t("actions.backToPlaces")} />
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
				eyebrow={t("header.eyebrow")}
				title={history.place_name}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
					{ label: t("breadcrumbs.places"), href: "/manager/places" },
					{ label: history.place_name }
				]}
				actions={<BackButton href="/manager/places" label={t("actions.backToPlaces")} />}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<StatCard
					title={t("stats.totalAudits.title")}
					value={String(history.total_audits)}
					helper={t("stats.totalAudits.helper")}
				/>
				<StatCard
					title={t("stats.submitted.title")}
					value={String(history.submitted_audits)}
					helper={t("stats.submitted.helper")}
					tone="success"
				/>
				<StatCard
					title={t("stats.inProgress.title")}
					value={String(history.in_progress_audits)}
					helper={t("stats.inProgress.helper")}
					tone="warning"
				/>
				<StatCard
					title={t("stats.meanScore.title")}
					value={formatScoreLabel(history.average_submitted_score, formatT)}
					helper={t("stats.meanScore.helper")}
					tone="violet"
				/>
				<StatCard
					title={t("stats.latestSubmitted.title")}
					value={history.latest_submitted_at ? formatDateTimeLabel(history.latest_submitted_at, formatT) : formatT("pending")}
					valueClassName="font-sans text-lg leading-snug md:text-xl"
					helper={t("stats.latestSubmitted.helper")}
					tone="success"
				/>
			</div>
			<AuditsTable
				rows={auditRows}
				title={t("table.title")}
				description={t("table.description")}
				pageSize={8}
				emptyMessage={t("table.emptyMessage")}
			/>
		</div>
	);
}

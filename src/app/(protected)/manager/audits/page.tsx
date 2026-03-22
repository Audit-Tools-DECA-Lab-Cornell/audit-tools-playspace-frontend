"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardListIcon, MapPinnedIcon } from "lucide-react";
import { useTranslations } from "next-intl";

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
	const t = useTranslations("manager.audits");
	const formatT = useTranslations("common.format");
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
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.description")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.audits") }
					]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">{t("missingAccount")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (auditsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.description")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.audits") }
					]}
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
				title={t("error.title")}
				description={getErrorMessage(auditsQuery.error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("error.retry")}
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
			: formatT("pending");

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
					{ label: t("breadcrumbs.audits") }
				]}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button asChild variant="outline">
							<Link href="/manager/places" className="gap-2">
								<MapPinnedIcon className="size-4" />
								<span>{t("header.actions.openPlaces")}</span>
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/manager/assignments" className="gap-2">
								<ClipboardListIcon className="size-4" />
								<span>{t("header.actions.manageAssignments")}</span>
							</Link>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title={t("stats.totalAudits.title")}
					value={String(audits.length)}
					helper={t("stats.totalAudits.helper")}
				/>
				<StatCard
					title={t("stats.submitted.title")}
					value={String(submittedAudits)}
					helper={t("stats.submitted.helper")}
					tone="success"
				/>
				<StatCard
					title={t("stats.inProgress.title")}
					value={String(inProgressAudits)}
					helper={t("stats.inProgress.helper")}
					tone="warning"
				/>
				<StatCard
					title={t("stats.meanScore.title")}
					value={meanScore}
					helper={t("stats.meanScore.helper")}
					tone="violet"
				/>
			</div>
			<AuditsTable
				rows={audits}
				title={t("table.title")}
				description={t("table.description")}
				emptyMessage={audits.length === 0 ? t("table.emptyState.noAudits") : t("table.emptyState.noMatches")}
			/>
		</div>
	);
}

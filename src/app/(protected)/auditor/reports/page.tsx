"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { formatAuditCodeReference, formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AUDITOR_REPORTS_PAGE_SIZE = 8;

function getStatusBadgeVariant(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED") {
	if (status === "SUBMITTED") return "default";
	if (status === "IN_PROGRESS" || status === "PAUSED") return "secondary";
	return "outline";
}

export default function AuditorReportsPage() {
	const t = useTranslations("auditor.reports");
	const formatT = useTranslations("common.format");
	const [currentPage, setCurrentPage] = React.useState(1);
	const auditsQuery = useQuery({
		queryKey: ["playspace", "auditor", "audits", "reports"],
		queryFn: () => playspaceApi.auditor.audits()
	});
	const audits = auditsQuery.data ?? [];
	const submittedAudits = audits.filter(audit => audit.status === "SUBMITTED");
	const pageCount = Math.max(1, Math.ceil(audits.length / AUDITOR_REPORTS_PAGE_SIZE));
	const paginatedAudits = audits.slice(
		(currentPage - 1) * AUDITOR_REPORTS_PAGE_SIZE,
		currentPage * AUDITOR_REPORTS_PAGE_SIZE
	);

	React.useEffect(() => {
		if (currentPage > pageCount) {
			setCurrentPage(pageCount);
		}
	}, [currentPage, pageCount]);

	if (auditsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (auditsQuery.isError || !auditsQuery.data) {
		return (
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
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/auditor/dashboard" },
					{ label: t("breadcrumbs.reports") }
				]}
			/>
			<Card>
				<CardHeader>
					<CardTitle>{t("list.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{audits.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("list.empty")}</p>
					) : null}
					{paginatedAudits.map(audit => {
						const detailHref =
							audit.status === "SUBMITTED"
								? `/auditor/reports/${encodeURIComponent(audit.audit_id)}`
								: `/auditor/execute/${encodeURIComponent(audit.place_id)}`;
						const detailLabel = audit.status === "SUBMITTED" ? t("list.openReport") : t("list.resumeAudit");
						const submissionLabel = audit.submitted_at
							? t("list.submittedAt", { value: formatDateTimeLabel(audit.submitted_at, formatT) })
							: t("list.draftNotSubmitted");
						return (
							<div
								key={audit.audit_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="min-w-0 space-y-1">
									<p className="font-medium text-foreground">{audit.place_name}</p>
									<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
										<span>{audit.project_name}</span>
										<code
											title={audit.audit_code}
											className="rounded-md bg-muted/65 px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground/80">
											{formatAuditCodeReference(audit.audit_code)}
										</code>
									</div>
									<p className="text-xs text-muted-foreground">
										{t("list.startedAt", { value: formatDateTimeLabel(audit.started_at, formatT) })} · {submissionLabel}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={getStatusBadgeVariant(audit.status)} className="font-medium">
										{t(`status.${audit.status.toLowerCase()}`)}
									</Badge>
									<Badge variant="outline" className="font-mono tabular-nums">
										{formatScoreLabel(audit.summary_score, formatT)}
									</Badge>
									<Button
										asChild
										size="sm"
										variant={audit.status === "SUBMITTED" ? "secondary" : "outline"}>
										<Link href={detailHref}>{detailLabel}</Link>
									</Button>
								</div>
							</div>
						);
					})}
					<PaginationControls
						currentPage={currentPage}
						pageCount={pageCount}
						totalItems={audits.length}
						pageSize={AUDITOR_REPORTS_PAGE_SIZE}
						itemLabel={t("pagination.itemLabel")}
						onPageChange={setCurrentPage}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base text-foreground/70">{t("summary.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="font-mono text-[2rem] font-semibold leading-none tabular-nums">
						{submittedAudits.length}
					</p>
					<p className="text-sm text-muted-foreground">{t("summary.description")}</p>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
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
					<CardTitle>Unable to load reports</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Try refreshing the page. If this continues, verify your sign-in context.
					</p>
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Refresh
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Auditor Workspace"
				title="Reports"
				description="Review submitted and in-progress audit sessions."
			/>
			<Card>
				<CardHeader>
					<CardTitle>Audit sessions</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{audits.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Submitted and in-progress sessions will appear here after you start an assigned audit.
						</p>
					) : null}
					{paginatedAudits.map(audit => {
						const detailHref =
							audit.status === "SUBMITTED"
								? `/auditor/reports/${encodeURIComponent(audit.audit_id)}`
								: `/auditor/execute/${encodeURIComponent(audit.place_id)}`;
						const detailLabel =
							audit.status === "SUBMITTED"
								? "Open report"
								: audit.status === "PAUSED"
									? "Resume audit"
									: "Continue audit";
						const submissionLabel = audit.submitted_at
							? `Submitted ${formatDateTimeLabel(audit.submitted_at)}`
							: "Draft not submitted yet";
						return (
							<div
								key={audit.audit_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="min-w-0 space-y-1">
									<p className="font-medium text-foreground">{audit.place_name}</p>
									<p className="text-sm text-muted-foreground">
										{audit.project_name} ·{" "}
										<span className="font-mono uppercase tracking-[0.08em]">
											{audit.audit_code}
										</span>
									</p>
									<p className="text-xs text-muted-foreground">
										Started {formatDateTimeLabel(audit.started_at)} · {submissionLabel}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant={getStatusBadgeVariant(audit.status)}
										className="font-medium tracking-[0.14em] uppercase">
										{audit.status.toLowerCase().replaceAll("_", " ")}
									</Badge>
									<Badge variant="outline" className="font-mono tabular-nums">
										{formatScoreLabel(audit.summary_score)}
									</Badge>
									<Button asChild size="sm" variant="secondary">
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
						itemLabel="audit sessions"
						onPageChange={setCurrentPage}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm tracking-[0.16em] text-muted-foreground uppercase">
						Submitted report count
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="font-mono text-[2rem] font-semibold leading-none tabular-nums">
						{submittedAudits.length}
					</p>
					<p className="text-sm text-muted-foreground">
						Sessions that have been submitted and are ready for review.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

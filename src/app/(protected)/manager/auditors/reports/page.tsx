"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ManagerAuditorsReportsPage() {
	const t = useTranslations("manager.auditors.reports");
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const reportsQuery = useQuery({
		queryKey: ["playspace", "manager", "auditors", "reports", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			// For now, we'll fetch audits with status SUBMITTED
			const audits = await playspaceApi.accounts.audits(accountId, {
				statuses: ["SUBMITTED"],
				page: 1,
				pageSize: 100,
			});
			return audits;
		},
		enabled: accountId !== null,
	});

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audit Reports"
					description="View submitted audit reports from your auditors."
					breadcrumbs={[
						{ label: "Dashboard", href: "/manager/dashboard" },
						{ label: "Auditors", href: "/manager/auditors" },
						{ label: "Reports" },
					]}
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

	if (reportsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audit Reports"
					description="View submitted audit reports from your auditors."
					breadcrumbs={[
						{ label: "Dashboard", href: "/manager/dashboard" },
						{ label: "Auditors", href: "/manager/auditors" },
						{ label: "Reports" },
					]}
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, idx) => (
						<div
							key={`stat-skeleton-${idx}`}
							className="h-32 animate-pulse rounded-card border border-border bg-card"
						/>
					))}
				</div>
				<div className="h-[420px] animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (reportsQuery.isError) {
		return (
			<EmptyState
				title="Reports unavailable"
				description="Unable to load audit reports. Refresh and try again."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const data = reportsQuery.data;
	const rows: AuditActivityRow[] = data.items.map((audit) => ({
		id: audit.audit_id,
		auditCode: audit.audit_code,
		status: audit.status,
		auditorCode: audit.auditor_code,
		placeName: audit.place_name,
		placeId: audit.place_id,
		projectName: audit.project_name,
		projectId: audit.project_id,
		accountName: null,
		startedAt: audit.started_at,
		submittedAt: audit.submitted_at,
		score: audit.summary_score,
	}));

	const totalSubmitted = data.summary.submitted_audits;
	const averageScore = data.summary.average_score ?? 0;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Audit Reports"
				description="View submitted audit reports from your auditors."
				breadcrumbs={[
					{ label: "Dashboard", href: "/manager/dashboard" },
					{ label: "Auditors", href: "/manager/auditors" },
					{ label: "Reports" },
				]}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Reports"
					value={String(totalSubmitted)}
					helper="Submitted audits ready for review."
					tone="info"
				/>
				<StatCard
					title="Average Score"
					value={averageScore.toFixed(1)}
					helper="Mean score across all submitted audits."
					tone="success"
				/>
				<StatCard
					title="Auditors"
					value={String(new Set(data.items.map((a) => a.auditor_code)).size)}
					helper="Unique auditors with submitted reports."
					tone="warning"
				/>
				<StatCard
					title="Places"
					value={String(new Set(data.items.map((a) => a.place_id)).size)}
					helper="Unique places with submitted audits."
					tone="violet"
				/>
			</div>
			<AuditsTable
				rows={rows}
				title="Submitted Audit Reports"
				description="Browse completed audit reports. Click on a row to view details."
				pageSize={10}
				emptyMessage="No submitted audit reports yet."
				onRowClick={(row) => {
					// For now, navigate to a placeholder detail page
					window.location.href = `/manager/audits/${row.id}/report`;
				}}
				getRowActions={(row) => [
					{
						label: "View Report",
						onSelect: () => {
							window.location.href = `/manager/audits/${row.id}/report`;
						},
						icon: FileTextIcon,
					},
				]}
			/>
		</div>
	);
}

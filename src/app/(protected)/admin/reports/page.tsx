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

export default function AdminReportsPage() {
	const t = useTranslations("admin.reports");
	const session = useAuthSession();

	const reportsQuery = useQuery({
		queryKey: ["playspace", "admin", "reports"],
		queryFn: async () => {
			// Fetch all submitted audits for admin
			const audits = await playspaceApi.admin.audits({
				statuses: ["SUBMITTED"],
				page: 1,
				pageSize: 100,
			});
			return audits;
		},
	});

	if (reportsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Admin Workspace"
					title="Audit Reports"
					description="View all submitted audit reports across the platform."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
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
		accountName: audit.account_name,
		startedAt: audit.started_at,
		submittedAt: audit.submitted_at,
		score: audit.summary_score,
	}));

	const totalSubmitted = data.summary?.submitted_audits ?? data.items.length;
	const averageScore = data.summary?.average_score ?? 0;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Admin Workspace"
				title="Audit Reports"
				description="View all submitted audit reports across the platform."
				breadcrumbs={[
					{ label: "Dashboard", href: "/admin/dashboard" },
					{ label: "Reports" },
				]}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Reports"
					value={String(totalSubmitted)}
					helper="Submitted audits across all accounts."
					tone="info"
				/>
				<StatCard
					title="Average Score"
					value={averageScore.toFixed(1)}
					helper="Mean score across all submitted audits."
					tone="success"
				/>
				<StatCard
					title="Accounts"
					value={String(new Set(data.items.map((a) => a.account_id)).size)}
					helper="Unique accounts with submitted reports."
					tone="warning"
				/>
				<StatCard
					title="Auditors"
					value={String(new Set(data.items.map((a) => a.auditor_code)).size)}
					helper="Unique auditors with submitted reports."
					tone="violet"
				/>
			</div>
			<AuditsTable
				rows={rows}
				title="All Submitted Audit Reports"
				description="Browse completed audit reports from all accounts. Click on a row to view details."
				pageSize={10}
				emptyMessage="No submitted audit reports yet."
				onRowClick={(row) => {
					// For now, navigate to a placeholder detail page
					window.location.href = `/admin/audits/${row.id}/report`;
				}}
				getRowActions={(row) => [
					{
						label: "View Report",
						onSelect: () => {
							window.location.href = `/admin/audits/${row.id}/report`;
						},
						icon: FileTextIcon,
					},
				]}
			/>
		</div>
	);
}

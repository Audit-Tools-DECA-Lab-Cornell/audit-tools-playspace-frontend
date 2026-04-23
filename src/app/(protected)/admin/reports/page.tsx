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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function AdminReportsPage() {
	const t = useTranslations("admin.reports");
	const session = useAuthSession();
	const [selectedAuditId, setSelectedAuditId] = React.useState<string | null>(null);

	const auditDetailsQuery = useQuery({
		queryKey: ["playspace", "audit", selectedAuditId],
		queryFn: async () => {
			if (!selectedAuditId) throw new Error("No audit selected");
			return playspaceApi.auditor.getAudit(selectedAuditId);
		},
		enabled: !!selectedAuditId,
	});

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
					setSelectedAuditId(row.id);
				}}
				getRowActions={(row) => [
					{
						label: "View Report",
						onSelect: () => setSelectedAuditId(row.id),
						icon: FileTextIcon,
					},
				]}
			/>
			<Sheet open={!!selectedAuditId} onOpenChange={(open) => !open && setSelectedAuditId(null)}>
				<SheetContent side="right" className="w-full sm:max-w-3xl">
					{auditDetailsQuery.isLoading && <div className="p-8 text-center">Loading audit details...</div>}
					{auditDetailsQuery.isError && <div className="p-8 text-center text-destructive">Error loading audit details.</div>}
					{auditDetailsQuery.data && (
						<div className="space-y-6">
							<SheetHeader>
								<SheetTitle>Audit Report: {auditDetailsQuery.data.audit_code}</SheetTitle>
								<SheetDescription>
									{auditDetailsQuery.data.place_name} • {auditDetailsQuery.data.project_name}
								</SheetDescription>
							</SheetHeader>
							<div className="grid gap-4">
								<div>
									<h4 className="font-medium">Auditor</h4>
									<p className="text-sm">{auditDetailsQuery.data.auditor_code}</p>
								</div>
								<div>
									<h4 className="font-medium">Status</h4>
									<Badge variant={auditDetailsQuery.data.status === "SUBMITTED" ? "default" : "secondary"}>
										{auditDetailsQuery.data.status}
									</Badge>
								</div>
								<div>
									<h4 className="font-medium">Scores</h4>
									<pre className="text-xs bg-muted p-3 rounded overflow-auto">
										{JSON.stringify(auditDetailsQuery.data.scores, null, 2)}
									</pre>
								</div>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}

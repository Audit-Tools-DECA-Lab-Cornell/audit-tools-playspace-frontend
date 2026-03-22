"use client";

import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminAuditsPage() {
	const auditsQuery = useQuery({
		queryKey: ["playspace", "admin", "audits"],
		queryFn: () => playspaceApi.admin.audits()
	});

	if (auditsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (auditsQuery.isError || !auditsQuery.data) {
		return (
			<EmptyState
				title="Audits unavailable"
				description="Refresh this page to retry. If the issue continues, return to the administrator dashboard and reopen audits."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="Audits"
				description="Global audit activity feed with account/project/place lineage."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Audits" }]}
			/>
			<AuditsTable
				rows={auditsQuery.data.map(audit => ({
					id: audit.audit_id,
					auditCode: audit.audit_code,
					status: audit.status,
					auditorCode: audit.auditor_code,
					accountName: audit.account_name,
					projectName: audit.project_name,
					placeName: audit.place_name,
					startedAt: audit.started_at,
					submittedAt: audit.submitted_at,
					score: audit.summary_score
				}))}
				title="Audit Activity"
				description="Monitor platform-wide audit throughput, lineage, and delivery status."
				emptyMessage="No audits match the current filters."
			/>
		</div>
	);
}

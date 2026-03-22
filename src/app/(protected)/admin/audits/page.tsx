"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminAuditsPage() {
	const t = useTranslations("admin.audits");
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
				title={t("error.title")}
				description={t("error.description")}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("error.retry")}
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/admin/dashboard" },
					{ label: t("breadcrumbs.audits") }
				]}
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
				title={t("table.title")}
				description={t("table.description")}
				emptyMessage={t("table.emptyMessage")}
			/>
		</div>
	);
}

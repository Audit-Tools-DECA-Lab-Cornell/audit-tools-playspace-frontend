"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { playspaceApi, type AdminAuditorRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminAuditorsPage() {
	const t = useTranslations("admin.auditors");
	const formatT = useTranslations("common.format");
	const auditorsQuery = useQuery({
		queryKey: ["playspace", "admin", "auditors"],
		queryFn: () => playspaceApi.admin.auditors()
	});

	if (auditorsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (auditorsQuery.isError || !auditorsQuery.data) {
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

	const columns: ColumnDef<AdminAuditorRow>[] = [
		{
			id: "auditor",
			accessorFn: row => `${row.auditor_code} ${row.email_masked ?? ""}`,
			header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.auditor")} />,
			cell: ({ row }) => (
				<div className="min-w-[220px] space-y-1">
					<Badge variant="outline" className="font-mono text-primary uppercase tracking-[0.14em]">
						{row.original.auditor_code}
					</Badge>
					<p className="text-sm text-muted-foreground">
						{row.original.email_masked ?? t("table.emailHidden")}
					</p>
				</div>
			),
			enableHiding: false
		},
		{
			accessorKey: "assignments_count",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.assignments")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.assignments_count}</span>
			)
		},
		{
			accessorKey: "completed_audits",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.completed")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.completed_audits}</span>
			)
		},
		{
			accessorKey: "last_active_at",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.lastActive")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatDateTimeLabel(row.original.last_active_at, formatT)}
				</span>
			)
		}
	];

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/admin/dashboard" },
					{ label: t("breadcrumbs.auditors") }
				]}
			/>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={auditorsQuery.data}
				searchColumnId="auditor"
				searchPlaceholder={t("table.searchPlaceholder")}
				emptyMessage={t("table.emptyMessage")}
				initialSorting={[{ id: "last_active_at", desc: true }]}
			/>
		</div>
	);
}

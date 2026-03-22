"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { playspaceApi, type AdminAccountRow } from "@/lib/api/playspace";
import { DataTable, getMultiValueFilterFn } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminAccountsPage() {
	const t = useTranslations("admin.accounts");
	const formatT = useTranslations("common.format");
	const accountsQuery = useQuery({
		queryKey: ["playspace", "admin", "accounts"],
		queryFn: () => playspaceApi.admin.accounts()
	});

	if (accountsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (accountsQuery.isError || !accountsQuery.data) {
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

	const columns: ColumnDef<AdminAccountRow>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.account")} />,
			cell: ({ row }) => (
				<div className="min-w-[220px] space-y-1">
					<p className="font-medium text-foreground">{row.original.name}</p>
					<p className="text-sm text-muted-foreground">
						{row.original.email_masked ?? t("table.emailHidden")}
					</p>
				</div>
			)
		},
		{
			accessorKey: "account_type",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.type")} />,
			filterFn: getMultiValueFilterFn<AdminAccountRow>(),
			cell: ({ row }) => (
				<Badge variant="secondary" className="font-medium tracking-[0.14em] uppercase">
					{row.original.account_type}
				</Badge>
			)
		},
		{
			accessorKey: "projects_count",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.projects")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.projects_count}</span>
			)
		},
		{
			accessorKey: "places_count",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.places")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.places_count}</span>
			)
		},
		{
			accessorKey: "auditors_count",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.auditors")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.auditors_count}</span>
			)
		},
		{
			accessorKey: "created_at",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.created")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatDateTimeLabel(row.original.created_at, formatT)}
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
					{ label: t("breadcrumbs.accounts") }
				]}
			/>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={accountsQuery.data}
				searchColumnId="name"
				searchPlaceholder={t("table.searchPlaceholder")}
				filterConfigs={[
					{
						columnId: "account_type",
						title: t("table.columns.type"),
						options: Array.from(new Set(accountsQuery.data.map(account => account.account_type))).map(
							accountType => ({
								label: accountType,
								value: accountType
							})
						)
					}
				]}
				emptyMessage={t("table.emptyMessage")}
				initialSorting={[{ id: "created_at", desc: true }]}
			/>
		</div>
	);
}

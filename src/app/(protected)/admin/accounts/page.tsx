"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from 'next-intl';

import { playspaceApi, type AdminAccountRow } from "@/lib/api/playspace";
import { DataTable, getMultiValueFilterFn } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminAccountsPage() {
	const t = useTranslations('admin.accounts');
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
				title="Accounts unavailable"
				description="Refresh this page to retry. If the issue continues, reopen the administrator dashboard and try again."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const columns: ColumnDef<AdminAccountRow>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
			cell: ({ row }) => (
				<div className="min-w-[220px] space-y-1">
					<p className="font-medium text-foreground">{row.original.name}</p>
					<p className="text-sm text-muted-foreground">{row.original.email_masked ?? "Email hidden"}</p>
				</div>
			)
		},
		{
			accessorKey: "account_type",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
			filterFn: getMultiValueFilterFn<AdminAccountRow>(),
			cell: ({ row }) => (
				<Badge variant="secondary" className="font-medium tracking-[0.14em] uppercase">
					{row.original.account_type}
				</Badge>
			)
		},
		{
			accessorKey: "projects_count",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Projects" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.projects_count}</span>
			)
		},
		{
			accessorKey: "places_count",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Places" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.places_count}</span>
			)
		},
		{
			accessorKey: "auditors_count",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Auditors" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.auditors_count}</span>
			)
		},
		{
			accessorKey: "created_at",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatDateTimeLabel(row.original.created_at)}
				</span>
			)
		}
	];

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="Accounts"
				description="Global account registry with privacy-masked emails and entity counts."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Accounts" }]}
			/>
			<DataTable
				title="Account Registry"
				description="Search and compare account scale using privacy-safe identifiers and counts."
				columns={columns}
				data={accountsQuery.data}
				searchColumnId="name"
				searchPlaceholder="Search accounts..."
				filterConfigs={[
					{
						columnId: "account_type",
						title: "Type",
						options: Array.from(new Set(accountsQuery.data.map(account => account.account_type))).map(
							accountType => ({
								label: accountType,
								value: accountType
							})
						)
					}
				]}
				emptyMessage="No accounts match the current filters."
				initialSorting={[{ id: "created_at", desc: true }]}
			/>
		</div>
	);
}

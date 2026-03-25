"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AdminAuditorRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminAuditorsPage() {
	const t = useTranslations("admin.auditors");
	const formatT = useTranslations("common.format");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "last_active_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "auditor_code");
	const sortParam = toBackendSortParam(sorting);

	React.useEffect(() => {
		setPagination(currentValue => {
			return currentValue.pageIndex === 0
				? currentValue
				: {
						...currentValue,
						pageIndex: 0
					};
		});
	}, [searchValue, sortParam]);

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "admin", "auditors", pagination.pageIndex, pagination.pageSize, searchValue, sortParam],
		queryFn: () =>
			playspaceApi.admin.auditors({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam
			}),
		placeholderData: preservePreviousData
	});

	React.useEffect(() => {
		if (!auditorsQuery.data) {
			return;
		}

		const maxPageIndex = Math.max(auditorsQuery.data.total_pages - 1, 0);
		if (pagination.pageIndex <= maxPageIndex) {
			return;
		}

		setPagination(currentValue => ({
			...currentValue,
			pageIndex: maxPageIndex
		}));
	}, [auditorsQuery.data, pagination.pageIndex]);

	const isInitialLoading = auditorsQuery.isLoading && !auditorsQuery.data;

	const columns = React.useMemo<ColumnDef<AdminAuditorRow>[]>(
		() => [
			{
				id: "auditor_code",
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
		],
		[formatT, t]
	);

	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if ((auditorsQuery.isError && !auditorsQuery.data) || !auditorsQuery.data) {
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
					{ label: t("breadcrumbs.auditors") }
				]}
			/>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={auditorsQuery.data.items}
				searchColumnId="auditor_code"
				searchPlaceholder={t("table.searchPlaceholder")}
				emptyMessage={t("table.emptyMessage")}
				initialSorting={[{ id: "last_active_at", desc: true }]}
				sortingState={sorting}
				onSortingStateChange={setSorting}
				columnFiltersState={columnFilters}
				onColumnFiltersStateChange={setColumnFilters}
				paginationState={pagination}
				onPaginationStateChange={setPagination}
				manualFiltering
				manualSorting
				manualPagination
				rowCount={auditorsQuery.data.total_count}
				pageCount={auditorsQuery.data.total_pages}
				isFetching={auditorsQuery.isFetching}
			/>
		</div>
	);
}

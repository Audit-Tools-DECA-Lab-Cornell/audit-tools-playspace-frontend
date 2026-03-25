"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AdminProjectRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { formatProjectDateRange, formatScoreLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";

export default function AdminProjectsPage() {
	const t = useTranslations("admin.projects");
	const formatT = useTranslations("common.format");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "date_range", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "name");
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

	const projectsQuery = useQuery({
		queryKey: ["playspace", "admin", "projects", pagination.pageIndex, pagination.pageSize, searchValue, sortParam],
		queryFn: () =>
			playspaceApi.admin.projects({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam
			}),
		placeholderData: preservePreviousData
	});

	React.useEffect(() => {
		if (!projectsQuery.data) {
			return;
		}

		const maxPageIndex = Math.max(projectsQuery.data.total_pages - 1, 0);
		if (pagination.pageIndex <= maxPageIndex) {
			return;
		}

		setPagination(currentValue => ({
			...currentValue,
			pageIndex: maxPageIndex
		}));
	}, [pagination.pageIndex, projectsQuery.data]);

	const isInitialLoading = projectsQuery.isLoading && !projectsQuery.data;

	const columns = React.useMemo<ColumnDef<AdminProjectRow>[]>(
		() => [
			{
				id: "name",
				accessorFn: row => `${row.name} ${row.account_name}`,
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.project")} />,
				cell: ({ row }) => (
					<div className="min-w-[240px] space-y-1">
						<p className="font-medium text-foreground">{row.original.name}</p>
						<p className="text-sm text-muted-foreground">{row.original.account_name}</p>
					</div>
				),
				enableHiding: false
			},
			{
				id: "date_range",
				accessorFn: row => `${row.start_date ?? ""}|${row.end_date ?? ""}`,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("table.columns.dates")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatProjectDateRange(row.original, formatT)}
					</span>
				),
				sortingFn: (leftRow, rightRow) => {
					const leftValue = leftRow.original.start_date ?? leftRow.original.end_date ?? "";
					const rightValue = rightRow.original.start_date ?? rightRow.original.end_date ?? "";
					return leftValue.localeCompare(rightValue);
				}
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
				accessorKey: "audits_completed",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("table.columns.completed")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right font-mono tabular-nums">{row.original.audits_completed}</span>
				)
			},
			{
				accessorKey: "average_score",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("table.columns.meanScore")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.average_score, formatT)}
					</span>
				)
			}
		],
		[formatT, t]
	);
	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if ((projectsQuery.isError && !projectsQuery.data) || !projectsQuery.data) {
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
					{ label: t("breadcrumbs.projects") }
				]}
			/>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={projectsQuery.data.items}
				searchColumnId="name"
				searchPlaceholder={t("table.searchPlaceholder")}
				emptyMessage={t("table.emptyMessage")}
				initialSorting={[{ id: "date_range", desc: true }]}
				sortingState={sorting}
				onSortingStateChange={setSorting}
				columnFiltersState={columnFilters}
				onColumnFiltersStateChange={setColumnFilters}
				paginationState={pagination}
				onPaginationStateChange={setPagination}
				manualFiltering
				manualSorting
				manualPagination
				rowCount={projectsQuery.data.total_count}
				pageCount={projectsQuery.data.total_pages}
				isFetching={projectsQuery.isFetching}
			/>
		</div>
	);
}

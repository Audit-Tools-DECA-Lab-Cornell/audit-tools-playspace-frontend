"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AdminPlaceRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getTextColumnFilterValue, toBackendSortParam } from "@/components/dashboard/server-table-utils";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";

function formatLocation(
	city: string | null,
	province: string | null,
	country: string | null,
	locationPendingLabel: string
): string {
	const parts = [city, province, country].filter((part): part is string => Boolean(part && part.trim().length > 0));
	return parts.length > 0 ? parts.join(", ") : locationPendingLabel;
}

export default function AdminPlacesPage() {
	const t = useTranslations("admin.places");
	const formatT = useTranslations("common.format");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "last_audited_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "place");
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

	const placesQuery = useQuery({
		queryKey: ["playspace", "admin", "places", pagination.pageIndex, pagination.pageSize, searchValue, sortParam],
		queryFn: () =>
			playspaceApi.admin.places({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam
			})
	});

	React.useEffect(() => {
		if (!placesQuery.data) {
			return;
		}

		const maxPageIndex = Math.max(placesQuery.data.total_pages - 1, 0);
		if (pagination.pageIndex <= maxPageIndex) {
			return;
		}

		setPagination(currentValue => ({
			...currentValue,
			pageIndex: maxPageIndex
		}));
	}, [pagination.pageIndex, placesQuery.data]);

	if (placesQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (placesQuery.isError || !placesQuery.data) {
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

	const columns: ColumnDef<AdminPlaceRow>[] = [
		{
			id: "place",
			accessorFn: row =>
				`${row.name} ${row.project_name} ${row.account_name} ${formatLocation(row.city, row.province, row.country, formatT("locationPending"))}`,
			header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.place")} />,
			cell: ({ row }) => (
				<div className="min-w-[260px] space-y-1">
					<p className="font-medium text-foreground">{row.original.name}</p>
					<p className="text-sm text-muted-foreground">
						{row.original.account_name} · {row.original.project_name}
					</p>
					<p className="text-sm text-muted-foreground">
						{formatLocation(
							row.original.city,
							row.original.province,
							row.original.country,
							formatT("locationPending")
						)}
					</p>
				</div>
			),
			enableHiding: false
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
		},
		{
			accessorKey: "last_audited_at",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("table.columns.latestAudit")} align="end" />
			),
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatDateTimeLabel(row.original.last_audited_at, formatT)}
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
					{ label: t("breadcrumbs.places") }
				]}
			/>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={placesQuery.data.items}
				searchColumnId="place"
				searchPlaceholder={t("table.searchPlaceholder")}
				emptyMessage={t("table.emptyMessage")}
				initialSorting={[{ id: "last_audited_at", desc: true }]}
				sortingState={sorting}
				onSortingStateChange={setSorting}
				columnFiltersState={columnFilters}
				onColumnFiltersStateChange={setColumnFilters}
				paginationState={pagination}
				onPaginationStateChange={setPagination}
				manualFiltering
				manualSorting
				manualPagination
				rowCount={placesQuery.data.total_count}
				pageCount={placesQuery.data.total_pages}
			/>
		</div>
	);
}

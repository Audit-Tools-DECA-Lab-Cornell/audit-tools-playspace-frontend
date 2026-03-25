"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AuditorPlace } from "@/lib/api/playspace";
import { DataTable, getMultiValueFilterFn } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EntityRowActions } from "@/components/dashboard/entity-row-actions";
import {
	getMultiValueColumnFilter,
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AUDITOR_PLACES_PAGE_SIZE = 8;

function getStatusBadgeVariant(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | null) {
	if (status === "SUBMITTED") return "default";
	if (status === "IN_PROGRESS" || status === "PAUSED") return "secondary";
	return "outline";
}

function formatLocation(
	city: string | null,
	province: string | null,
	country: string | null,
	pendingLabel: string
): string {
	const parts = [city, province, country].filter((part): part is string => Boolean(part && part.trim().length > 0));
	if (parts.length === 0) return pendingLabel;
	return parts.join(", ");
}

export default function AuditorPlacesPage() {
	const t = useTranslations("auditor.places");
	const formatT = useTranslations("common.format");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "place_name", desc: false }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: AUDITOR_PLACES_PAGE_SIZE
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "place_name");
	const selectedStatuses = getMultiValueColumnFilter(columnFilters, "audit_status").filter(
		(value): value is "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | "not_started" =>
			value === "IN_PROGRESS" || value === "PAUSED" || value === "SUBMITTED" || value === "not_started"
	);
	const selectedStatusesKey = selectedStatuses.join("|");
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
	}, [searchValue, selectedStatusesKey, sortParam]);
	const placesQuery = useQuery({
		queryKey: [
			"playspace",
			"auditor",
			"assignedPlaces",
			"placesPage",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedStatuses
		],
		queryFn: () =>
			playspaceApi.auditor.assignedPlaces({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				statuses: selectedStatuses
			}),
		placeholderData: preservePreviousData
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

	const isInitialLoading = placesQuery.isLoading && !placesQuery.data;

	const columns = React.useMemo<ColumnDef<AuditorPlace>[]>(
		() => [
			{
				id: "place_name",
				accessorFn: row =>
					`${row.place_name} ${row.project_name} ${formatLocation(row.city, row.province, row.country, t("list.locationPending"))}`,
				header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
				cell: ({ row }) => (
					<div className="min-w-[260px] space-y-1">
						<p className="font-medium text-foreground">{row.original.place_name}</p>
						<p className="text-sm text-muted-foreground">{row.original.project_name}</p>
						<p className="text-xs text-muted-foreground">
							{formatLocation(
								row.original.city,
								row.original.province,
								row.original.country,
								t("list.locationPending")
							)}
						</p>
					</div>
				),
				enableHiding: false
			},
			{
				id: "audit_status",
				accessorFn: row => row.audit_status ?? "not_started",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
				filterFn: getMultiValueFilterFn<AuditorPlace>(),
				cell: ({ row }) => (
					<Badge
						variant={getStatusBadgeVariant(row.original.audit_status)}
						className="font-medium text-foreground">
						{row.original.audit_status
							? t(`status.${row.original.audit_status.toLowerCase()}`)
							: t("status.not_started")}
					</Badge>
				)
			},
			{
				id: "started_at",
				accessorFn: row => row.started_at ?? "",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Started" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.started_at, formatT)}
					</span>
				)
			},
			{
				id: "summary_score",
				accessorFn: row => row.summary_score ?? null,
				header: ({ column }) => <DataTableColumnHeader column={column} title="Score" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.summary_score, formatT)}
					</span>
				)
			},
			{
				id: "actions",
				enableSorting: false,
				enableHiding: false,
				cell: ({ row }) => {
					const executeHref = `/auditor/execute/${encodeURIComponent(row.original.place_id)}?projectId=${encodeURIComponent(row.original.project_id)}`;
					const reportHref =
						row.original.audit_status === "SUBMITTED" && row.original.audit_id
							? `/auditor/reports/${encodeURIComponent(row.original.audit_id)}`
							: null;
					const isResumeAction =
						row.original.audit_status === "IN_PROGRESS" || row.original.audit_status === "PAUSED";

					return (
						<EntityRowActions
							actions={[
								{
									label: isResumeAction ? t("list.resumeAudit") : t("list.startAudit"),
									href: executeHref
								},
								...(reportHref
									? [
											{
												label: t("list.openReport"),
												href: reportHref
											}
										]
									: [])
							]}
						/>
					);
				}
			}
		],
		[formatT, t]
	);

	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if ((placesQuery.isError && !placesQuery.data) || !placesQuery.data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("error.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("error.description")}</p>
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.refresh")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/auditor/dashboard" },
					{ label: t("breadcrumbs.places") }
				]}
			/>
			<DataTable
				title={t("list.title")}
				description={t("header.description")}
				columns={columns}
				data={placesQuery.data.items}
				searchColumnId="place_name"
				searchPlaceholder="Search assigned places..."
				filterConfigs={[
					{
						columnId: "audit_status",
						title: "Status",
						options: [
							{ label: t("status.not_started"), value: "not_started" },
							{ label: t("status.in_progress"), value: "IN_PROGRESS" },
							{ label: t("status.paused"), value: "PAUSED" },
							{ label: t("status.submitted"), value: "SUBMITTED" }
						]
					}
				]}
				emptyMessage={t("list.empty")}
				initialSorting={[{ id: "place_name", desc: false }]}
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
				isFetching={placesQuery.isFetching}
			/>
		</div>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
	getMultiValueColumnFilter,
	preservePreviousData,
	getTextColumnFilterValue,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { Button } from "@/components/ui/button";

export default function AdminAuditsPage() {
	const t = useTranslations("admin.audits");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "submitted_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "audit_code");
	const selectedStatuses = getMultiValueColumnFilter(columnFilters, "status").filter(
		(value): value is "IN_PROGRESS" | "PAUSED" | "SUBMITTED" =>
			value === "IN_PROGRESS" || value === "PAUSED" || value === "SUBMITTED"
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

	const auditsQuery = useQuery({
		queryKey: [
			"playspace",
			"admin",
			"audits",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedStatuses
		],
		queryFn: () =>
			playspaceApi.admin.audits({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				statuses: selectedStatuses
			}),
		placeholderData: preservePreviousData
	});

	React.useEffect(() => {
		if (!auditsQuery.data) {
			return;
		}

		const maxPageIndex = Math.max(auditsQuery.data.total_pages - 1, 0);
		if (pagination.pageIndex <= maxPageIndex) {
			return;
		}

		setPagination(currentValue => ({
			...currentValue,
			pageIndex: maxPageIndex
		}));
	}, [auditsQuery.data, pagination.pageIndex]);

	const isInitialLoading = auditsQuery.isLoading && !auditsQuery.data;

	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if ((auditsQuery.isError && !auditsQuery.data) || !auditsQuery.data) {
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
				rows={auditsQuery.data.items.map(audit => ({
					id: audit.audit_id,
					auditCode: audit.audit_code,
					status: audit.status,
					auditorCode: audit.auditor_code,
					accountName: audit.account_name,
					projectName: audit.project_name,
					projectId: audit.project_id,
					placeName: audit.place_name,
					placeId: audit.place_id,
					startedAt: audit.started_at,
					submittedAt: audit.submitted_at,
					score: audit.summary_score
				}))}
				title={t("table.title")}
				description={t("table.description")}
				emptyMessage={t("table.emptyMessage")}
				sortingState={sorting}
				onSortingStateChange={setSorting}
				columnFiltersState={columnFilters}
				onColumnFiltersStateChange={setColumnFilters}
				paginationState={pagination}
				onPaginationStateChange={setPagination}
				manualFiltering
				manualSorting
				manualPagination
				rowCount={auditsQuery.data.total_count}
				pageCount={auditsQuery.data.total_pages}
				isFetching={auditsQuery.isFetching}
			/>
		</div>
	);
}

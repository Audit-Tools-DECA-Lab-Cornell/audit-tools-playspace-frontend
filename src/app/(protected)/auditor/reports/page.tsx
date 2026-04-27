"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
	getMultiValueColumnFilter,
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AUDITOR_REPORTS_PAGE_SIZE = 8;

export default function AuditorReportsPage() {
	const t = useTranslations("auditor.reports");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "started_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: AUDITOR_REPORTS_PAGE_SIZE
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
			"auditor",
			"audits",
			"reports",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedStatuses
		],
		queryFn: () =>
			playspaceApi.auditor.audits({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				statuses: selectedStatuses.map(status => status.toLowerCase() as "submitted" | "in_progress" | "paused")
			}),
		placeholderData: preservePreviousData
	});
	const summaryQuery = useQuery({
		queryKey: ["playspace", "auditor", "dashboardSummary", "reportsPage"],
		queryFn: () => playspaceApi.auditor.dashboardSummary(),
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

	const isInitialLoading =
		(auditsQuery.isLoading && !auditsQuery.data) || (summaryQuery.isLoading && !summaryQuery.data);

	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (
		(auditsQuery.isError && !auditsQuery.data) ||
		(summaryQuery.isError && !summaryQuery.data) ||
		!auditsQuery.data ||
		!summaryQuery.data
	) {
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
					{ label: t("breadcrumbs.reports") }
				]}
			/>
			<AuditsTable
				rows={auditsQuery.data.items.map<AuditActivityRow>(audit => ({
					id: audit.audit_id,
					auditCode: audit.audit_code,
					status: audit.status,
					auditorCode: "You",
					projectName: audit.project_name,
					projectId: audit.project_id,
					placeName: audit.place_name,
					placeId: audit.place_id,
					startedAt: audit.started_at,
					submittedAt: audit.submitted_at,
					score: audit.summary_score
				}))}
				basePath="/auditor/reports"
				title={t("list.title")}
				description={t("header.description")}
				emptyMessage={t("list.empty")}
				getRowActions={audit => {
					const isSubmitted = audit.status === "SUBMITTED";
					if (isSubmitted) {
						return [
							{
								label: t("list.openReport"),
								href: `/auditor/reports/${encodeURIComponent(audit.id)}`
							}
						];
					}

					if (!audit.placeId || !audit.projectId) {
						return [];
					}

					return [
						{
							label: t("list.resumeAudit"),
							href: `/auditor/execute/${encodeURIComponent(audit.placeId)}?projectId=${encodeURIComponent(audit.projectId)}`
						}
					];
				}}
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
			<Card>
				<CardHeader>
					<CardTitle>{t("summary.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="font-mono text-[2rem] font-semibold leading-none tabular-nums">
						{summaryQuery.data.submitted_audits}
					</p>
					<p className="text-sm text-muted-foreground">{t("summary.description")}</p>
				</CardContent>
			</Card>
		</div>
	);
}

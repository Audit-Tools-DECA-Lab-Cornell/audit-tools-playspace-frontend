"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { FileTextIcon, XIcon } from "lucide-react";
import * as React from "react";

import {
	playspaceApi,
	type AdminAccountRow,
	type AdminAuditorRow,
	type AdminPlaceRow,
	type AdminProjectRow,
	type PaginatedResponse
} from "@/lib/api/playspace";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterPopover } from "@/components/dashboard/filter-popover";
import {
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
	const router = useRouter();
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "submitted_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});

	const searchValue = getTextColumnFilterValue(columnFilters, "audit_code");
	const sortParam = toBackendSortParam(sorting);

	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);
	const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>([]);

	const selectedProjectIdsKey = selectedProjectIds.join("|");
	const selectedPlaceIdsKey = selectedPlaceIds.join("|");
	const selectedAuditorIdsKey = selectedAuditorIds.join("|");
	const selectedAccountIdsKey = selectedAccountIds.join("|");

	React.useEffect(() => {
		setPagination(currentValue => {
			return currentValue.pageIndex === 0 ? currentValue : { ...currentValue, pageIndex: 0 };
		});
	}, [
		searchValue,
		selectedProjectIdsKey,
		selectedPlaceIdsKey,
		selectedAuditorIdsKey,
		selectedAccountIdsKey,
		sortParam
	]);

	const projectsQuery = useQuery({
		queryKey: ["playspace", "admin", "reports", "projects-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminProjectRow>> =>
			playspaceApi.admin.projects({ page: 1, pageSize: 100 })
	});

	const placesQuery = useQuery({
		queryKey: ["playspace", "admin", "reports", "places-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminPlaceRow>> =>
			playspaceApi.admin.places({ page: 1, pageSize: 200 })
	});

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "admin", "reports", "auditors-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminAuditorRow>> =>
			playspaceApi.admin.auditors({ page: 1, pageSize: 200 })
	});

	const accountsQuery = useQuery({
		queryKey: ["playspace", "admin", "reports", "accounts-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminAccountRow>> =>
			playspaceApi.admin.accounts({ page: 1, pageSize: 100, accountTypes: ["MANAGER"] })
	});

	const reportsQuery = useQuery({
		queryKey: [
			"playspace",
			"admin",
			"reports",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedProjectIds,
			selectedPlaceIds,
			selectedAuditorIds,
			selectedAccountIds
		],
		queryFn: () =>
			playspaceApi.admin.audits({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				projectIds: selectedProjectIds,
				placeIds: selectedPlaceIds,
				auditorIds: selectedAuditorIds,
				accountIds: selectedAccountIds,
				statuses: ["SUBMITTED"]
			}),
		placeholderData: preservePreviousData
	});

	React.useEffect(() => {
		if (!reportsQuery.data) {
			return;
		}

		const maxPageIndex = Math.max(reportsQuery.data.total_pages - 1, 0);
		if (pagination.pageIndex <= maxPageIndex) {
			return;
		}

		setPagination(currentValue => ({
			...currentValue,
			pageIndex: maxPageIndex
		}));
	}, [reportsQuery.data, pagination.pageIndex]);

	const projectOptions = React.useMemo(() => {
		return (projectsQuery.data?.items ?? []).map((p: AdminProjectRow) => ({
			label: `${p.account_name} · ${p.name}`,
			value: p.project_id
		}));
	}, [projectsQuery.data]);

	const placeOptions = React.useMemo(() => {
		return (placesQuery.data?.items ?? []).map((p: AdminPlaceRow) => ({
			label: p.name,
			value: p.place_id
		}));
	}, [placesQuery.data]);

	/** Admin reports auditor filter shows auditor code only — no personal details. */
	const auditorOptions = React.useMemo(() => {
		return (auditorsQuery.data?.items ?? []).map((a: AdminAuditorRow) => ({
			label: a.auditor_code,
			value: a.auditor_profile_id
		}));
	}, [auditorsQuery.data]);

	const accountOptions = React.useMemo(() => {
		return (accountsQuery.data?.items ?? []).map((a: AdminAccountRow) => ({
			label: a.name,
			value: a.account_id
		}));
	}, [accountsQuery.data]);

	const rows = React.useMemo((): AuditActivityRow[] => {
		return (reportsQuery.data?.items ?? []).map(audit => ({
			id: audit.audit_id,
			auditCode: audit.audit_code,
			status: audit.status,
			auditorCode: audit.auditor_code,
			accountName: audit.account_name,
			projectName: audit.project_name,
			projectId: audit.project_id,
			placeName: audit.place_name,
			placeId: audit.place_id,
			executionMode: audit.execution_mode,
			startedAt: audit.started_at,
			submittedAt: audit.submitted_at,
			score: audit.summary_score,
			scorePair: audit.score_pair
		}));
	}, [reportsQuery.data]);

	const hasActiveFilters =
		selectedProjectIds.length > 0 ||
		selectedPlaceIds.length > 0 ||
		selectedAuditorIds.length > 0 ||
		selectedAccountIds.length > 0;

	function clearAllFilters(): void {
		setSelectedProjectIds([]);
		setSelectedPlaceIds([]);
		setSelectedAuditorIds([]);
		setSelectedAccountIds([]);
	}

	const isInitialLoading = reportsQuery.isLoading && !reportsQuery.data;

	if (isInitialLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (reportsQuery.isError && !reportsQuery.data) {
		return (
			<EmptyState
				title="Reports unavailable"
				description="Unable to load audit reports. Refresh and try again."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Admin Workspace"
				title="Audit Reports"
				description="View all submitted audit reports across the platform."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Reports" }]}
			/>
			<AuditsTable
				rows={rows}
				basePath="/admin/reports"
				title="All Submitted Audit Reports"
				description="Browse completed audit reports from all accounts. Click a row to view details."
				emptyMessage="No submitted audit reports yet."
				sortingState={sorting}
				onSortingStateChange={setSorting}
				columnFiltersState={columnFilters}
				onColumnFiltersStateChange={setColumnFilters}
				paginationState={pagination}
				onPaginationStateChange={setPagination}
				manualFiltering
				manualSorting
				manualPagination
				rowCount={reportsQuery.data?.total_count}
				pageCount={reportsQuery.data?.total_pages}
				isFetching={reportsQuery.isFetching}
				onRowClick={row => router.push(`/admin/reports/${row.id}`)}
				getRowActions={row => [
					{
						label: "View Report",
						onSelect: () => router.push(`/admin/reports/${row.id}`),
						icon: FileTextIcon
					}
				]}
				toolbarExtra={
					<>
						<FilterPopover
							title="Projects"
							options={projectOptions}
							selectedValues={selectedProjectIds}
							onChange={setSelectedProjectIds}
						/>
						<FilterPopover
							title="Places"
							options={placeOptions}
							selectedValues={selectedPlaceIds}
							onChange={setSelectedPlaceIds}
						/>
						<FilterPopover
							title="Auditors"
							options={auditorOptions}
							selectedValues={selectedAuditorIds}
							onChange={setSelectedAuditorIds}
						/>
						<FilterPopover
							title="Managers"
							options={accountOptions}
							selectedValues={selectedAccountIds}
							onChange={setSelectedAccountIds}
						/>
						{hasActiveFilters && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-1.5"
								onClick={clearAllFilters}>
								<XIcon className="size-3.5" />
								Clear filters
							</Button>
						)}
					</>
				}
			/>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { FileTextIcon, FilterIcon, XIcon } from "lucide-react";
import * as React from "react";

import { playspaceApi, type AdminProjectRow, type PaginatedResponse } from "@/lib/api/playspace";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
	getTextColumnFilterValue,
	preservePreviousData,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface FilterPopoverProps {
	title: string;
	options: Array<{ label: string; value: string }>;
	selectedValues: string[];
	onChange: (values: string[]) => void;
}

function FilterPopover({ title, options, selectedValues, onChange }: FilterPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<FilterIcon className="size-3.5" />
					{title}
					{selectedValues.length > 0 && (
						<Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-mono text-xs">
							{selectedValues.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium">{title}</h4>
						{selectedValues.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-auto p-0 text-xs text-muted-foreground"
								onClick={() => onChange([])}>
								Clear
							</Button>
						)}
					</div>
					<Separator />
					<div className="max-h-60 space-y-2 overflow-y-auto">
						{options.map(option => (
							<div key={option.value} className="flex items-center gap-2">
								<Checkbox
									id={`filter-${title}-${option.value}`}
									checked={selectedValues.includes(option.value)}
									onCheckedChange={checked => {
										if (checked) {
											onChange([...selectedValues, option.value]);
										} else {
											onChange(selectedValues.filter(v => v !== option.value));
										}
									}}
								/>
								<Label
									htmlFor={`filter-${title}-${option.value}`}
									className="text-sm font-normal leading-none">
									{option.label}
								</Label>
							</div>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

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

	const selectedProjectIdsKey = selectedProjectIds.join("|");

	React.useEffect(() => {
		setPagination(currentValue => {
			return currentValue.pageIndex === 0 ? currentValue : { ...currentValue, pageIndex: 0 };
		});
	}, [searchValue, selectedProjectIdsKey, sortParam]);

	const projectsQuery = useQuery({
		queryKey: ["playspace", "admin", "reports", "projects-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminProjectRow>> =>
			playspaceApi.admin.projects({ page: 1, pageSize: 100 })
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
			selectedProjectIds
		],
		queryFn: () =>
			playspaceApi.admin.audits({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				projectIds: selectedProjectIds,
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
		return (projectsQuery.data?.items ?? []).map(p => ({
			label: `${p.account_name} · ${p.name}`,
			value: p.project_id
		}));
	}, [projectsQuery.data]);

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
			startedAt: audit.started_at,
			submittedAt: audit.submitted_at,
			score: audit.summary_score,
			scorePair: audit.score_pair
		}));
	}, [reportsQuery.data]);

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
						{selectedProjectIds.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-1.5"
								onClick={() => setSelectedProjectIds([])}>
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

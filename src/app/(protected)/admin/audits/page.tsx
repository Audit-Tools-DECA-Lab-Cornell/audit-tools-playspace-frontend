"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { FilterIcon, XIcon } from "lucide-react";

import { playspaceApi, type AdminProjectRow, type PaginatedResponse } from "@/lib/api/playspace";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
	getMultiValueColumnFilter,
	preservePreviousData,
	getTextColumnFilterValue,
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

export default function AdminAuditsPage() {
	const t = useTranslations("admin.audits");
	const router = useRouter();
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

	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);

	const selectedProjectIdsKey = selectedProjectIds.join("|");

	React.useEffect(() => {
		setPagination(currentValue => {
			return currentValue.pageIndex === 0
				? currentValue
				: {
						...currentValue,
						pageIndex: 0
					};
		});
	}, [searchValue, selectedStatusesKey, selectedProjectIdsKey, sortParam]);

	const projectsQuery = useQuery({
		queryKey: ["playspace", "admin", "audits", "projects-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminProjectRow>> =>
			playspaceApi.admin.projects({ page: 1, pageSize: 100 })
	});

	const auditsQuery = useQuery({
		queryKey: [
			"playspace",
			"admin",
			"audits",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedStatuses,
			selectedProjectIds
		],
		queryFn: () =>
			playspaceApi.admin.audits({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				projectIds: selectedProjectIds,
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

	const projectOptions = React.useMemo(() => {
		return (projectsQuery.data?.items ?? []).map(p => ({
			label: `${p.account_name} · ${p.name}`,
			value: p.project_id
		}));
	}, [projectsQuery.data]);

	const handleRowClick = React.useCallback(
		(row: AuditActivityRow) => {
			router.push(`/admin/audits/${row.id}`);
		},
		[router]
	);

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
					score: audit.summary_score,
					scorePair: audit.score_pair
				}))}
				basePath="/admin/audits"
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
				onRowClick={handleRowClick}
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

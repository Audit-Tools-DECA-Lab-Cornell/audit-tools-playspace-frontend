"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { FilterIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AdminAccountRow, type AdminAuditorRow, type PaginatedResponse } from "@/lib/api/playspace";
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

export default function AdminAuditorsPage() {
	const t = useTranslations("admin.auditors");
	const formatT = useTranslations("common.format");
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "last_active_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>([]);

	const searchValue = getTextColumnFilterValue(columnFilters, "auditor_code");
	const selectedAccountIdsKey = selectedAccountIds.join("|");
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
	}, [searchValue, selectedAccountIdsKey, sortParam]);

	const accountsQuery = useQuery({
		queryKey: ["playspace", "admin", "auditors", "accounts-for-filter"],
		queryFn: async (): Promise<PaginatedResponse<AdminAccountRow>> =>
			playspaceApi.admin.accounts({ page: 1, pageSize: 100, accountTypes: ["MANAGER"] })
	});

	const auditorsQuery = useQuery({
		queryKey: [
			"playspace",
			"admin",
			"auditors",
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedAccountIds
		],
		queryFn: () =>
			playspaceApi.admin.auditors({
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				accountIds: selectedAccountIds
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

	const accountOptions = React.useMemo(() => {
		return (accountsQuery.data?.items ?? []).map(a => ({
			label: a.name,
			value: a.account_id
		}));
	}, [accountsQuery.data]);

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
				filterConfigs={[]}
				toolbarExtra={
					<>
						<FilterPopover
							title="Managers"
							options={accountOptions}
							selectedValues={selectedAccountIds}
							onChange={setSelectedAccountIds}
						/>
						{selectedAccountIds.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-1.5"
								onClick={() => setSelectedAccountIds([])}>
								<XIcon className="size-3.5" />
								Clear filters
							</Button>
						)}
					</>
				}
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

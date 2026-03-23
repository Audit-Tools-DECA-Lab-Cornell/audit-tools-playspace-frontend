"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { FolderKanbanIcon, MapPinnedIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type ManagerPlaceRow } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { DataTable, getMultiValueFilterFn } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EntityRowActions } from "@/components/dashboard/entity-row-actions";
import {
	getMultiValueColumnFilter,
	getTextColumnFilterValue,
	toBackendSortParam
} from "@/components/dashboard/server-table-utils";
import { StatCard } from "@/components/dashboard/stat-card";
import {
	formatDateTimeLabel,
	formatLocationLabel,
	formatScoreLabel,
	getPlaceStatusClassName
} from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}

	return fallbackMessage;
}

function isManagerPlaceStatus(value: string): value is ManagerPlaceRow["status"] {
	return value === "not_started" || value === "in_progress" || value === "submitted";
}

export default function ManagerPlacesPage() {
	const t = useTranslations("manager.places");
	const formatT = useTranslations("common.format");
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "last_audited_at", desc: true }]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const searchValue = getTextColumnFilterValue(columnFilters, "search");
	const selectedProjectIds = getMultiValueColumnFilter(columnFilters, "project_id");
	const selectedStatuses = getMultiValueColumnFilter(columnFilters, "status").filter(isManagerPlaceStatus);
	const selectedProjectIdsKey = selectedProjectIds.join("|");
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
	}, [searchValue, selectedProjectIdsKey, selectedStatusesKey, sortParam]);

	const projectsQuery = useQuery({
		queryKey: ["playspace", "manager", "places", "projects", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}

			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});

	const placesQuery = useQuery({
		queryKey: [
			"playspace",
			"manager",
			"places",
			accountId,
			pagination.pageIndex,
			pagination.pageSize,
			searchValue,
			sortParam,
			selectedProjectIds,
			selectedStatuses
		],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}

			return playspaceApi.accounts.places(accountId, {
				page: pagination.pageIndex + 1,
				pageSize: pagination.pageSize,
				search: searchValue,
				sort: sortParam,
				projectIds: selectedProjectIds,
				statuses: selectedStatuses
			});
		},
		enabled: accountId !== null
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

	const columns = React.useMemo<ColumnDef<ManagerPlaceRow>[]>(
		() => [
			{
				id: "search",
				accessorFn: row => `${row.name} ${row.project_name} ${formatLocationLabel(row, formatT)}`,
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.place")} />,
				cell: ({ row }) => (
					<div className="min-w-[280px] space-y-1">
						<Link
							href={`/manager/places/${encodeURIComponent(row.original.id)}`}
							className="font-medium text-foreground transition-colors hover:text-primary">
							{row.original.name}
						</Link>
						<p className="text-sm text-muted-foreground">{row.original.project_name}</p>
						<p className="text-sm text-muted-foreground">{formatLocationLabel(row.original, formatT)}</p>
					</div>
				),
				enableHiding: false
			},
			{
				id: "project_id",
				accessorFn: row => row.project_id,
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.project")} />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.project_name}</span>
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.status")} />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={cn(
							getPlaceStatusClassName(row.original.status),
							"font-medium tracking-[0.14em] uppercase"
						)}>
						{t(`table.status.${row.original.status}`)}
					</Badge>
				)
			},
			{
				accessorKey: "audits_completed",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("table.columns.audits")} align="end" />
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
					<DataTableColumnHeader column={column} title={t("table.columns.lastAudited")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.last_audited_at, formatT)}
					</span>
				)
			},
			{
				id: "actions",
				enableSorting: false,
				enableHiding: false,
				cell: ({ row }) => (
					<EntityRowActions
						actions={[
							{
								label: t("table.actions.openPlace"),
								href: `/manager/places/${encodeURIComponent(row.original.id)}`,
								icon: MapPinnedIcon
							},
							{
								label: t("table.actions.openProject"),
								href: `/manager/projects/${encodeURIComponent(row.original.project_id)}`,
								icon: FolderKanbanIcon
							}
						]}
					/>
				)
			}
		],
		[formatT, t]
	);

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.loadingDescription")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.places") }
					]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">{t("missingAccount")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (projectsQuery.isLoading || placesQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.loadingDescription")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.places") }
					]}
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={`places-stat-skeleton-${index}`}
							className="h-32 animate-pulse rounded-card border border-border bg-card"
						/>
					))}
				</div>
				<div className="h-[420px] animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (projectsQuery.isError || placesQuery.isError || !placesQuery.data || !projectsQuery.data) {
		return (
			<EmptyState
				title={t("error.title")}
				description={getErrorMessage(projectsQuery.error ?? placesQuery.error, t("error.description"))}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.tryAgain")}
					</Button>
				}
			/>
		);
	}

	const places = placesQuery.data.items;
	const projects = projectsQuery.data;
	const meanScore =
		placesQuery.data.summary.average_score !== null
			? `${placesQuery.data.summary.average_score}`
			: formatT("pending");

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
					{ label: t("breadcrumbs.places") }
				]}
				actions={
					<Button asChild variant="outline">
						<Link href="/manager/projects">{t("header.openProjects")}</Link>
					</Button>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title={t("stats.totalPlaces.title")}
					value={String(placesQuery.data.summary.total_places)}
					helper={t("stats.totalPlaces.helper")}
				/>
				<StatCard
					title={t("stats.submitted.title")}
					value={String(placesQuery.data.summary.submitted_places)}
					helper={t("stats.submitted.helper")}
					tone="success"
				/>
				<StatCard
					title={t("stats.inProgress.title")}
					value={String(placesQuery.data.summary.in_progress_places)}
					helper={t("stats.inProgress.helper")}
					tone="warning"
				/>
				<StatCard
					title={t("stats.meanScore.title")}
					value={meanScore}
					helper={t("stats.meanScore.helper")}
					tone="violet"
				/>
			</div>
			<DataTable
				title={t("table.title")}
				description={t("table.description")}
				columns={columns}
				data={places}
				searchColumnId="search"
				searchPlaceholder={t("table.searchPlaceholder")}
				filterConfigs={[
					{
						columnId: "project_id",
						title: t("table.columns.project"),
						options: projects
							.slice()
							.sort((left, right) => left.name.localeCompare(right.name))
							.map(project => ({
								label: project.name,
								value: project.id
							}))
					},
					{
						columnId: "status",
						title: t("table.columns.status"),
						options: (["not_started", "in_progress", "submitted"] as const).map(status => ({
							label: t(`table.status.${status}`),
							value: status
						}))
					}
				]}
				emptyMessage={
					placesQuery.data.total_count === 0
						? t("table.emptyState.noPlaces")
						: t("table.emptyState.noMatches")
				}
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

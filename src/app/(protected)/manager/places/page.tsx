"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { FolderKanbanIcon, MapPinnedIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type PlaceSummary } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { DataTable, getMultiValueFilterFn } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EntityRowActions } from "@/components/dashboard/entity-row-actions";
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

interface ManagerPlaceRow extends PlaceSummary {
	project_name: string;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}

	return fallbackMessage;
}

export default function ManagerPlacesPage() {
	const t = useTranslations("manager.places");
	const formatT = useTranslations("common.format");
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const placesQuery = useQuery({
		queryKey: ["playspace", "manager", "places", accountId],
		queryFn: async (): Promise<ManagerPlaceRow[]> => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}

			const projects = await playspaceApi.accounts.projects(accountId);
			const placesByProject = await Promise.all(
				projects.map(async project => {
					const places = await playspaceApi.projects.places(project.id);
					return places.map(place => ({
						...place,
						project_name: project.name
					}));
				})
			);

			return placesByProject.flat();
		},
		enabled: accountId !== null
	});

	const columns = React.useMemo<ColumnDef<ManagerPlaceRow>[]>(
		() => [
			{
				id: "place",
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
				accessorKey: "project_name",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.project")} />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.project_name}</span>
			},
			{
				accessorKey: "place_type",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.type")} />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) =>
					row.original.place_type ? (
						<Badge variant="secondary">{row.original.place_type}</Badge>
					) : (
						<span className="text-sm text-muted-foreground">{t("table.typePending")}</span>
					)
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
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.audits")} align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono tabular-nums">{row.original.audits_completed}</span>
				)
			},
			{
				accessorKey: "average_score",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.meanScore")} align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.average_score, formatT)}
					</span>
				)
			},
			{
				accessorKey: "last_audited_at",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.columns.lastAudited")} align="end" />,
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
						<p className="text-sm text-muted-foreground">
							{t("missingAccount")}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (placesQuery.isLoading) {
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

	if (placesQuery.isError || !placesQuery.data) {
		return (
			<EmptyState
				title={t("error.title")}
				description={getErrorMessage(placesQuery.error, t("error.description"))}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.tryAgain")}
					</Button>
				}
			/>
		);
	}

	const places = placesQuery.data;
	const submittedPlaces = places.filter(place => place.status === "submitted").length;
	const inProgressPlaces = places.filter(place => place.status === "in_progress").length;
	const scoredPlaces = places.filter(
		(place): place is ManagerPlaceRow & { average_score: number } => place.average_score !== null
	);
	const meanScore =
		scoredPlaces.length > 0
			? `${Math.round((scoredPlaces.reduce((runningTotal, place) => runningTotal + place.average_score, 0) / scoredPlaces.length) * 10) / 10}`
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
					value={String(places.length)}
					helper={t("stats.totalPlaces.helper")}
				/>
				<StatCard
					title={t("stats.submitted.title")}
					value={String(submittedPlaces)}
					helper={t("stats.submitted.helper")}
					tone="success"
				/>
				<StatCard
					title={t("stats.inProgress.title")}
					value={String(inProgressPlaces)}
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
				searchColumnId="place"
				searchPlaceholder={t("table.searchPlaceholder")}
				filterConfigs={[
					{
						columnId: "project_name",
						title: t("table.columns.project"),
						options: Array.from(new Set(places.map(place => place.project_name)))
							.sort((left, right) => left.localeCompare(right))
							.map(projectName => ({
								label: projectName,
								value: projectName
							}))
					},
					{
						columnId: "place_type",
						title: t("table.columns.type"),
						options: Array.from(
							new Set(
								places.map(place => place.place_type).filter((value): value is string => Boolean(value))
							)
						)
							.sort((left, right) => left.localeCompare(right))
							.map(placeType => ({
								label: placeType,
								value: placeType
							}))
					},
					{
						columnId: "status",
						title: t("table.columns.status"),
						options: Array.from(new Set(places.map(place => place.status))).map(status => ({
							label: t(`table.status.${status}`),
							value: status
						}))
					}
				]}
				emptyMessage={
					places.length === 0
						? t("table.emptyState.noPlaces")
						: t("table.emptyState.noMatches")
				}
				initialSorting={[{ id: "last_audited_at", desc: true }]}
			/>
		</div>
	);
}

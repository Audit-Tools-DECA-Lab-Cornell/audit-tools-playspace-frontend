"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { FolderKanbanIcon, MapPinnedIcon } from "lucide-react";
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

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to load manager places.";
}

export default function ManagerPlacesPage() {
	const session = useAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const placesQuery = useQuery({
		queryKey: ["playspace", "manager", "places", accountId],
		queryFn: async (): Promise<ManagerPlaceRow[]> => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
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
				accessorFn: row => `${row.name} ${row.project_name} ${formatLocationLabel(row)}`,
				header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
				cell: ({ row }) => (
					<div className="min-w-[280px] space-y-1">
						<Link
							href={`/manager/places/${encodeURIComponent(row.original.id)}`}
							className="font-medium text-foreground transition-colors hover:text-primary">
							{row.original.name}
						</Link>
						<p className="text-sm text-muted-foreground">{row.original.project_name}</p>
						<p className="text-sm text-muted-foreground">{formatLocationLabel(row.original)}</p>
					</div>
				),
				enableHiding: false
			},
			{
				accessorKey: "project_name",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.project_name}</span>
			},
			{
				accessorKey: "place_type",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) =>
					row.original.place_type ? (
						<Badge variant="secondary">{row.original.place_type}</Badge>
					) : (
						<span className="text-sm text-muted-foreground">Type pending</span>
					)
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
				filterFn: getMultiValueFilterFn<ManagerPlaceRow>(),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={cn(
							getPlaceStatusClassName(row.original.status),
							"font-medium tracking-[0.14em] uppercase"
						)}>
						{row.original.status.replaceAll("_", " ")}
					</Badge>
				)
			},
			{
				accessorKey: "audits_completed",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Audits" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono tabular-nums">{row.original.audits_completed}</span>
				)
			},
			{
				accessorKey: "average_score",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Mean Score" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.average_score)}
					</span>
				)
			},
			{
				accessorKey: "last_audited_at",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Last Audited" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.last_audited_at)}
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
								label: "Open place",
								href: `/manager/places/${encodeURIComponent(row.original.id)}`,
								icon: MapPinnedIcon
							},
							{
								label: "Open project",
								href: `/manager/projects/${encodeURIComponent(row.original.project_id)}`,
								icon: FolderKanbanIcon
							}
						]}
					/>
				)
			}
		],
		[]
	);

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Places"
					description="Operational visibility into every place across your account."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Places" }]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">
							Manager account context is missing from the current session.
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
					eyebrow="Manager Workspace"
					title="Places"
					description="Operational visibility into every place across your account."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Places" }]}
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
				title="Places unavailable"
				description={getErrorMessage(placesQuery.error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
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
			: "Pending";

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Places"
				description="Operational visibility into every place across your account. Add new places from a project workspace."
				breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Places" }]}
				actions={
					<Button asChild variant="outline">
						<Link href="/manager/projects">Open projects to add place</Link>
					</Button>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Places"
					value={String(places.length)}
					helper="All places currently linked to your projects."
				/>
				<StatCard
					title="Submitted"
					value={String(submittedPlaces)}
					helper="Places with completed audit activity."
					tone="success"
				/>
				<StatCard
					title="In Progress"
					value={String(inProgressPlaces)}
					helper="Places with active draft audit work."
					tone="warning"
				/>
				<StatCard
					title="Mean Score"
					value={meanScore}
					helper="Average across places with submitted scoring."
					tone="violet"
				/>
			</div>
			<DataTable
				title="Place Operations"
				description="Search, sort, and drill into every place from one account-wide table."
				columns={columns}
				data={places}
				searchColumnId="place"
				searchPlaceholder="Search places..."
				filterConfigs={[
					{
						columnId: "project_name",
						title: "Project",
						options: Array.from(new Set(places.map(place => place.project_name)))
							.sort((left, right) => left.localeCompare(right))
							.map(projectName => ({
								label: projectName,
								value: projectName
							}))
					},
					{
						columnId: "place_type",
						title: "Type",
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
						title: "Status",
						options: Array.from(new Set(places.map(place => place.status))).map(status => ({
							label: status.replaceAll("_", " "),
							value: status
						}))
					}
				]}
				emptyMessage={
					places.length === 0
						? "No places yet. Add places from a project workspace to start audit operations."
						: "No places match the current filters."
				}
				initialSorting={[{ id: "last_audited_at", desc: true }]}
			/>
		</div>
	);
}

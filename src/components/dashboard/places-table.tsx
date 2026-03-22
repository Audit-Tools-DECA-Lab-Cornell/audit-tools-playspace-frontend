"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlaceSummary } from "@/lib/api/playspace";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { DataTable, getMultiValueFilterFn } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import type { EntityRowAction } from "./entity-row-actions";
import { EntityRowActions } from "./entity-row-actions";

import { formatDateTimeLabel, formatLocationLabel, formatScoreLabel, getPlaceStatusClassName } from "./utils";

export interface PlacesTableProps {
	places: PlaceSummary[];
	title?: string;
	description?: string;
	basePath?: string;
	action?: React.ReactNode;
	getRowActions?: (place: PlaceSummary) => EntityRowAction[];
	pageSize?: number;
	emptyMessage?: string;
}

/**
 * Project-scoped operational place table used on manager overview screens.
 */
export function PlacesTable({
	places,
	title = "Places",
	description = "Monitor place status, audit throughput, and recency at a glance.",
	basePath = "/manager/places",
	action,
	getRowActions,
	pageSize = 8,
	emptyMessage = "No places match the current filters."
}: Readonly<PlacesTableProps>) {
	const columns = React.useMemo<ColumnDef<PlaceSummary>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
				cell: ({ row }) => {
					const place = row.original;

					return (
						<div className="min-w-[260px] space-y-1">
							<Link
								href={`${basePath}/${encodeURIComponent(place.id)}`}
								className="font-medium text-foreground transition-colors hover:text-primary">
								{place.name}
							</Link>
							<p className="text-sm text-muted-foreground">{formatLocationLabel(place)}</p>
						</div>
					);
				}
			},
			{
				accessorKey: "place_type",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
				filterFn: getMultiValueFilterFn<PlaceSummary>(),
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
				filterFn: getMultiValueFilterFn<PlaceSummary>(),
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
					<span className="block text-right font-mono text-foreground tabular-nums">
						{row.original.audits_completed}
					</span>
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
			...(getRowActions
				? [
						{
							id: "actions",
							enableSorting: false,
							enableHiding: false,
							cell: ({ row }) => <EntityRowActions actions={getRowActions(row.original)} />
						} satisfies ColumnDef<PlaceSummary>
					]
				: [])
		],
		[basePath, getRowActions]
	);

	const statusOptions = React.useMemo(() => {
		return Array.from(new Set(places.map(place => place.status))).map(status => ({
			label: status.replaceAll("_", " "),
			value: status
		}));
	}, [places]);

	const placeTypeOptions = React.useMemo(() => {
		return Array.from(
			new Set(places.map(place => place.place_type).filter((value): value is string => Boolean(value)))
		)
			.sort((left, right) => left.localeCompare(right))
			.map(placeType => ({
				label: placeType,
				value: placeType
			}));
	}, [places]);

	return (
		<DataTable
			title={title}
			description={description}
			columns={columns}
			data={places}
			searchColumnId="name"
			searchPlaceholder="Search places..."
			filterConfigs={[
				{
					columnId: "status",
					title: "Status",
					options: statusOptions
				},
				{
					columnId: "place_type",
					title: "Type",
					options: placeTypeOptions
				}
			]}
			action={action}
			pageSize={pageSize}
			emptyMessage={emptyMessage}
			initialSorting={[{ id: "last_audited_at", desc: true }]}
		/>
	);
}

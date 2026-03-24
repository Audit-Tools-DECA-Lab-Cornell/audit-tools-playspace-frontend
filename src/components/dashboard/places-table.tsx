"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

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
	title,
	description,
	basePath = "/manager/places",
	action,
	getRowActions,
	pageSize = 8,
	emptyMessage
}: Readonly<PlacesTableProps>) {
	const t = useTranslations("tables.places");
	const formatT = useTranslations("common.format");
	const columns = React.useMemo<ColumnDef<PlaceSummary>[]>(
		() => [
			{
				accessorKey: "name",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.place")} />,
				cell: ({ row }) => {
					const place = row.original;

					return (
						<div className="min-w-[260px] space-y-1">
							<Link
								href={`${basePath}/${encodeURIComponent(place.id)}?projectId=${encodeURIComponent(place.project_id)}`}
								className="font-medium text-foreground transition-colors hover:text-primary">
								{place.name}
							</Link>
							<p className="text-sm text-muted-foreground">{formatLocationLabel(place, formatT)}</p>
						</div>
					);
				}
			},
			{
				accessorKey: "place_type",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.type")} />,
				filterFn: getMultiValueFilterFn<PlaceSummary>(),
				cell: ({ row }) =>
					row.original.place_type ? (
						<Badge variant="secondary">{row.original.place_type}</Badge>
					) : (
						<span className="text-sm text-muted-foreground">{t("typePending")}</span>
					)
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.status")} />,
				filterFn: getMultiValueFilterFn<PlaceSummary>(),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={cn(getPlaceStatusClassName(row.original.status), "font-medium")}>
						{t(`status.${row.original.status}`)}
					</Badge>
				)
			},
			{
				accessorKey: "audits_completed",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("columns.audits")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{row.original.audits_completed}
					</span>
				)
			},
			{
				accessorKey: "average_score",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("columns.meanScore")} align="end" />
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
					<DataTableColumnHeader column={column} title={t("columns.lastAudited")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.last_audited_at, formatT)}
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
		[basePath, formatT, getRowActions, t]
	);

	const statusOptions = React.useMemo(() => {
		return Array.from(new Set(places.map(place => place.status))).map(status => ({
			label: t(`status.${status}`),
			value: status
		}));
	}, [places, t]);

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
			title={title ?? t("title")}
			description={description ?? t("description")}
			columns={columns}
			data={places}
			searchColumnId="name"
			searchPlaceholder={t("searchPlaceholder")}
			filterConfigs={[
				{
					columnId: "status",
					title: t("columns.status"),
					options: statusOptions
				},
				{
					columnId: "place_type",
					title: t("columns.type"),
					options: placeTypeOptions
				}
			]}
			action={action}
			pageSize={pageSize}
			emptyMessage={emptyMessage ?? t("emptyMessage")}
			initialSorting={[{ id: "last_audited_at", desc: true }]}
		/>
	);
}

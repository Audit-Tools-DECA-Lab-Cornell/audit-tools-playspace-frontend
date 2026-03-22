"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { DataTable, getMultiValueFilterFn } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import type { EntityRowAction } from "./entity-row-actions";
import { EntityRowActions } from "./entity-row-actions";
import { formatDateTimeLabel, formatScoreLabel } from "./utils";

export interface AuditActivityRow {
	id: string;
	auditCode: string;
	status: string;
	auditorCode: string;
	placeName?: string | null;
	projectName?: string | null;
	accountName?: string | null;
	startedAt: string | null;
	submittedAt: string | null;
	score: number | null;
}

export interface AuditsTableProps {
	rows: AuditActivityRow[];
	title?: string;
	description?: string;
	action?: React.ReactNode;
	pageSize?: number;
	emptyMessage?: string;
	getRowActions?: (row: AuditActivityRow) => EntityRowAction[];
}

/**
 * Shared audit activity table used by manager and admin monitoring views.
 */
export function AuditsTable({
	rows,
	title = "Audit activity",
	description = "Review audit progress, lineage, recency, and score output.",
	action,
	pageSize = 10,
	emptyMessage = "No audit activity matches the current filters.",
	getRowActions
}: Readonly<AuditsTableProps>) {
	const columns = React.useMemo<ColumnDef<AuditActivityRow>[]>(
		() => [
			{
				id: "search",
				accessorFn: row =>
					[row.auditCode, row.auditorCode, row.placeName, row.projectName, row.accountName]
						.filter(Boolean)
						.join(" "),
				header: ({ column }) => <DataTableColumnHeader column={column} title="Audit" />,
				cell: ({ row }) => {
					const lineage = [row.original.accountName, row.original.projectName, row.original.placeName]
						.filter((value): value is string => Boolean(value))
						.join(" · ");

					return (
						<div className="min-w-[280px] space-y-1">
							<p className="font-mono text-sm font-semibold tracking-[0.08em] text-foreground uppercase">
								{row.original.auditCode}
							</p>
							{lineage.length > 0 ? <p className="text-sm text-muted-foreground">{lineage}</p> : null}
							<p className="text-sm text-muted-foreground">
								Auditor{" "}
								<span className="font-mono text-foreground uppercase tracking-[0.08em]">
									{row.original.auditorCode}
								</span>
							</p>
						</div>
					);
				},
				enableHiding: false
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
				filterFn: getMultiValueFilterFn<AuditActivityRow>(),
				cell: ({ row }) => (
					<Badge
						variant={row.original.status === "SUBMITTED" ? "default" : "secondary"}
						className="font-medium tracking-[0.14em] uppercase">
						{row.original.status.toLowerCase().replaceAll("_", " ")}
					</Badge>
				)
			},
			{
				accessorKey: "startedAt",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Started" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.startedAt)}
					</span>
				)
			},
			{
				accessorKey: "submittedAt",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.submittedAt)}
					</span>
				)
			},
			{
				accessorKey: "score",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Score" align="end" />,
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.score)}
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
						} satisfies ColumnDef<AuditActivityRow>
					]
				: [])
		],
		[getRowActions]
	);

	const statusOptions = React.useMemo(() => {
		return Array.from(new Set(rows.map(row => row.status))).map(status => ({
			label: status.toLowerCase().replaceAll("_", " "),
			value: status
		}));
	}, [rows]);

	return (
		<DataTable
			title={title}
			description={description}
			columns={columns}
			data={rows}
			searchColumnId="search"
			searchPlaceholder="Search audits..."
			filterConfigs={[
				{
					columnId: "status",
					title: "Status",
					options: statusOptions
				}
			]}
			action={action}
			pageSize={pageSize}
			emptyMessage={emptyMessage}
			initialSorting={[{ id: "submittedAt", desc: true }]}
		/>
	);
}

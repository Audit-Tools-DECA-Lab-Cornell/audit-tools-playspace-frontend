"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DataTable, getMultiValueFilterFn } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import type { EntityRowAction } from "./entity-row-actions";
import { EntityRowActions } from "./entity-row-actions";
import { formatAuditCodeReference, formatDateTimeLabel, formatScoreLabel } from "./utils";

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

interface AuditIdentityCellProps {
	auditCode: string;
	auditorCode: string;
	placeName?: string | null;
	projectName?: string | null;
	accountName?: string | null;
}

/**
 * Human-first audit row heading with a machine-code reference and copy affordance.
 */
function AuditIdentityCell({
	auditCode,
	auditorCode,
	placeName,
	projectName,
	accountName
}: Readonly<AuditIdentityCellProps>) {
	const t = useTranslations("tables.audits");
	const [isCopied, setIsCopied] = React.useState(false);
	const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const primaryLabel = placeName ?? projectName ?? accountName ?? auditCode;
	const lineage = [accountName, projectName]
		.filter((value): value is string => Boolean(value && value.trim().length > 0))
		.join(" · ");

	React.useEffect(() => {
		return () => {
			if (resetTimeoutRef.current !== null) {
				globalThis.clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	async function handleCopyAuditCode() {
		try {
			await navigator.clipboard.writeText(auditCode);
			setIsCopied(true);
			if (resetTimeoutRef.current !== null) {
				globalThis.clearTimeout(resetTimeoutRef.current);
			}
			resetTimeoutRef.current = globalThis.setTimeout(() => {
				setIsCopied(false);
			}, 1600);
		} catch {
			setIsCopied(false);
		}
	}

	return (
		<div className="min-w-[320px] space-y-2">
			<div className="space-y-1">
				<p className="font-medium text-foreground">{primaryLabel}</p>
				{lineage.length > 0 ? <p className="text-sm text-muted-foreground">{lineage}</p> : null}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<code
					title={auditCode}
					className="rounded-sm bg-secondary px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground">
					{formatAuditCodeReference(auditCode)}
				</code>
				<Button
					type="button"
					variant="ghost"
					size="xs"
					className="h-7 gap-1.5 px-2 text-xs"
					onClick={handleCopyAuditCode}
					aria-label={t("copyAuditCode", { auditCode })}>
					{isCopied ? (
						<CheckIcon data-icon="inline-start" aria-hidden="true" />
					) : (
						<CopyIcon data-icon="inline-start" aria-hidden="true" />
					)}
					<span>{isCopied ? t("copied") : t("copyId")}</span>
				</Button>
			</div>
			<p className="text-sm text-muted-foreground">
				{t("auditorLabel")} <span className="font-mono text-foreground tracking-[0.04em]">{auditorCode}</span>
			</p>
		</div>
	);
}

/**
 * Shared audit activity table used by manager and admin monitoring views.
 */
export function AuditsTable({
	rows,
	title,
	description,
	action,
	pageSize = 10,
	emptyMessage,
	getRowActions
}: Readonly<AuditsTableProps>) {
	const t = useTranslations("tables.audits");
	const formatT = useTranslations("common.format");
	const columns = React.useMemo<ColumnDef<AuditActivityRow>[]>(
		() => [
			{
				id: "search",
				accessorFn: row =>
					[row.auditCode, row.auditorCode, row.placeName, row.projectName, row.accountName]
						.filter(Boolean)
						.join(" "),
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.audit")} />,
				cell: ({ row }) => (
					<AuditIdentityCell
						auditCode={row.original.auditCode}
						auditorCode={row.original.auditorCode}
						placeName={row.original.placeName}
						projectName={row.original.projectName}
						accountName={row.original.accountName}
					/>
				),
				enableHiding: false
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.status")} />,
				filterFn: getMultiValueFilterFn<AuditActivityRow>(),
				cell: ({ row }) => (
					<Badge
						variant={row.original.status === "SUBMITTED" ? "default" : "secondary"}
						className="font-medium">
						{t(`status.${row.original.status.toLowerCase()}`)}
					</Badge>
				)
			},
			{
				accessorKey: "startedAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("columns.started")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.startedAt, formatT)}
					</span>
				)
			},
			{
				accessorKey: "submittedAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("columns.submitted")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right text-sm text-muted-foreground tabular-nums">
						{formatDateTimeLabel(row.original.submittedAt, formatT)}
					</span>
				)
			},
			{
				accessorKey: "score",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={t("columns.score")} align="end" />
				),
				cell: ({ row }) => (
					<span className="block text-right font-mono text-foreground tabular-nums">
						{formatScoreLabel(row.original.score, formatT)}
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
		[formatT, getRowActions, t]
	);

	const statusOptions = React.useMemo(() => {
		return Array.from(new Set(rows.map(row => row.status))).map(status => ({
			label: status.toLowerCase().replaceAll("_", " "),
			value: status
		}));
	}, [rows]);

	return (
		<DataTable
			title={title ?? t("title")}
			description={description ?? t("description")}
			columns={columns}
			data={rows}
			searchColumnId="search"
			searchPlaceholder={t("searchPlaceholder")}
			filterConfigs={[
				{
					columnId: "status",
					title: t("columns.status"),
					options: statusOptions
				}
			]}
			action={action}
			pageSize={pageSize}
			emptyMessage={emptyMessage ?? t("emptyMessage")}
			initialSorting={[{ id: "submittedAt", desc: true }]}
		/>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { playspaceApi, type AdminPlaceRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";

function formatLocation(city: string | null, province: string | null, country: string | null): string {
	const parts = [city, province, country].filter((part): part is string => Boolean(part && part.trim().length > 0));
	return parts.length > 0 ? parts.join(", ") : "Location pending";
}

export default function AdminPlacesPage() {
	const placesQuery = useQuery({
		queryKey: ["playspace", "admin", "places"],
		queryFn: () => playspaceApi.admin.places()
	});

	if (placesQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (placesQuery.isError || !placesQuery.data) {
		return (
			<EmptyState
				title="Places unavailable"
				description="Refresh this page to retry. If the issue continues, return to the administrator dashboard and reopen places."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const columns: ColumnDef<AdminPlaceRow>[] = [
		{
			id: "place",
			accessorFn: row =>
				`${row.name} ${row.project_name} ${row.account_name} ${formatLocation(row.city, row.province, row.country)}`,
			header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
			cell: ({ row }) => (
				<div className="min-w-[260px] space-y-1">
					<p className="font-medium text-foreground">{row.original.name}</p>
					<p className="text-sm text-muted-foreground">
						{row.original.account_name} · {row.original.project_name}
					</p>
					<p className="text-sm text-muted-foreground">
						{formatLocation(row.original.city, row.original.province, row.original.country)}
					</p>
				</div>
			),
			enableHiding: false
		},
		{
			accessorKey: "audits_completed",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" align="end" />,
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
			header: ({ column }) => <DataTableColumnHeader column={column} title="Latest Audit" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatDateTimeLabel(row.original.last_audited_at)}
				</span>
			)
		}
	];

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="Places"
				description="Cross-account place inventory with aggregate audit throughput."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Places" }]}
			/>
			<DataTable
				title="Place Inventory"
				description="Audit throughput and latest activity across every tracked place."
				columns={columns}
				data={placesQuery.data}
				searchColumnId="place"
				searchPlaceholder="Search places..."
				emptyMessage="No places match the current filters."
				initialSorting={[{ id: "last_audited_at", desc: true }]}
			/>
		</div>
	);
}

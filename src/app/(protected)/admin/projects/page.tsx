"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { playspaceApi, type AdminProjectRow } from "@/lib/api/playspace";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableColumnHeader } from "@/components/dashboard/data-table-column-header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatProjectDateRange, formatScoreLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";

export default function AdminProjectsPage() {
	const projectsQuery = useQuery({
		queryKey: ["playspace", "admin", "projects"],
		queryFn: () => playspaceApi.admin.projects()
	});

	if (projectsQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (projectsQuery.isError || !projectsQuery.data) {
		return (
			<EmptyState
				title="Projects unavailable"
				description="Refresh this page to retry. If the issue continues, return to the administrator dashboard and reopen projects."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const columns: ColumnDef<AdminProjectRow>[] = [
		{
			id: "project",
			accessorFn: row => `${row.name} ${row.account_name}`,
			header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
			cell: ({ row }) => (
				<div className="min-w-[240px] space-y-1">
					<p className="font-medium text-foreground">{row.original.name}</p>
					<p className="text-sm text-muted-foreground">{row.original.account_name}</p>
				</div>
			),
			enableHiding: false
		},
		{
			id: "date_range",
			accessorFn: row => `${row.start_date ?? ""}|${row.end_date ?? ""}`,
			header: ({ column }) => <DataTableColumnHeader column={column} title="Dates" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right text-sm text-muted-foreground tabular-nums">
					{formatProjectDateRange(row.original)}
				</span>
			),
			sortingFn: (leftRow, rightRow) => {
				const leftValue = leftRow.original.start_date ?? leftRow.original.end_date ?? "";
				const rightValue = rightRow.original.start_date ?? rightRow.original.end_date ?? "";
				return leftValue.localeCompare(rightValue);
			}
		},
		{
			accessorKey: "places_count",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Places" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.places_count}</span>
			)
		},
		{
			accessorKey: "auditors_count",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Auditors" align="end" />,
			cell: ({ row }) => (
				<span className="block text-right font-mono tabular-nums">{row.original.auditors_count}</span>
			)
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
		}
	];

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="Projects"
				description="Cross-account project catalog with coverage and output indicators."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Projects" }]}
			/>
			<DataTable
				title="Project Catalog"
				description="Review cross-account project scale, staffing, and scoring at an enterprise level."
				columns={columns}
				data={projectsQuery.data}
				searchColumnId="project"
				searchPlaceholder="Search projects..."
				emptyMessage="No projects match the current filters."
				initialSorting={[{ id: "date_range", desc: true }]}
			/>
		</div>
	);
}

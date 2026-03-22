"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface DataTablePaginationProps<TData> {
	table: Table<TData>;
	pageSizeOptions?: number[];
}

/**
 * Shared pagination footer for dashboard data tables.
 */
export function DataTablePagination<TData>({
	table,
	pageSizeOptions = [10, 20, 50]
}: Readonly<DataTablePaginationProps<TData>>) {
	const totalFilteredRows = table.getFilteredRowModel().rows.length;
	const { pageIndex, pageSize } = table.getState().pagination;
	const startRow = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
	const endRow = totalFilteredRows === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, totalFilteredRows);

	return (
		<div className="flex flex-col gap-4 border-t border-border/70 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
			<div className="text-sm text-muted-foreground">
				Showing {startRow} to {endRow} of {totalFilteredRows} results
			</div>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
				<label className="inline-flex min-w-max items-center gap-3 text-sm text-muted-foreground whitespace-nowrap">
					<span className="whitespace-nowrap">Rows per page</span>
					<select
						value={pageSize}
						onChange={event => table.setPageSize(Number(event.target.value))}
						className="h-9 min-w-20 rounded-field border border-input bg-input px-3 pr-12 text-sm text-foreground shadow-field whitespace-nowrap">
						{pageSizeOptions.map(option => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
				<div className="flex items-center justify-end gap-1.5">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
						aria-label="Go to first page">
						<ChevronsLeftIcon className="size-4" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="Go to previous page">
						<ChevronLeftIcon className="size-4" />
					</Button>
					<div className="min-w-30 text-center text-sm text-muted-foreground tabular-nums">
						Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Go to next page">
						<ChevronRightIcon className="size-4" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
						disabled={!table.getCanNextPage()}
						aria-label="Go to last page">
						<ChevronsRightIcon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

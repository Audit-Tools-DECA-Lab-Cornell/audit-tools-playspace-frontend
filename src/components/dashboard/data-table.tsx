"use client";

import * as React from "react";
import type { ColumnDef, ColumnFiltersState, FilterFn, SortingState, VisibilityState } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar, type DataTableFilterConfig } from "./data-table-toolbar";

export const multiValueFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
	if (!Array.isArray(filterValue) || filterValue.length === 0) {
		return true;
	}

	const cellValue = row.getValue(columnId);
	if (Array.isArray(cellValue)) {
		const normalizedCellValues = new Set(cellValue.map(String));
		return filterValue.some(value => normalizedCellValues.has(String(value)));
	}

	return filterValue.includes(String(cellValue));
};

export function getMultiValueFilterFn<TData>(): FilterFn<TData> {
	return multiValueFilterFn as FilterFn<TData>;
}

export interface DataTableProps<TData, TValue> {
	title?: string;
	description?: string;
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchColumnId?: string;
	searchPlaceholder?: string;
	filterConfigs?: DataTableFilterConfig[];
	action?: React.ReactNode;
	emptyMessage?: string;
	initialSorting?: SortingState;
	pageSize?: number;
}

/**
 * Shared enterprise-style data table used across dashboard entity screens.
 */
export function DataTable<TData, TValue>({
	title,
	description,
	columns,
	data,
	searchColumnId,
	searchPlaceholder,
	filterConfigs = [],
	action,
	emptyMessage = "No results found.",
	initialSorting = [],
	pageSize = 10
}: Readonly<DataTableProps<TData, TValue>>) {
	const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize
	});

	// TanStack Table returns stable instance methods that the React compiler plugin currently flags incorrectly.
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		filterFns: {
			multiValue: multiValueFilterFn
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			pagination
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	return (
		<Card className="overflow-hidden">
			{title || description ? (
				<CardHeader className="gap-1 border-b border-border/70">
					{title ? <CardTitle>{title}</CardTitle> : null}
					{description ? <CardDescription>{description}</CardDescription> : null}
				</CardHeader>
			) : null}
			<DataTableToolbar
				table={table}
				searchColumnId={searchColumnId}
				searchPlaceholder={searchPlaceholder}
				filterConfigs={filterConfigs}
				action={action}
			/>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map(header => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow className="hover:bg-transparent">
								<TableCell
									colSpan={Math.max(1, table.getVisibleLeafColumns().length)}
									className="h-28 text-center text-sm text-muted-foreground">
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
			<DataTablePagination table={table} />
		</Card>
	);
}

"use client";

import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

/**
 * Read a text filter value from TanStack column filter state.
 */
export function getTextColumnFilterValue(
	columnFilters: Readonly<ColumnFiltersState>,
	columnId: string
): string {
	const matchedFilter = columnFilters.find(filter => filter.id === columnId);
	return typeof matchedFilter?.value === "string" ? matchedFilter.value : "";
}

/**
 * Read a multi-select filter value from TanStack column filter state.
 */
export function getMultiValueColumnFilter(
	columnFilters: Readonly<ColumnFiltersState>,
	columnId: string
): string[] {
	const matchedFilter = columnFilters.find(filter => filter.id === columnId);
	if (!Array.isArray(matchedFilter?.value)) {
		return [];
	}

	return matchedFilter.value.filter((value): value is string => typeof value === "string");
}

/**
 * Convert the leading TanStack sort state entry into the backend sort parameter.
 */
export function toBackendSortParam(sorting: Readonly<SortingState>): string | undefined {
	const firstSort = sorting[0];
	if (!firstSort) {
		return undefined;
	}

	return `${firstSort.desc ? "-" : ""}${firstSort.id}`;
}

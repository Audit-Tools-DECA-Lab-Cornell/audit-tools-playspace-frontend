"use client";

import * as React from "react";
import type { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { ListFilterIcon, Loader2Icon, Settings2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export interface DataTableFilterOption {
	label: string;
	value: string;
}

export interface DataTableFilterConfig {
	columnId: string;
	title: string;
	options: DataTableFilterOption[];
}

export interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchColumnId?: string;
	searchPlaceholder?: string;
	filterConfigs?: DataTableFilterConfig[];
	action?: React.ReactNode;
	isFetching?: boolean;
}

function readStringArrayFilterValue(rawValue: unknown): string[] {
	if (!Array.isArray(rawValue)) {
		return [];
	}

	return rawValue.filter((value): value is string => typeof value === "string");
}

function areStringArraysEqual(leftValues: readonly string[], rightValues: readonly string[]): boolean {
	if (leftValues.length !== rightValues.length) {
		return false;
	}

	const leftSet = new Set(leftValues);
	return rightValues.every(value => leftSet.has(value));
}

function humanizeColumnId(columnId: string): string {
	const withSpaces = columnId
		.replaceAll("_", " ")
		.replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
		.trim();
	if (withSpaces.length === 0) {
		return columnId;
	}

	return `${withSpaces.charAt(0).toUpperCase()}${withSpaces.slice(1)}`;
}

function DataTableFilterMenu<TData>({
	config,
	selectedValues,
	onToggleValue
}: Readonly<{
	config: DataTableFilterConfig;
	selectedValues: readonly string[];
	onToggleValue: (columnId: string, optionValue: string, nextChecked: boolean) => void;
}>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" size="sm" className="h-9 gap-2 px-3.5">
					<ListFilterIcon className="size-4" />
					<span>{config.title}</span>
					{selectedValues.length > 0 ? <Badge variant="secondary">{selectedValues.length}</Badge> : null}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel>{config.title}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{config.options.map(option => {
					const isChecked = selectedValues.includes(option.value);

					return (
						<DropdownMenuCheckboxItem
							key={`${config.columnId}_${option.value}`}
							checked={isChecked}
							onCheckedChange={checked => {
								onToggleValue(config.columnId, option.value, Boolean(checked));
							}}>
							{option.label}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Shared table toolbar with search, faceted filters, and column visibility controls.
 */
export function DataTableToolbar<TData>({
	table,
	searchColumnId,
	searchPlaceholder,
	filterConfigs = [],
	action,
	isFetching = false
}: Readonly<DataTableToolbarProps<TData>>) {
	const t = useTranslations("tables.shared.toolbar");
	const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : null;
	const hideableColumns = React.useMemo(() => {
		return table.getAllColumns().filter(column => column.getCanHide());
	}, [table]);
	const tableState = table.getState();
	const committedSearchValue =
		typeof searchColumn?.getFilterValue() === "string" ? (searchColumn.getFilterValue() as string) : "";
	const committedFilterValues = React.useMemo(() => {
		const nextFilterValues: Record<string, string[]> = {};
		for (const config of filterConfigs) {
			const rawFilterValue = table.getColumn(config.columnId)?.getFilterValue();
			nextFilterValues[config.columnId] = readStringArrayFilterValue(rawFilterValue);
		}
		return nextFilterValues;
	}, [filterConfigs, table, tableState.columnFilters]);
	const committedColumnVisibility = React.useMemo(() => {
		const nextVisibilityState: VisibilityState = {};
		for (const column of hideableColumns) {
			nextVisibilityState[column.id] = column.getIsVisible();
		}
		return nextVisibilityState;
	}, [hideableColumns, tableState.columnVisibility]);
	const committedSearchSignature = committedSearchValue.trim();
	const committedFilterSignature = JSON.stringify(committedFilterValues);
	const committedColumnVisibilitySignature = JSON.stringify(committedColumnVisibility);
	const [draftSearchValue, setDraftSearchValue] = React.useState(committedSearchValue);
	const [draftFilterValues, setDraftFilterValues] = React.useState<Record<string, string[]>>(committedFilterValues);
	const [draftColumnVisibility, setDraftColumnVisibility] =
		React.useState<VisibilityState>(committedColumnVisibility);
	const hasActiveFilters = tableState.columnFilters.length > 0;
	const resolvedSearchPlaceholder = searchPlaceholder ?? t("searchPlaceholder");
	const hasPendingSearch = draftSearchValue.trim() !== committedSearchSignature;
	const hasPendingFilters = filterConfigs.some(config => {
		return !areStringArraysEqual(
			draftFilterValues[config.columnId] ?? [],
			committedFilterValues[config.columnId] ?? []
		);
	});
	const hasPendingColumnVisibility = hideableColumns.some(column => {
		return (draftColumnVisibility[column.id] ?? true) !== (committedColumnVisibility[column.id] ?? true);
	});
	const hasPendingChanges = hasPendingSearch || hasPendingFilters || hasPendingColumnVisibility;

	React.useEffect(() => {
		setDraftSearchValue(committedSearchValue);
	}, [committedSearchSignature]);

	React.useEffect(() => {
		setDraftFilterValues(committedFilterValues);
	}, [committedFilterSignature]);

	React.useEffect(() => {
		setDraftColumnVisibility(committedColumnVisibility);
	}, [committedColumnVisibilitySignature]);

	const handleToggleFilterValue = React.useCallback((columnId: string, optionValue: string, nextChecked: boolean) => {
		setDraftFilterValues(currentValue => {
			const currentColumnValues = currentValue[columnId] ?? [];
			const nextValues = nextChecked
				? Array.from(new Set([...currentColumnValues, optionValue]))
				: currentColumnValues.filter(value => value !== optionValue);
			return {
				...currentValue,
				[columnId]: nextValues
			};
		});
	}, []);

	const discardPendingChanges = React.useCallback(() => {
		setDraftSearchValue(committedSearchValue);
		setDraftFilterValues(committedFilterValues);
		setDraftColumnVisibility(committedColumnVisibility);
	}, [committedColumnVisibility, committedFilterValues, committedSearchValue]);

	const applyPendingChanges = React.useCallback(() => {
		const handledColumnIds = new Set(filterConfigs.map(config => config.columnId));
		if (searchColumnId) {
			handledColumnIds.add(searchColumnId);
		}

		const nextColumnFilters: ColumnFiltersState = tableState.columnFilters.filter(filter => {
			return !handledColumnIds.has(filter.id);
		});
		const normalizedSearchValue = draftSearchValue.trim();
		if (searchColumnId && normalizedSearchValue.length > 0) {
			nextColumnFilters.push({
				id: searchColumnId,
				value: normalizedSearchValue
			});
		}

		for (const config of filterConfigs) {
			const nextValues = draftFilterValues[config.columnId] ?? [];
			if (nextValues.length > 0) {
				nextColumnFilters.push({
					id: config.columnId,
					value: nextValues
				});
			}
		}

		table.setColumnFilters(nextColumnFilters);
		table.setColumnVisibility(draftColumnVisibility);
		if (hasPendingSearch || hasPendingFilters) {
			table.setPageIndex(0);
		}
	}, [
		draftColumnVisibility,
		draftFilterValues,
		draftSearchValue,
		filterConfigs,
		hasPendingFilters,
		hasPendingSearch,
		searchColumnId,
		table,
		tableState.columnFilters
	]);

	const resetAppliedFilters = React.useCallback(() => {
		table.resetColumnFilters();
		table.setPageIndex(0);
		setDraftSearchValue("");
		setDraftFilterValues(Object.fromEntries(filterConfigs.map(config => [config.columnId, [] as string[]])));
	}, [filterConfigs, table]);

	const showAllColumns = React.useCallback(() => {
		setDraftColumnVisibility(currentValue => {
			const nextVisibilityState: VisibilityState = { ...currentValue };
			for (const column of hideableColumns) {
				nextVisibilityState[column.id] = true;
			}
			return nextVisibilityState;
		});
	}, [hideableColumns]);

	return (
		<div className="flex flex-col gap-4 border-b border-border/70 px-6 pb-5 lg:justify-between">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				{searchColumn ? (
					<div className="flex flex-1 flex-col gap-2 sm:flex-row">
						<Input
							value={draftSearchValue}
							onChange={event => setDraftSearchValue(event.target.value)}
							onKeyDown={event => {
								if (event.key === "Enter") {
									event.preventDefault();
									applyPendingChanges();
								}
							}}
							placeholder={resolvedSearchPlaceholder}
							className="h-10 w-full"
							aria-label={resolvedSearchPlaceholder}
						/>
						<div className="flex items-center gap-2 sm:justify-end">
							{hasPendingChanges ? (
								<Button type="button" variant="outline" onClick={discardPendingChanges}>
									{t("discard")}
								</Button>
							) : null}
							<Button type="button" onClick={applyPendingChanges} disabled={!hasPendingChanges}>
								{t("apply")}
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-1 items-center gap-2">
						{hasPendingChanges ? (
							<>
								<Button type="button" variant="outline" onClick={discardPendingChanges}>
									{t("discard")}
								</Button>
								<Button type="button" onClick={applyPendingChanges}>
									{t("apply")}
								</Button>
							</>
						) : null}
					</div>
				)}
				<div className="flex items-center gap-2 sm:justify-end">
					{hasPendingChanges ? <Badge variant="secondary">{t("pendingChanges")}</Badge> : null}
					{isFetching ? (
						<Badge variant="outline" className="gap-1.5">
							<Loader2Icon className="size-3.5 animate-spin" />
							{t("updating")}
						</Badge>
					) : null}
				</div>
			</div>
			<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start justify-between">
				<div className="flex flex-col items-start justify-start gap-2">
					<div className="flex flex-wrap flex-row items-center justify-between gap-2 sm:flex-nowrap">
						{filterConfigs.map(config => (
							<DataTableFilterMenu
								key={config.columnId}
								config={config}
								selectedValues={draftFilterValues[config.columnId] ?? []}
								onToggleValue={handleToggleFilterValue}
							/>
						))}
					</div>
					{hasActiveFilters ? (
						<Button type="button" variant="ghost" size="sm" className="gap-2" onClick={resetAppliedFilters}>
							<XIcon className="size-4" />
							<span>{t("reset")}</span>
						</Button>
					) : null}
				</div>
				<div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
					{action}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="outline" size="sm" className="h-9 gap-2 px-3.5">
								<Settings2Icon className="size-4" />
								<span>{t("columns")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							<DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="mx-2 mb-2 justify-start px-2"
								onClick={showAllColumns}>
								{t("showAllColumns")}
							</Button>
							{table
								.getAllColumns()
								.filter(column => column.getCanHide())
								.map(column => (
									<DropdownMenuCheckboxItem
										key={column.id}
										checked={draftColumnVisibility[column.id] ?? column.getIsVisible()}
										onCheckedChange={checked => {
											setDraftColumnVisibility(currentValue => ({
												...currentValue,
												[column.id]: Boolean(checked)
											}));
										}}>
										{humanizeColumnId(column.id)}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}

"use client";

import type { Table } from "@tanstack/react-table";
import { ListFilterIcon, Settings2Icon, XIcon } from "lucide-react";
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
}

function DataTableFilterMenu<TData>({
	table,
	config
}: Readonly<{
	table: Table<TData>;
	config: DataTableFilterConfig;
}>) {
	const column = table.getColumn(config.columnId);
	if (!column) {
		return null;
	}

	const rawFilterValue = column.getFilterValue();
	const selectedValues = Array.isArray(rawFilterValue)
		? rawFilterValue.filter((value): value is string => typeof value === "string")
		: [];

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
								const nextValue = checked
									? [...selectedValues, option.value]
									: selectedValues.filter(value => value !== option.value);
								column.setFilterValue(nextValue.length > 0 ? nextValue : undefined);
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
	action
}: Readonly<DataTableToolbarProps<TData>>) {
	const t = useTranslations("tables.shared.toolbar");
	const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : null;
	const searchValue =
		typeof searchColumn?.getFilterValue() === "string" ? (searchColumn.getFilterValue() as string) : "";
	const hasActiveFilters = table.getState().columnFilters.length > 0;
	const resolvedSearchPlaceholder = searchPlaceholder ?? t("searchPlaceholder");

	return (
		<div className="flex flex-col gap-4 border-b border-border/70 px-6 pb-5 lg:justify-between">
			{searchColumn ? (
				<Input
					value={searchValue}
					onChange={event => searchColumn.setFilterValue(event.target.value)}
					placeholder={resolvedSearchPlaceholder}
					className="h-10 w-full"
					aria-label={resolvedSearchPlaceholder}
				/>
			) : null}
			<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start justify-between">
				<div className="flex flex-col items-start justify-start gap-2">
					<div className="flex flex-wrap flex-row items-center justify-between gap-2 sm:flex-nowrap">
						{filterConfigs.map(config => (
							<DataTableFilterMenu key={config.columnId} table={table} config={config} />
						))}
					</div>
					{hasActiveFilters ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="gap-2"
							onClick={() => table.resetColumnFilters()}>
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
							{table
								.getAllColumns()
								.filter(column => column.getCanHide())
								.map(column => (
									<DropdownMenuCheckboxItem
										key={column.id}
										checked={column.getIsVisible()}
										onCheckedChange={checked => column.toggleVisibility(Boolean(checked))}>
										{column.id.replaceAll("_", " ")}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

		</div>
	);
}

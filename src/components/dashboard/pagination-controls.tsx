import { Button } from "@/components/ui/button";

export interface PaginationControlsProps {
	currentPage: number;
	pageCount: number;
	totalItems: number;
	pageSize: number;
	itemLabel: string;
	onPageChange: (nextPage: number) => void;
}

/**
 * Compact pagination footer shared across long dashboard lists.
 */
export function PaginationControls({
	currentPage,
	pageCount,
	totalItems,
	pageSize,
	itemLabel,
	onPageChange
}: Readonly<PaginationControlsProps>) {
	if (pageCount <= 1) {
		return null;
	}

	const rangeStart = (currentPage - 1) * pageSize + 1;
	const rangeEnd = Math.min(currentPage * pageSize, totalItems);

	return (
		<div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-sm text-muted-foreground">
				Showing {rangeStart}-{rangeEnd} of {totalItems} {itemLabel}
			</p>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={currentPage <= 1}
					onClick={() => {
						onPageChange(currentPage - 1);
					}}>
					Previous
				</Button>
				<p className="min-w-24 text-center text-sm text-muted-foreground tabular-nums">
					Page {currentPage} of {pageCount}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={currentPage >= pageCount}
					onClick={() => {
						onPageChange(currentPage + 1);
					}}>
					Next
				</Button>
			</div>
		</div>
	);
}

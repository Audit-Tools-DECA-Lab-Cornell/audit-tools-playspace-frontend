import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Manager-area streaming fallback.
 */
export default function ManagerLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={4} />
			<TableSkeleton />
		</div>
	);
}

import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Admin-area streaming fallback.
 */
export default function AdminLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={6} />
			<TableSkeleton />
		</div>
	);
}

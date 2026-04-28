import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Auditor-area streaming fallback.
 */
export default function AuditorLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={5} />
			<TableSkeleton />
		</div>
	);
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAuditorAssignedPlaces, getServerAuditorDashboardSummary } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AuditorDashboardClient } from "./dashboard-client";

export default async function AuditorDashboardPage() {
	const queryClient = getQueryClient();

	await Promise.all([
		queryClient
			.prefetchQuery({
				queryKey: ["playspace", "auditor", "dashboardSummary"],
				queryFn: () => getServerAuditorDashboardSummary()
			})
			.catch(() => undefined),
		queryClient
			.prefetchQuery({
				queryKey: ["playspace", "auditor", "assignedPlaces", "dashboard"],
				queryFn: () => getServerAuditorAssignedPlaces({ page: 1, pageSize: 100 })
			})
			.catch(() => undefined)
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AuditorDashboardClient />
		</HydrationBoundary>
	);
}

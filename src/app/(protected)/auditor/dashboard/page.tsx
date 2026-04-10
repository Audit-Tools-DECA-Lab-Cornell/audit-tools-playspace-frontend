import { getServerAuditorDashboardData } from "@/lib/api/server-playspace-dashboard";

import { AuditorDashboardClient } from "./dashboard-client";

export default async function AuditorDashboardPage() {
	let dashboardData: Awaited<ReturnType<typeof getServerAuditorDashboardData>> | null = null;
	let errorMessage: string | null = null;

	try {
		dashboardData = await getServerAuditorDashboardData();
	} catch (error) {
		errorMessage = error instanceof Error ? error.message : "Unable to load auditor dashboard.";
	}

	return <AuditorDashboardClient {...(dashboardData ?? {})} errorMessage={errorMessage} />;
}
 

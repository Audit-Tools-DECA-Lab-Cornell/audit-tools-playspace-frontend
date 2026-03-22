import { getServerAdminDashboardData } from "@/lib/api/server-playspace-dashboard";

import { AdminDashboardClient } from "./dashboard-client";

export default async function AdminDashboardPage() {
	let dashboardData: Awaited<ReturnType<typeof getServerAdminDashboardData>> | null = null;
	let errorMessage: string | null = null;

	try {
		dashboardData = await getServerAdminDashboardData();
	} catch (error) {
		errorMessage = error instanceof Error ? error.message : "Unable to load admin dashboard.";
	}

	return <AdminDashboardClient {...(dashboardData ?? {})} errorMessage={errorMessage} />;
}

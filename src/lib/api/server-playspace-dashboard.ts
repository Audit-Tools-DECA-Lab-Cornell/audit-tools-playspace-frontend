import {
	accountDetailSchema,
	adminAuditRowSchema,
	adminOverviewSchema,
	auditorDashboardSummarySchema,
	auditorPlaceSchema,
	auditorSummarySchema,
	managerProfileSchema,
	paginatedResponseSchema,
	projectSummarySchema,
	type AccountDetail,
	type AdminAuditRow,
	type AdminOverview,
	type AuditorDashboardSummary,
	type AuditorPlace,
	type AuditorSummary,
	type ManagerProfile,
	type ProjectSummary
} from "@/lib/api/playspace-types";
import { fetchServerJson } from "@/lib/api/playspace-server";
import { z } from "zod";

export type ServerManagerDashboardData = Readonly<{
	account: AccountDetail;
	managerProfiles: ManagerProfile[];
	projects: ProjectSummary[];
	auditors: AuditorSummary[];
}>;

export type ServerAdminDashboardData = Readonly<{
	overview: AdminOverview;
	latestAudits: AdminAuditRow[];
}>;

export type ServerAuditorDashboardData = Readonly<{
	summary: AuditorDashboardSummary;
	places: AuditorPlace[];
}>;

/**
 * Fetch the manager dashboard payloads on the server so the page can render
 * without a client-side request waterfall.
 */
export async function getServerManagerDashboardData(accountId: string): Promise<ServerManagerDashboardData> {
	const [account, managerProfiles, projects, auditors] = await Promise.all([
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}`, accountDetailSchema),
		fetchServerJson(
			`/playspace/accounts/${encodeURIComponent(accountId)}/manager-profiles`,
			z.array(managerProfileSchema)
		),
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}/projects`, z.array(projectSummarySchema)),
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}/auditors`, z.array(auditorSummarySchema))
	]);

	return { account, managerProfiles, projects, auditors };
}

/**
 * Fetch the admin dashboard payloads on the server so the page can render its
 * overview immediately.
 */
export async function getServerAdminDashboardData(): Promise<ServerAdminDashboardData> {
	const [overview, auditsPage] = await Promise.all([
		fetchServerJson("/playspace/admin/overview", adminOverviewSchema),
		fetchServerJson(
			"/playspace/admin/audits?page=1&page_size=5&sort=-submitted_at",
			paginatedResponseSchema(adminAuditRowSchema)
		)
	]);

	return { overview, latestAudits: auditsPage.items };
}

/**
 * Fetch the auditor dashboard payloads on the server so the page can render
 * without a client-side request waterfall.
 */
export async function getServerAuditorDashboardData(): Promise<ServerAuditorDashboardData> {
	const [summary, placesPage] = await Promise.all([
		fetchServerJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchServerJson(
			"/playspace/auditor/me/places?page=1&page_size=5&sort=place_name",
			paginatedResponseSchema(auditorPlaceSchema)
		)
	]);

	return { summary, places: placesPage.items };
}

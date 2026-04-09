import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";

const accountTypeSchema = z.enum(["ADMIN", "MANAGER", "AUDITOR"]);
const projectStatusSchema = z.enum(["planned", "active", "completed"]);
const auditStatusSchema = z.enum(["IN_PROGRESS", "PAUSED", "SUBMITTED"]);

const managerProfileSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	full_name: z.string(),
	email: z.string().email(),
	phone: z.string().nullable(),
	position: z.string().nullable(),
	organization: z.string().nullable(),
	is_primary: z.boolean(),
	created_at: z.string().datetime()
});

const accountStatsSchema = z.object({
	total_projects: z.number().int().nonnegative(),
	total_places: z.number().int().nonnegative(),
	total_auditors: z.number().int().nonnegative(),
	total_audits_completed: z.number().int().nonnegative()
});

const recentActivitySchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	completed_at: z.string().datetime(),
	score: z.number().nullable()
});

const accountDetailSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	account_type: accountTypeSchema,
	created_at: z.string().datetime(),
	primary_manager: managerProfileSchema.nullable(),
	stats: accountStatsSchema,
	recent_activity: z.array(recentActivitySchema)
});

const projectSummarySchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	name: z.string(),
	overview: z.string().nullable(),
	place_types: z.array(z.string()),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	status: projectStatusSchema,
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable()
});

const auditorSummarySchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	auditor_code: z.string(),
	full_name: z.string(),
	email: z.string().email().nullable(),
	age_range: z.string().nullable(),
	gender: z.string().nullable(),
	country: z.string().nullable(),
	role: z.string().nullable(),
	assignments_count: z.number().int().nonnegative(),
	completed_audits: z.number().int().nonnegative(),
	last_active_at: z.string().datetime().nullable()
});

const adminOverviewSchema = z.object({
	total_accounts: z.number().int().nonnegative(),
	total_projects: z.number().int().nonnegative(),
	total_places: z.number().int().nonnegative(),
	total_auditors: z.number().int().nonnegative(),
	total_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative()
});

const adminAuditRowSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	status: auditStatusSchema,
	account_id: z.string().uuid(),
	account_name: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	auditor_code: z.string(),
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable()
});

function paginatedResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
	return z.object({
		items: z.array(itemSchema),
		total_count: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		page_size: z.number().int().positive(),
		total_pages: z.number().int().positive()
	});
}

function getServerApiBaseUrl(): string {
	const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
		return configuredBaseUrl;
	}

	return "http://127.0.0.1:8000";
}

function getErrorMessage(payload: unknown, fallbackMessage: string): string {
	if (typeof payload === "string" && payload.trim().length > 0) {
		return payload;
	}

	if (typeof payload === "object" && payload !== null && "detail" in payload) {
		const detail = payload.detail;
		if (typeof detail === "string" && detail.trim().length > 0) {
			return detail;
		}
	}

	return fallbackMessage;
}

async function fetchServerValidatedJson<TValue>(path: string, schema: z.ZodType<TValue>): Promise<TValue> {
	const session = await getServerAuthSession();
	if (!session) {
		throw new Error("Authenticated session required.");
	}

	const response = await fetch(`${getServerApiBaseUrl()}${path}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${session.accessToken}`
		},
		cache: "no-store"
	});

	if (!response.ok) {
		const errorPayload: unknown = await response.json().catch(() => null);
		throw new Error(getErrorMessage(errorPayload, `GET ${path} request failed.`));
	}

	const payload: unknown = await response.json();
	return schema.parse(payload);
}

export type ServerManagerDashboardData = Readonly<{
	account: z.infer<typeof accountDetailSchema>;
	managerProfiles: z.infer<typeof managerProfileSchema>[];
	projects: z.infer<typeof projectSummarySchema>[];
	auditors: z.infer<typeof auditorSummarySchema>[];
}>;

export type ServerAdminDashboardData = Readonly<{
	overview: z.infer<typeof adminOverviewSchema>;
	latestAudits: z.infer<typeof adminAuditRowSchema>[];
}>;

/**
 * Fetch the manager dashboard payloads on the server so the page can render without a client-side request waterfall.
 */
export async function getServerManagerDashboardData(accountId: string): Promise<ServerManagerDashboardData> {
	const [account, managerProfiles, projects, auditors] = await Promise.all([
		fetchServerValidatedJson(`/playspace/accounts/${encodeURIComponent(accountId)}`, accountDetailSchema),
		fetchServerValidatedJson(
			`/playspace/accounts/${encodeURIComponent(accountId)}/manager-profiles`,
			z.array(managerProfileSchema)
		),
		fetchServerValidatedJson(
			`/playspace/accounts/${encodeURIComponent(accountId)}/projects`,
			z.array(projectSummarySchema)
		),
		fetchServerValidatedJson(
			`/playspace/accounts/${encodeURIComponent(accountId)}/auditors`,
			z.array(auditorSummarySchema)
		)
	]);

	return {
		account,
		managerProfiles,
		projects,
		auditors
	};
}

/**
 * Fetch the admin dashboard payloads on the server so the page can render its overview immediately.
 */
export async function getServerAdminDashboardData(): Promise<ServerAdminDashboardData> {
	const [overview, auditsPage] = await Promise.all([
		fetchServerValidatedJson("/playspace/admin/overview", adminOverviewSchema),
		fetchServerValidatedJson(
			"/playspace/admin/audits?page=1&page_size=5&sort=-submitted_at",
			paginatedResponseSchema(adminAuditRowSchema)
		)
	]);

	return {
		overview,
		latestAudits: auditsPage.items
	};
}

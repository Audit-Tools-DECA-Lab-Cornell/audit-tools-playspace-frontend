import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { executionModeSchema } from "@/types/audit";

const accountTypeSchema = z.enum(["ADMIN", "MANAGER", "AUDITOR"]);
const projectStatusSchema = z.enum(["planned", "active", "completed"]);
const auditStatusSchema = z.enum(["IN_PROGRESS", "PAUSED", "SUBMITTED"]);
const playspaceTypeSchema = z.enum([
	"Public Playspace",
	"Pre-School Playspace",
	"Destination Playspace",
	"Nature Playspace",
	"Neighborhood Playspace",
	"Waterfront Playspace",
	"School Playspace"
]);
const placeAxisStatusSchema = z.enum(["not_started", "in_progress", "submitted", "complete"]);
const scorePairSchema = z.object({
	pv: z.number(),
	u: z.number()
});

const managerProfileSchema = z.object({
	id: z.uuid(),
	account_id: z.uuid(),
	full_name: z.string(),
	email: z.email(),
	phone: z.string().nullable(),
	position: z.string().nullable(),
	organization: z.string().nullable(),
	is_primary: z.boolean(),
	created_at: z.iso.datetime()
});

const accountStatsSchema = z.object({
	total_projects: z.number().int().nonnegative(),
	total_places: z.number().int().nonnegative(),
	total_auditors: z.number().int().nonnegative(),
	total_audits_completed: z.number().int().nonnegative()
});

const recentActivitySchema = z.object({
	audit_id: z.uuid(),
	audit_code: z.string(),
	project_id: z.uuid(),
	project_name: z.string(),
	place_id: z.uuid(),
	place_name: z.string(),
	completed_at: z.string().datetime(),
	score: z.number().nullable(),
	score_pair: scorePairSchema.nullable().optional().default(null)
});

const accountDetailSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.string().email(),
	account_type: accountTypeSchema,
	created_at: z.string().datetime(),
	primary_manager: managerProfileSchema.nullable(),
	stats: accountStatsSchema,
	recent_activity: z.array(recentActivitySchema)
});

const projectSummarySchema = z.object({
	id: z.uuid(),
	account_id: z.uuid(),
	name: z.string(),
	overview: z.string().nullable(),
	place_types: z.array(playspaceTypeSchema),
	start_date: z.iso.date().nullable(),
	end_date: z.iso.date().nullable(),
	status: projectStatusSchema,
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	average_scores: scorePairSchema.nullable().optional().default(null)
});

const auditorSummarySchema = z.object({
	id: z.uuid(),
	account_id: z.uuid(),
	auditor_code: z.string(),
	full_name: z.string(),
	email: z.email().nullable(),
	age_range: z.string().nullable(),
	gender: z.string().nullable(),
	country: z.string().nullable(),
	role: z.string().nullable(),
	assignments_count: z.number().int().nonnegative(),
	completed_audits: z.number().int().nonnegative(),
	last_active_at: z.iso.datetime().nullable()
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
	audit_id: z.uuid(),
	audit_code: z.string(),
	status: auditStatusSchema,
	account_id: z.uuid(),
	account_name: z.string(),
	project_id: z.uuid(),
	project_name: z.string(),
	place_id: z.uuid(),
	place_name: z.string(),
	auditor_code: z.string(),
	started_at: z.iso.datetime(),
	submitted_at: z.iso.datetime().nullable(),
	summary_score: z.number().nullable(),
	score_pair: scorePairSchema.nullable().optional().default(null)
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

const auditorPlaceSchema = z.object({
	place_id: z.uuid(),
	place_name: z.string(),
	place_type: playspaceTypeSchema.nullable(),
	project_id: z.uuid(),
	project_name: z.string(),
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	audit_id: z.uuid().nullable(),
	started_at: z.iso.datetime().nullable(),
	submitted_at: z.iso.datetime().nullable(),
	summary_score: z.number().nullable(),
	score_totals: z
		.object({
			provision_total: z.number(),
			provision_total_max: z.number(),
			diversity_total: z.number(),
			diversity_total_max: z.number(),
			challenge_total: z.number(),
			challenge_total_max: z.number(),
			sociability_total: z.number(),
			sociability_total_max: z.number(),
			play_value_total: z.number(),
			play_value_total_max: z.number(),
			usability_total: z.number(),
			usability_total_max: z.number()
		})
		.nullable(),
	progress_percent: z.number().nullable(),
	selected_execution_mode: executionModeSchema.nullable().optional().default(null),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	audit_scores: scorePairSchema.nullable().optional().default(null),
	survey_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const auditorDashboardSummarySchema = z.object({
	total_assigned_places: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	pending_places: z.number().int().nonnegative(),
	average_submitted_score: z.number().nullable()
});

export type ServerAuditorDashboardData = Readonly<{
	summary: z.infer<typeof auditorDashboardSummarySchema>;
	places: z.infer<typeof auditorPlaceSchema>[];
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

/**
 * Fetch the auditor dashboard payloads on the server so the page can render without a client-side request waterfall.
 */
export async function getServerAuditorDashboardData(): Promise<ServerAuditorDashboardData> {
	const [summary, placesPage] = await Promise.all([
		fetchServerValidatedJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchServerValidatedJson(
			"/playspace/auditor/me/places?page=1&page_size=5&sort=place_name",
			paginatedResponseSchema(auditorPlaceSchema)
		)
	]);

	return {
		summary,
		places: placesPage.items
	};
}

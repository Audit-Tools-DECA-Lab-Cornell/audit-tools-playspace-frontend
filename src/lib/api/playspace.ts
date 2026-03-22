"use client";

import { isAxiosError } from "axios";
import { z } from "zod";
import { api } from "@/lib/api/api-client";

const accountTypeSchema = z.enum(["ADMIN", "MANAGER", "AUDITOR"]);
const projectStatusSchema = z.enum(["planned", "active", "completed"]);
const placeStatusSchema = z.enum(["not_started", "in_progress", "submitted"]);
const auditStatusSchema = z.enum(["IN_PROGRESS", "PAUSED", "SUBMITTED"]);
const assignmentRoleSchema = z.enum(["auditor", "place_admin"]);
const executionModeSchema = z.enum(["audit", "survey", "both"]);

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

const projectDetailSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	name: z.string(),
	overview: z.string().nullable(),
	place_types: z.array(z.string()),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	est_places: z.number().int().nonnegative().nullable(),
	est_auditors: z.number().int().nonnegative().nullable(),
	auditor_description: z.string().nullable(),
	created_at: z.string().datetime()
});

const projectStatsSchema = z.object({
	project_id: z.string().uuid(),
	places_count: z.number().int().nonnegative(),
	places_with_audits: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
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

const placeSummarySchema = z.object({
	id: z.string().uuid(),
	project_id: z.string().uuid(),
	name: z.string(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	place_type: z.string().nullable(),
	status: placeStatusSchema,
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable()
});

const scoreTotalsSchema = z.object({
	quantity_total: z.number(),
	diversity_total: z.number(),
	challenge_total: z.number(),
	sociability_total: z.number(),
	play_value_total: z.number(),
	usability_total: z.number()
});

const placeAuditHistoryItemSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	auditor_code: z.string(),
	status: auditStatusSchema,
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable()
});

const placeHistorySchema = z.object({
	place_id: z.string().uuid(),
	place_name: z.string(),
	project_id: z.string().uuid(),
	total_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
	average_submitted_score: z.number().nullable(),
	latest_submitted_at: z.string().datetime().nullable(),
	audits: z.array(placeAuditHistoryItemSchema)
});

const assignmentSchema = z.object({
	id: z.string().uuid(),
	auditor_profile_id: z.string().uuid(),
	project_id: z.string().uuid().nullable(),
	place_id: z.string().uuid().nullable(),
	audit_roles: z.array(assignmentRoleSchema),
	assigned_at: z.string().datetime()
});

const assignmentWriteSchema = z.object({
	project_id: z.string().uuid().nullable().optional(),
	place_id: z.string().uuid().nullable().optional(),
	audit_roles: z.array(assignmentRoleSchema).min(1)
});

const placeDetailSchema = z.object({
	id: z.string().uuid(),
	project_id: z.string().uuid(),
	name: z.string(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	place_type: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	est_auditors: z.number().int().nullable(),
	auditor_description: z.string().nullable(),
	created_at: z.string().datetime()
});

const accountManagementResponseSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email_masked: z.string().nullable(),
	account_type: accountTypeSchema,
	created_at: z.string().datetime()
});

const accountUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional()
});

const auditorProfileDetailSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	auditor_code: z.string(),
	email_masked: z.string().nullable(),
	age_range: z.string().nullable(),
	gender: z.string().nullable(),
	country: z.string().nullable(),
	role: z.string().nullable(),
	created_at: z.string().datetime()
});

const projectCreateRequestSchema = z.object({
	account_id: z.string().uuid().nullable().optional(),
	name: z.string().min(1),
	overview: z.string().nullable().optional(),
	place_types: z.array(z.string()).default([]),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_places: z.number().int().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const projectUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	overview: z.string().nullable().optional(),
	place_types: z.array(z.string()).optional(),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_places: z.number().int().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const placeCreateRequestSchema = z.object({
	project_id: z.string().uuid(),
	name: z.string().min(1),
	city: z.string().nullable().optional(),
	province: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	place_type: z.string().nullable().optional(),
	lat: z.number().nullable().optional(),
	lng: z.number().nullable().optional(),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const placeUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	city: z.string().nullable().optional(),
	province: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	place_type: z.string().nullable().optional(),
	lat: z.number().nullable().optional(),
	lng: z.number().nullable().optional(),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const auditorCreateRequestSchema = z.object({
	email: z.string().email(),
	full_name: z.string().min(1),
	auditor_code: z.string().min(1),
	age_range: z.string().nullable().optional(),
	gender: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	role: z.string().nullable().optional()
});

const auditorUpdateRequestSchema = z.object({
	email: z.string().email().nullable().optional(),
	full_name: z.string().nullable().optional(),
	auditor_code: z.string().nullable().optional(),
	age_range: z.string().nullable().optional(),
	gender: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	role: z.string().nullable().optional()
});

const auditorPlaceSchema = z.object({
	place_id: z.string().uuid(),
	place_name: z.string(),
	place_type: z.string().nullable(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	assignment_roles: z.array(assignmentRoleSchema),
	audit_status: auditStatusSchema.nullable(),
	audit_id: z.string().uuid().nullable(),
	started_at: z.string().datetime().nullable(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	score_totals: scoreTotalsSchema.nullable(),
	progress_percent: z.number().nullable()
});

const auditorAuditSummarySchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	status: auditStatusSchema,
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	score_totals: scoreTotalsSchema.nullable(),
	progress_percent: z.number().nullable()
});

const auditorDashboardSummarySchema = z.object({
	total_assigned_places: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	pending_places: z.number().int().nonnegative(),
	average_submitted_score: z.number().nullable()
});

const auditMetaSchema = z.object({
	execution_mode: executionModeSchema.nullable()
});

const auditPreAuditSchema = z.object({
	season: z.string().nullable(),
	weather_conditions: z.array(z.string()),
	users_present: z.array(z.string()),
	user_count: z.string().nullable(),
	age_groups: z.array(z.string()),
	place_size: z.string().nullable()
});

const auditSectionStateSchema = z.object({
	section_key: z.string(),
	responses: z.record(z.string(), z.record(z.string(), z.string())),
	note: z.string().nullable()
});

const auditSectionProgressSchema = z.object({
	section_key: z.string(),
	title: z.string(),
	visible_question_count: z.number().int().nonnegative(),
	answered_question_count: z.number().int().nonnegative(),
	is_complete: z.boolean()
});

const auditProgressSchema = z.object({
	required_pre_audit_complete: z.boolean(),
	visible_section_count: z.number().int().nonnegative(),
	completed_section_count: z.number().int().nonnegative(),
	total_visible_questions: z.number().int().nonnegative(),
	answered_visible_questions: z.number().int().nonnegative(),
	ready_to_submit: z.boolean(),
	sections: z.array(auditSectionProgressSchema)
});

const auditScoresSchema = z.object({
	draft_progress_percent: z.number().nullable(),
	execution_mode: executionModeSchema.nullable(),
	overall: scoreTotalsSchema.nullable(),
	by_section: z.record(z.string(), scoreTotalsSchema),
	by_domain: z.record(z.string(), scoreTotalsSchema)
});

const auditSessionSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	place_type: z.string().nullable(),
	assignment_roles: z.array(assignmentRoleSchema),
	allowed_execution_modes: z.array(executionModeSchema),
	selected_execution_mode: executionModeSchema.nullable(),
	status: auditStatusSchema,
	instrument_key: z.string(),
	instrument_version: z.string(),
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	total_minutes: z.number().int().nullable(),
	meta: auditMetaSchema,
	pre_audit: auditPreAuditSchema,
	sections: z.record(z.string(), auditSectionStateSchema),
	scores: auditScoresSchema,
	progress: auditProgressSchema
});

const auditDraftPatchSchema = z.object({
	meta: z
		.object({
			execution_mode: executionModeSchema.nullable().optional()
		})
		.nullable()
		.optional(),
	pre_audit: z
		.object({
			season: z.string().nullable().optional(),
			weather_conditions: z.array(z.string()).optional(),
			users_present: z.array(z.string()).optional(),
			user_count: z.string().nullable().optional(),
			age_groups: z.array(z.string()).optional(),
			place_size: z.string().nullable().optional()
		})
		.nullable()
		.optional(),
	sections: z
		.record(
			z.string(),
			z.object({
				responses: z.record(z.string(), z.record(z.string(), z.string())).default({}),
				note: z.string().nullable().optional()
			})
		)
		.default({})
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

const adminAccountRowSchema = z.object({
	account_id: z.string().uuid(),
	name: z.string(),
	account_type: accountTypeSchema,
	email_masked: z.string().nullable(),
	created_at: z.string().datetime(),
	projects_count: z.number().int().nonnegative(),
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative()
});

const adminProjectRowSchema = z.object({
	project_id: z.string().uuid(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	name: z.string(),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable()
});

const adminPlaceRowSchema = z.object({
	place_id: z.string().uuid(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	name: z.string(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable()
});

const adminAuditorRowSchema = z.object({
	auditor_profile_id: z.string().uuid(),
	account_id: z.string().uuid(),
	auditor_code: z.string(),
	email_masked: z.string().nullable(),
	assignments_count: z.number().int().nonnegative(),
	completed_audits: z.number().int().nonnegative(),
	last_active_at: z.string().datetime().nullable()
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

const adminSystemSchema = z.object({
	instrument_key: z.string(),
	instrument_name: z.string(),
	instrument_version: z.string(),
	generated_at: z.string().datetime()
});

export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type AccountDetail = z.infer<typeof accountDetailSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type AuditorSummary = z.infer<typeof auditorSummarySchema>;
export type PlaceSummary = z.infer<typeof placeSummarySchema>;
export type PlaceAuditHistoryItem = z.infer<typeof placeAuditHistoryItemSchema>;
export type PlaceHistory = z.infer<typeof placeHistorySchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentWrite = z.infer<typeof assignmentWriteSchema>;
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
export type AccountManagementResponse = z.infer<typeof accountManagementResponseSchema>;
export type AuditorProfileDetail = z.infer<typeof auditorProfileDetailSchema>;
export type AuditorPlace = z.infer<typeof auditorPlaceSchema>;
export type AuditorAuditSummary = z.infer<typeof auditorAuditSummarySchema>;
export type AuditorDashboardSummary = z.infer<typeof auditorDashboardSummarySchema>;
export type AuditSession = z.infer<typeof auditSessionSchema>;
export type AuditDraftPatch = z.infer<typeof auditDraftPatchSchema>;
export type AdminOverview = z.infer<typeof adminOverviewSchema>;
export type AdminAccountRow = z.infer<typeof adminAccountRowSchema>;
export type AdminProjectRow = z.infer<typeof adminProjectRowSchema>;
export type AdminPlaceRow = z.infer<typeof adminPlaceRowSchema>;
export type AdminAuditorRow = z.infer<typeof adminAuditorRowSchema>;
export type AdminAuditRow = z.infer<typeof adminAuditRowSchema>;
export type AdminSystem = z.infer<typeof adminSystemSchema>;

/**
 * Structured error for API failures and validation issues.
 */
export class PlayspaceApiError extends Error {
	public readonly status: number;

	public constructor(message: string, status: number) {
		super(message);
		this.name = "PlayspaceApiError";
		this.status = status;
	}
}

/**
 * Convert a non-OK response payload into a readable error message.
 */
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

/**
 * Convert a RequestInit-style body into Axios request data.
 */
function normalizeRequestBody(body: BodyInit | null | undefined): unknown {
	if (body == null) {
		return undefined;
	}

	if (typeof body === "string") {
		if (body.trim().length === 0) {
			return undefined;
		}

		try {
			return JSON.parse(body) as unknown;
		} catch {
			return body;
		}
	}

	return body;
}

/**
 * Build a default error message from a failed request config.
 */
function getRequestFallbackMessage(method: string | undefined, path: string): string {
	const normalizedMethod = method?.trim().toUpperCase() ?? "GET";
	return `${normalizedMethod} ${path} request failed.`;
}

/**
 * Normalize unknown thrown values into PlayspaceApiError.
 */
function toPlayspaceApiError(
	error: unknown,
	fallbackMethod: string | undefined,
	fallbackPath: string
): PlayspaceApiError {
	if (error instanceof PlayspaceApiError) {
		return error;
	}

	if (isAxiosError(error)) {
		const status = error.response?.status ?? 0;
		const fallbackMessage = getRequestFallbackMessage(fallbackMethod, fallbackPath);
		return new PlayspaceApiError(getErrorMessage(error.response?.data, fallbackMessage), status);
	}

	if (error instanceof Error) {
		return new PlayspaceApiError(error.message, 0);
	}

	return new PlayspaceApiError(getRequestFallbackMessage(fallbackMethod, fallbackPath), 0);
}

/**
 * Fetch JSON from the backend and validate the shape at runtime.
 */
async function fetchValidatedJson<TValue>(
	path: string,
	schema: z.ZodType<TValue>,
	init?: RequestInit
): Promise<TValue> {
	try {
		const response = await api.request({
			url: path,
			method: init?.method,
			data: normalizeRequestBody(init?.body),
			headers: {
				Accept: "application/json"
			}
		});

		try {
			return schema.parse(response.data);
		} catch {
			throw new PlayspaceApiError("The server returned an unexpected response shape.", response.status);
		}
	} catch (error) {
		throw toPlayspaceApiError(error, init?.method, path);
	}
}

/**
 * Execute one request that should return no JSON payload.
 */
async function fetchNoContent(path: string, init: RequestInit): Promise<void> {
	try {
		await api.request({
			url: path,
			method: init.method,
			data: normalizeRequestBody(init.body),
			headers: {
				Accept: "application/json"
			}
		});
	} catch (error) {
		throw toPlayspaceApiError(error, init.method, path);
	}
}

/**
 * Playspace dashboard API surface used by the web app.
 */
export const playspaceApi = {
	accounts: {
		get: async (accountId: string): Promise<AccountDetail> =>
			fetchValidatedJson(`/playspace/accounts/${encodeURIComponent(accountId)}`, accountDetailSchema),
		managerProfiles: async (accountId: string): Promise<ManagerProfile[]> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/manager-profiles`,
				z.array(managerProfileSchema)
			),
		projects: async (accountId: string): Promise<ProjectSummary[]> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/projects`,
				z.array(projectSummarySchema)
			),
		auditors: async (accountId: string): Promise<AuditorSummary[]> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/auditors`,
				z.array(auditorSummarySchema)
			)
	},
	projects: {
		get: async (projectId: string): Promise<ProjectDetail> =>
			fetchValidatedJson(`/playspace/projects/${encodeURIComponent(projectId)}`, projectDetailSchema),
		stats: async (projectId: string): Promise<ProjectStats> =>
			fetchValidatedJson(`/playspace/projects/${encodeURIComponent(projectId)}/stats`, projectStatsSchema),
		places: async (projectId: string): Promise<PlaceSummary[]> =>
			fetchValidatedJson(
				`/playspace/projects/${encodeURIComponent(projectId)}/places`,
				z.array(placeSummarySchema)
			)
	},
	places: {
		audits: async (placeId: string): Promise<PlaceAuditHistoryItem[]> =>
			fetchValidatedJson(
				`/playspace/places/${encodeURIComponent(placeId)}/audits`,
				z.array(placeAuditHistoryItemSchema)
			),
		history: async (placeId: string): Promise<PlaceHistory> =>
			fetchValidatedJson(`/playspace/places/${encodeURIComponent(placeId)}/history`, placeHistorySchema)
	},
	assignments: {
		list: async (auditorProfileId: string): Promise<Assignment[]> =>
			fetchValidatedJson(
				`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}/assignments`,
				z.array(assignmentSchema)
			),
		create: async (auditorProfileId: string, payload: AssignmentWrite): Promise<Assignment> => {
			const parsedPayload = assignmentWriteSchema.parse(payload);
			return fetchValidatedJson(
				`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}/assignments`,
				assignmentSchema,
				{
					method: "POST",
					body: JSON.stringify(parsedPayload)
				}
			);
		},
		update: async (
			auditorProfileId: string,
			assignmentId: string,
			payload: AssignmentWrite
		): Promise<Assignment> => {
			const parsedPayload = assignmentWriteSchema.parse(payload);
			return fetchValidatedJson(
				`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}/assignments/${encodeURIComponent(assignmentId)}`,
				assignmentSchema,
				{
					method: "PATCH",
					body: JSON.stringify(parsedPayload)
				}
			);
		},
		delete: async (auditorProfileId: string, assignmentId: string): Promise<void> =>
			fetchNoContent(
				`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}/assignments/${encodeURIComponent(assignmentId)}`,
				{
					method: "DELETE"
				}
			)
	},
	auditor: {
		assignedPlaces: async (): Promise<AuditorPlace[]> =>
			fetchValidatedJson("/playspace/auditor/me/places", z.array(auditorPlaceSchema)),
		audits: async (statusFilter?: "submitted" | "in_progress" | "paused"): Promise<AuditorAuditSummary[]> => {
			const querySuffix = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
			return fetchValidatedJson(`/playspace/auditor/me/audits${querySuffix}`, z.array(auditorAuditSummarySchema));
		},
		dashboardSummary: async (): Promise<AuditorDashboardSummary> =>
			fetchValidatedJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		createOrResumeAudit: async (
			placeId: string,
			executionMode?: "audit" | "survey" | "both"
		): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/places/${encodeURIComponent(placeId)}/audits/access`, auditSessionSchema, {
				method: "POST",
				body: JSON.stringify({
					execution_mode: executionMode ?? null
				})
			}),
		getAudit: async (auditId: string): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}`, auditSessionSchema),
		patchAuditDraft: async (auditId: string, patch: AuditDraftPatch): Promise<AuditSession> => {
			const parsedPatch = auditDraftPatchSchema.parse(patch);
			return fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}/draft`, auditSessionSchema, {
				method: "PATCH",
				body: JSON.stringify(parsedPatch)
			});
		},
		submitAudit: async (auditId: string): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}/submit`, auditSessionSchema, {
				method: "POST",
				body: JSON.stringify({})
			})
	},
	management: {
		accounts: {
			update: async (
				accountId: string,
				payload: z.infer<typeof accountUpdateRequestSchema>
			): Promise<AccountManagementResponse> => {
				const parsedPayload = accountUpdateRequestSchema.parse(payload);
				return fetchValidatedJson(
					`/playspace/accounts/${encodeURIComponent(accountId)}`,
					accountManagementResponseSchema,
					{
						method: "PATCH",
						body: JSON.stringify(parsedPayload)
					}
				);
			}
		},
		projects: {
			create: async (payload: z.infer<typeof projectCreateRequestSchema>): Promise<ProjectDetail> => {
				const parsedPayload = projectCreateRequestSchema.parse(payload);
				return fetchValidatedJson("/playspace/projects", projectDetailSchema, {
					method: "POST",
					body: JSON.stringify(parsedPayload)
				});
			},
			update: async (
				projectId: string,
				payload: z.infer<typeof projectUpdateRequestSchema>
			): Promise<ProjectDetail> => {
				const parsedPayload = projectUpdateRequestSchema.parse(payload);
				return fetchValidatedJson(`/playspace/projects/${encodeURIComponent(projectId)}`, projectDetailSchema, {
					method: "PATCH",
					body: JSON.stringify(parsedPayload)
				});
			},
			delete: async (projectId: string): Promise<void> =>
				fetchNoContent(`/playspace/projects/${encodeURIComponent(projectId)}`, {
					method: "DELETE"
				})
		},
		places: {
			create: async (payload: z.infer<typeof placeCreateRequestSchema>): Promise<PlaceDetail> => {
				const parsedPayload = placeCreateRequestSchema.parse(payload);
				return fetchValidatedJson("/playspace/places", placeDetailSchema, {
					method: "POST",
					body: JSON.stringify(parsedPayload)
				});
			},
			update: async (
				placeId: string,
				payload: z.infer<typeof placeUpdateRequestSchema>
			): Promise<PlaceDetail> => {
				const parsedPayload = placeUpdateRequestSchema.parse(payload);
				return fetchValidatedJson(`/playspace/places/${encodeURIComponent(placeId)}`, placeDetailSchema, {
					method: "PATCH",
					body: JSON.stringify(parsedPayload)
				});
			},
			delete: async (placeId: string): Promise<void> =>
				fetchNoContent(`/playspace/places/${encodeURIComponent(placeId)}`, {
					method: "DELETE"
				})
		},
		auditors: {
			create: async (payload: z.infer<typeof auditorCreateRequestSchema>): Promise<AuditorProfileDetail> => {
				const parsedPayload = auditorCreateRequestSchema.parse(payload);
				return fetchValidatedJson("/playspace/auditor-profiles", auditorProfileDetailSchema, {
					method: "POST",
					body: JSON.stringify(parsedPayload)
				});
			},
			update: async (
				auditorProfileId: string,
				payload: z.infer<typeof auditorUpdateRequestSchema>
			): Promise<AuditorProfileDetail> => {
				const parsedPayload = auditorUpdateRequestSchema.parse(payload);
				return fetchValidatedJson(
					`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}`,
					auditorProfileDetailSchema,
					{
						method: "PATCH",
						body: JSON.stringify(parsedPayload)
					}
				);
			},
			delete: async (auditorProfileId: string): Promise<void> =>
				fetchNoContent(`/playspace/auditor-profiles/${encodeURIComponent(auditorProfileId)}`, {
					method: "DELETE"
				})
		}
	},
	admin: {
		overview: async (): Promise<AdminOverview> =>
			fetchValidatedJson("/playspace/admin/overview", adminOverviewSchema),
		accounts: async (): Promise<AdminAccountRow[]> =>
			fetchValidatedJson("/playspace/admin/accounts", z.array(adminAccountRowSchema)),
		projects: async (): Promise<AdminProjectRow[]> =>
			fetchValidatedJson("/playspace/admin/projects", z.array(adminProjectRowSchema)),
		places: async (): Promise<AdminPlaceRow[]> =>
			fetchValidatedJson("/playspace/admin/places", z.array(adminPlaceRowSchema)),
		auditors: async (): Promise<AdminAuditorRow[]> =>
			fetchValidatedJson("/playspace/admin/auditors", z.array(adminAuditorRowSchema)),
		audits: async (): Promise<AdminAuditRow[]> =>
			fetchValidatedJson("/playspace/admin/audits", z.array(adminAuditRowSchema)),
		system: async (): Promise<AdminSystem> => fetchValidatedJson("/playspace/admin/system", adminSystemSchema)
	}
};

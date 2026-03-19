"use client";

import { z } from "zod";

/**
 * Stable demo account used while real auth/account selection is still in flight.
 */
export const PLAYSPACE_DEMO_ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";

const accountTypeSchema = z.enum(["MANAGER", "AUDITOR"]);
const projectStatusSchema = z.enum(["planned", "active", "completed"]);
const placeStatusSchema = z.enum(["not_started", "in_progress", "submitted"]);
const auditorSignupRequestStateSchema = z.enum(["pending", "approved", "declined"]);

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

const auditorSignupRequestSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	manager_email: z.string().email(),
	full_name: z.string(),
	email: z.string().email(),
	note: z.string().nullable(),
	status: auditorSignupRequestStateSchema,
	requested_at: z.string().datetime(),
	reviewed_at: z.string().datetime().nullable(),
	assigned_project_id: z.string().uuid().nullable(),
	assigned_place_id: z.string().uuid().nullable()
});

const approvedAuditorSchema = z.object({
	auditor_account_id: z.string().uuid(),
	auditor_profile_id: z.string().uuid(),
	auditor_code: z.string(),
	full_name: z.string(),
	assigned_project_id: z.string().uuid().nullable(),
	assigned_project_name: z.string().nullable(),
	assigned_place_id: z.string().uuid().nullable(),
	assigned_place_name: z.string().nullable()
});

const auditorSignupApprovalSchema = z.object({
	request: auditorSignupRequestSchema,
	approved_auditor: approvedAuditorSchema
});

const auditorCodeLoginSchema = z.object({
	account_id: z.string().uuid(),
	auditor_profile_id: z.string().uuid(),
	auditor_code: z.string()
});

export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type AccountDetail = z.infer<typeof accountDetailSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type AuditorSummary = z.infer<typeof auditorSummarySchema>;
export type PlaceSummary = z.infer<typeof placeSummarySchema>;
export type AuditorSignupRequest = z.infer<typeof auditorSignupRequestSchema>;
export type ApprovedAuditor = z.infer<typeof approvedAuditorSchema>;
export type AuditorSignupApproval = z.infer<typeof auditorSignupApprovalSchema>;
export type AuditorCodeLogin = z.infer<typeof auditorCodeLoginSchema>;

/**
 * Public payload for requesting auditor access from the login screen.
 */
export interface CreateAuditorSignupRequestInput {
	managerEmail: string;
	fullName: string;
	email: string;
	note: string;
}

/**
 * Manager payload for approving a request with a required assignment.
 */
export interface ApproveAuditorSignupRequestInput {
	projectId?: string;
	placeId?: string;
}

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
 * Resolve the backend base URL without depending on secret env variables.
 */
function getBaseUrl(): string {
	const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
		return configuredBaseUrl.trim().replace(/\/$/, "");
	}

	return "http://127.0.0.1:8000";
}

/**
 * Read a response body safely and preserve either JSON or plain text errors.
 */
async function readResponseBody(response: Response): Promise<unknown> {
	const rawText = await response.text();
	if (rawText.length === 0) {
		return null;
	}

	try {
		const parsedBody: unknown = JSON.parse(rawText);
		return parsedBody;
	} catch {
		return rawText;
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
 * Fetch JSON from the backend and validate the shape at runtime.
 */
async function fetchValidatedJson<TValue>(
	path: string,
	schema: z.ZodType<TValue>,
	init?: RequestInit
): Promise<TValue> {
	const requestHeaders = new Headers(init?.headers);
	requestHeaders.set("Accept", "application/json");

	if (init?.body) {
		requestHeaders.set("Content-Type", "application/json");
	}

	const response = await fetch(`${getBaseUrl()}${path}`, {
		...init,
		headers: requestHeaders,
		credentials: "include"
	});

	const payload = await readResponseBody(response);
	if (!response.ok) {
		throw new PlayspaceApiError(
			getErrorMessage(payload, `Request failed with status ${response.status}.`),
			response.status
		);
	}

	try {
		return schema.parse(payload);
	} catch {
		throw new PlayspaceApiError("The server returned an unexpected response shape.", response.status);
	}
}

/**
 * Playspace dashboard API surface used by the web app.
 */
export const playspaceApi = {
	auth: {
		loginWithAuditorCode: async (auditorCode: string): Promise<AuditorCodeLogin> =>
			fetchValidatedJson("/playspace/auditor-code-login", auditorCodeLoginSchema, {
				method: "POST",
				body: JSON.stringify({
					auditor_code: auditorCode
				})
			}),
		requestAuditorAccess: async (input: CreateAuditorSignupRequestInput): Promise<AuditorSignupRequest> =>
			fetchValidatedJson("/playspace/auditor-signup-requests", auditorSignupRequestSchema, {
				method: "POST",
				body: JSON.stringify({
					manager_email: input.managerEmail,
					full_name: input.fullName,
					email: input.email,
					note: input.note
				})
			})
	},
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
			),
		auditorSignupRequests: async (accountId: string): Promise<AuditorSignupRequest[]> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/auditor-signup-requests`,
				z.array(auditorSignupRequestSchema)
			),
		approveAuditorSignupRequest: async (
			accountId: string,
			requestId: string,
			input: ApproveAuditorSignupRequestInput
		): Promise<AuditorSignupApproval> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/auditor-signup-requests/${encodeURIComponent(requestId)}/approve`,
				auditorSignupApprovalSchema,
				{
					method: "POST",
					body: JSON.stringify({
						project_id: input.projectId ?? null,
						place_id: input.placeId ?? null
					})
				}
			),
		declineAuditorSignupRequest: async (accountId: string, requestId: string): Promise<AuditorSignupRequest> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/auditor-signup-requests/${encodeURIComponent(requestId)}/decline`,
				auditorSignupRequestSchema,
				{
					method: "POST"
				}
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
	}
};

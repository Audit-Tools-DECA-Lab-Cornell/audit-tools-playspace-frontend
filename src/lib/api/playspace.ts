"use client";

import { isAxiosError } from "axios";
import { z } from "zod";
import { api } from "@/lib/api/api-client";
import { playspaceInstrumentSchema, type PlayspaceInstrument } from "@/types/audit";

const accountTypeSchema = z.enum(["ADMIN", "MANAGER", "AUDITOR"]);
const projectStatusSchema = z.enum(["planned", "active", "completed"]);
const placeStatusSchema = z.enum(["not_started", "in_progress", "submitted"]);
const auditStatusSchema = z.enum(["IN_PROGRESS", "PAUSED", "SUBMITTED"]);
const executionModeSchema = z.enum(["audit", "survey", "both"]);
/** Per-axis place coverage; API may also send legacy `complete` for fully covered axes. */
const placeAxisStatusSchema = z.enum(["not_started", "in_progress", "submitted", "complete"]);
const playspaceTypeSchema = z.enum([
	"Public Playspace",
	"Pre-School Playspace",
	"Destination Playspace",
	"Nature Playspace",
	"Neighborhood Playspace",
	"Waterfront Playspace",
	"School Playspace"
]);

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

const scorePairSchema = z.object({
	pv: z.number(),
	u: z.number()
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
	score: z.number().nullable(),
	score_pair: scorePairSchema.nullable().optional().default(null)
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
	place_types: z.array(playspaceTypeSchema).optional().default([]),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	status: projectStatusSchema,
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	average_scores: scorePairSchema.nullable().optional().default(null)
});

const projectDetailSchema = z.object({
	id: z.string().uuid(),
	account_id: z.string().uuid(),
	name: z.string(),
	overview: z.string().nullable(),
	place_types: z.array(playspaceTypeSchema).optional().default([]),
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
	average_score: z.number().nullable(),
	average_scores: scorePairSchema.nullable().optional().default(null)
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
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	place_type: playspaceTypeSchema.nullable(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable(),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	place_audit_count: z.number().int().nonnegative().optional().default(0),
	place_survey_count: z.number().int().nonnegative().optional().default(0),
	audit_mean_scores: scorePairSchema.nullable().optional().default(null),
	survey_mean_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const scoreTotalsSchema = z.object({
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
});

const placeAuditHistoryItemSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	auditor_code: z.string(),
	status: auditStatusSchema,
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	execution_mode: executionModeSchema.nullable().optional().default(null),
	score_pair: scorePairSchema.nullable().optional().default(null)
});

const placeHistorySchema = z.object({
	place_id: z.string().uuid(),
	place_name: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	total_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
	average_submitted_score: z.number().nullable(),
	latest_submitted_at: z.string().datetime().nullable(),
	audits: z.array(placeAuditHistoryItemSchema),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	place_audit_count: z.number().int().nonnegative().optional().default(0),
	place_survey_count: z.number().int().nonnegative().optional().default(0),
	audit_mean_scores: scorePairSchema.nullable().optional().default(null),
	survey_mean_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const managerPlacesSummarySchema = z.object({
	total_places: z.number().int().nonnegative(),
	submitted_places: z.number().int().nonnegative(),
	in_progress_places: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	completed_place_audits: z.number().int().nonnegative().optional().default(0),
	completed_place_surveys: z.number().int().nonnegative().optional().default(0),
	audit_mean_scores: scorePairSchema.nullable().optional().default(null),
	survey_mean_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const managerPlaceRowSchema = z.object({
	id: z.string().uuid(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	name: z.string(),
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	place_type: playspaceTypeSchema.nullable(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable(),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	place_audit_count: z.number().int().nonnegative().optional().default(0),
	place_survey_count: z.number().int().nonnegative().optional().default(0),
	audit_mean_scores: scorePairSchema.nullable().optional().default(null),
	survey_mean_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const managerPlacesListSchema = z.object({
	items: z.array(managerPlaceRowSchema),
	total_count: z.number().int().nonnegative(),
	page: z.number().int().positive(),
	page_size: z.number().int().positive(),
	total_pages: z.number().int().positive(),
	summary: managerPlacesSummarySchema
});

const managerAuditsSummarySchema = z.object({
	total_audits: z.number().int().nonnegative(),
	submitted_audits: z.number().int().nonnegative(),
	in_progress_audits: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	average_scores: scorePairSchema.nullable().optional().default(null)
});

const managerAuditRowSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	status: auditStatusSchema,
	auditor_code: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	execution_mode: executionModeSchema.nullable().optional().default(null),
	score_pair: scorePairSchema.nullable().optional().default(null)
});

const managerAuditsListSchema = z.object({
	items: z.array(managerAuditRowSchema),
	total_count: z.number().int().nonnegative(),
	page: z.number().int().positive(),
	page_size: z.number().int().positive(),
	total_pages: z.number().int().positive(),
	summary: managerAuditsSummarySchema
});

const assignmentSchema = z.object({
	id: z.string().uuid(),
	auditor_profile_id: z.string().uuid(),
	project_id: z.string().uuid(),
	place_id: z.string().uuid(),
	scope_type: z.literal("place"),
	scope_id: z.string().uuid(),
	scope_name: z.string(),
	project_name: z.string(),
	place_name: z.string(),
	assigned_at: z.string().datetime()
});

const assignmentWriteSchema = z.object({
	project_id: z.string().uuid(),
	place_id: z.string().uuid()
});

const bulkAssignmentWriteSchema = z.object({
	project_id: z.string().uuid(),
	auditor_profile_ids: z.array(z.string().uuid()),
	place_ids: z.array(z.string().uuid())
});

const placeDetailSchema = z.object({
	id: z.string().uuid(),
	project_ids: z.array(z.string().uuid()),
	project_names: z.array(z.string()),
	name: z.string(),
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	place_type: playspaceTypeSchema.nullable(),
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
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_places: z.number().int().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const projectUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	overview: z.string().nullable().optional(),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_places: z.number().int().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const placeCreateRequestSchema = z.object({
	project_ids: z.array(z.string().uuid()).min(1),
	name: z.string().min(1),
	address: z.string().nullable().optional(),
	postal_code: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	province: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	place_type: playspaceTypeSchema.nullable().optional(),
	lat: z.number().nullable().optional(),
	lng: z.number().nullable().optional(),
	start_date: z.string().date().nullable().optional(),
	end_date: z.string().date().nullable().optional(),
	est_auditors: z.number().int().nullable().optional(),
	auditor_description: z.string().nullable().optional()
});

const placeUpdateRequestSchema = z.object({
	project_ids: z.array(z.string().uuid()).optional(),
	name: z.string().min(1).optional(),
	address: z.string().nullable().optional(),
	postal_code: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	province: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	place_type: playspaceTypeSchema.nullable().optional(),
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
	place_type: playspaceTypeSchema.nullable(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	status: auditStatusSchema.nullable(),
	audit_id: z.string().uuid().nullable(),
	started_at: z.string().datetime().nullable(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	score_totals: scoreTotalsSchema.nullable(),
	progress_percent: z.number().nullable(),
	selected_execution_mode: executionModeSchema.nullable().optional().default(null),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	audit_scores: scorePairSchema.nullable().optional().default(null),
	survey_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
});

const auditorAuditSummarySchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	status: auditStatusSchema,
	execution_mode: executionModeSchema.nullable().optional().default(null),
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
	place_size: z.string().nullable(),
	current_users_0_5: z.string().nullable(),
	current_users_6_12: z.string().nullable(),
	current_users_13_17: z.string().nullable(),
	current_users_18_plus: z.string().nullable(),
	playspace_busyness: z.string().nullable(),
	season: z.string().nullable(),
	weather_conditions: z.array(z.string()),
	wind_conditions: z.string().nullable()
});

const questionResponseValueSchema = z.union([
	z.string(),
	z.array(z.string()),
	z.record(z.string(), z.string()),
	z.null()
]);

const questionResponsePayloadSchema = z.record(z.string(), questionResponseValueSchema);

const auditSectionStateSchema = z.object({
	section_key: z.string(),
	responses: z.record(z.string(), questionResponsePayloadSchema),
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
	audit: scoreTotalsSchema.nullable().optional().default(null),
	survey: scoreTotalsSchema.nullable().optional().default(null),
	overall: scoreTotalsSchema.nullable(),
	by_section: z.record(z.string(), scoreTotalsSchema),
	by_domain: z.record(z.string(), scoreTotalsSchema)
});

const auditAggregateSchema = z.object({
	schema_version: z.number().int().positive(),
	revision: z.number().int().nonnegative(),
	meta: auditMetaSchema,
	pre_audit: auditPreAuditSchema,
	sections: z.record(z.string(), auditSectionStateSchema)
});

const auditSessionSchema = z
	.object({
		audit_id: z.string().uuid(),
		audit_code: z.string(),
		auditor_code: z.string(),
		project_id: z.string().uuid(),
		project_name: z.string(),
		place_id: z.string().uuid(),
		place_name: z.string(),
		place_type: playspaceTypeSchema.nullable(),
		allowed_execution_modes: z.array(executionModeSchema),
		selected_execution_mode: executionModeSchema.nullable(),
		status: auditStatusSchema,
		instrument_key: z.string(),
		instrument_version: z.string(),
		instrument: playspaceInstrumentSchema.optional(),
		schema_version: z.number().int().positive().optional().default(1),
		revision: z.number().int().nonnegative().optional().default(0),
		aggregate: auditAggregateSchema.optional(),
		started_at: z.string().datetime(),
		submitted_at: z.string().datetime().nullable(),
		total_minutes: z.number().int().nullable(),
		meta: auditMetaSchema,
		pre_audit: auditPreAuditSchema,
		sections: z.record(z.string(), auditSectionStateSchema),
		scores: auditScoresSchema,
		progress: auditProgressSchema
	})
	.transform(value => {
		const aggregate = value.aggregate ?? {
			schema_version: value.schema_version,
			revision: value.revision,
			meta: value.meta,
			pre_audit: value.pre_audit,
			sections: value.sections
		};

		return {
			...value,
			schema_version: aggregate.schema_version,
			revision: aggregate.revision,
			aggregate
		};
	});

const auditAggregateWriteSchema = z.object({
	schema_version: z.number().int().positive().optional(),
	meta: z
		.object({
			execution_mode: executionModeSchema.nullable().optional()
		})
		.nullable()
		.optional(),
	pre_audit: z
		.object({
			place_size: z.string().nullable().optional(),
			current_users_0_5: z.string().nullable().optional(),
			current_users_6_12: z.string().nullable().optional(),
			current_users_13_17: z.string().nullable().optional(),
			current_users_18_plus: z.string().nullable().optional(),
			playspace_busyness: z.string().nullable().optional(),
			season: z.string().nullable().optional(),
			weather_conditions: z.array(z.string()).optional(),
			wind_conditions: z.string().nullable().optional()
		})
		.nullable()
		.optional(),
	sections: z
		.record(
			z.string(),
			z.object({
				responses: z.record(z.string(), questionResponsePayloadSchema).default({}),
				note: z.string().nullable().optional()
			})
		)
		.default({})
});

const auditDraftPatchSchema = z.object({
	expected_revision: z.number().int().nonnegative().optional(),
	aggregate: auditAggregateWriteSchema.nullable().optional(),
	meta: z
		.object({
			execution_mode: executionModeSchema.nullable().optional()
		})
		.nullable()
		.optional(),
	pre_audit: z
		.object({
			place_size: z.string().nullable().optional(),
			current_users_0_5: z.string().nullable().optional(),
			current_users_6_12: z.string().nullable().optional(),
			current_users_13_17: z.string().nullable().optional(),
			current_users_18_plus: z.string().nullable().optional(),
			playspace_busyness: z.string().nullable().optional(),
			season: z.string().nullable().optional(),
			weather_conditions: z.array(z.string()).optional(),
			wind_conditions: z.string().nullable().optional()
		})
		.nullable()
		.optional(),
	sections: z
		.record(
			z.string(),
			z.object({
				responses: z.record(z.string(), questionResponsePayloadSchema).default({}),
				note: z.string().nullable().optional()
			})
		)
		.default({})
});

const auditDraftSaveSchema = z.object({
	audit_id: z.string().uuid(),
	status: auditStatusSchema,
	schema_version: z.number().int().positive(),
	revision: z.number().int().nonnegative(),
	draft_progress_percent: z.number().nullable(),
	saved_at: z.string().datetime()
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
	average_score: z.number().nullable(),
	average_scores: scorePairSchema.nullable().optional().default(null)
});

const adminPlaceRowSchema = z.object({
	place_id: z.string().uuid(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	name: z.string(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	audits_completed: z.number().int().nonnegative(),
	average_score: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable(),
	place_audit_status: placeAxisStatusSchema.optional().default("not_started"),
	place_survey_status: placeAxisStatusSchema.optional().default("not_started"),
	place_audit_count: z.number().int().nonnegative().optional().default(0),
	place_survey_count: z.number().int().nonnegative().optional().default(0),
	audit_mean_scores: scorePairSchema.nullable().optional().default(null),
	survey_mean_scores: scorePairSchema.nullable().optional().default(null),
	overall_scores: scorePairSchema.nullable().optional().default(null)
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
	summary_score: z.number().nullable(),
	execution_mode: executionModeSchema.nullable().optional().default(null),
	score_pair: scorePairSchema.nullable().optional().default(null)
});

const instrumentContentSchema = z.object({
	en: playspaceInstrumentSchema,
	de: playspaceInstrumentSchema.nullable().optional(),
	hi: playspaceInstrumentSchema.nullable().optional()
});

const adminSystemSchema = z.object({
	instrument_key: z.string(),
	instrument_name: z.string(),
	instrument_version: z.string(),
	generated_at: z.string().datetime(),
	instrument: instrumentContentSchema
});

const adminProjectExportRecordSchema = z.object({
	project_id: z.string().uuid(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	name: z.string(),
	overview: z.string().nullable(),
	start_date: z.string().date().nullable(),
	end_date: z.string().date().nullable(),
	place_types: z.array(z.string()),
	places_count: z.number().int().nonnegative(),
	auditors_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	average_pv_score: z.number().nullable(),
	average_u_score: z.number().nullable()
});

const adminProjectsExportResponseSchema = z.object({
	entity: z.literal("projects"),
	generated_at: z.string().datetime(),
	record_count: z.number().int().nonnegative(),
	records: z.array(adminProjectExportRecordSchema)
});

const adminPlaceExportRecordSchema = z.object({
	place_id: z.string().uuid(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	name: z.string(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	province: z.string().nullable(),
	country: z.string().nullable(),
	postal_code: z.string().nullable(),
	place_type: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	place_audit_status: z.string(),
	place_survey_status: z.string(),
	place_audit_count: z.number().int().nonnegative(),
	place_survey_count: z.number().int().nonnegative(),
	audits_completed: z.number().int().nonnegative(),
	audit_mean_pv: z.number().nullable(),
	audit_mean_u: z.number().nullable(),
	survey_mean_pv: z.number().nullable(),
	survey_mean_u: z.number().nullable(),
	last_audited_at: z.string().datetime().nullable()
});

const adminPlacesExportResponseSchema = z.object({
	entity: z.literal("places"),
	generated_at: z.string().datetime(),
	record_count: z.number().int().nonnegative(),
	records: z.array(adminPlaceExportRecordSchema)
});

const adminAuditExportRecordSchema = z.object({
	audit_id: z.string().uuid(),
	audit_code: z.string(),
	status: auditStatusSchema,
	execution_mode: executionModeSchema.nullable().optional(),
	account_id: z.string().uuid(),
	account_name: z.string(),
	project_id: z.string().uuid(),
	project_name: z.string(),
	place_id: z.string().uuid(),
	place_name: z.string(),
	auditor_code: z.string(),
	started_at: z.string().datetime(),
	submitted_at: z.string().datetime().nullable(),
	summary_score: z.number().nullable(),
	audit_pv_score: z.number().nullable(),
	audit_u_score: z.number().nullable(),
	survey_pv_score: z.number().nullable(),
	survey_u_score: z.number().nullable()
});

const adminAuditsExportResponseSchema = z.object({
	entity: z.string(),
	generated_at: z.string().datetime(),
	record_count: z.number().int().nonnegative(),
	records: z.array(adminAuditExportRecordSchema)
});

const instrumentResponseSchema = z.object({
	id: z.string().uuid(),
	instrument_key: z.string(),
	instrument_version: z.string(),
	is_active: z.boolean(),
	content: instrumentContentSchema,
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

const instrumentCreateRequestSchema = z.object({
	instrument_key: z.string().min(1),
	instrument_version: z.string().min(1),
	content: instrumentContentSchema
});

const instrumentUpdateRequestSchema = z.object({
	is_active: z.boolean().optional()
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

export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type AccountDetail = z.infer<typeof accountDetailSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type AuditorSummary = z.infer<typeof auditorSummarySchema>;
export type PlaceSummary = z.infer<typeof placeSummarySchema>;
export type PlayspaceType = z.infer<typeof playspaceTypeSchema>;
export type PlaceAuditHistoryItem = z.infer<typeof placeAuditHistoryItemSchema>;
export type PlaceHistory = z.infer<typeof placeHistorySchema>;
export type ManagerPlacesSummary = z.infer<typeof managerPlacesSummarySchema>;
export type ManagerPlaceRow = z.infer<typeof managerPlaceRowSchema>;
export type ManagerPlacesList = z.infer<typeof managerPlacesListSchema>;
export type ManagerAuditsSummary = z.infer<typeof managerAuditsSummarySchema>;
export type ManagerAuditRow = z.infer<typeof managerAuditRowSchema>;
export type ManagerAuditsList = z.infer<typeof managerAuditsListSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentWrite = z.infer<typeof assignmentWriteSchema>;
export type BulkAssignmentWrite = z.infer<typeof bulkAssignmentWriteSchema>;
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
export type AccountManagementResponse = z.infer<typeof accountManagementResponseSchema>;
export type AuditorProfileDetail = z.infer<typeof auditorProfileDetailSchema>;
export type AuditorPlace = z.infer<typeof auditorPlaceSchema>;
export type AuditorAuditSummary = z.infer<typeof auditorAuditSummarySchema>;
export type AuditorDashboardSummary = z.infer<typeof auditorDashboardSummarySchema>;
export type AuditSession = z.infer<typeof auditSessionSchema>;
export type AuditDraftPatch = z.infer<typeof auditDraftPatchSchema>;
export type AuditDraftSave = z.infer<typeof auditDraftSaveSchema>;
export type AdminOverview = z.infer<typeof adminOverviewSchema>;
export type AdminAccountRow = z.infer<typeof adminAccountRowSchema>;
export type AdminProjectRow = z.infer<typeof adminProjectRowSchema>;
export type AdminPlaceRow = z.infer<typeof adminPlaceRowSchema>;
export type AdminAuditorRow = z.infer<typeof adminAuditorRowSchema>;
export type AdminAuditRow = z.infer<typeof adminAuditRowSchema>;
export type AdminSystem = z.infer<typeof adminSystemSchema>;
export type AdminProjectExportRecord = z.infer<typeof adminProjectExportRecordSchema>;
export type AdminProjectsExportResponse = z.infer<typeof adminProjectsExportResponseSchema>;
export type AdminPlaceExportRecord = z.infer<typeof adminPlaceExportRecordSchema>;
export type AdminPlacesExportResponse = z.infer<typeof adminPlacesExportResponseSchema>;
export type AdminAuditExportRecord = z.infer<typeof adminAuditExportRecordSchema>;
export type AdminAuditsExportResponse = z.infer<typeof adminAuditsExportResponseSchema>;
export type PaginatedResponse<TItem> = {
	items: TItem[];
	total_count: number;
	page: number;
	page_size: number;
	total_pages: number;
};

export interface ManagerPlacesQuery {
	page?: number;
	pageSize?: number;
	search?: string;
	sort?: string;
	projectIds?: readonly string[];
	auditorIds?: readonly string[];
	auditStatuses?: readonly string[];
	surveyStatuses?: readonly string[];
}

export interface ManagerAuditsQuery {
	page?: number;
	pageSize?: number;
	search?: string;
	sort?: string;
	projectIds?: readonly string[];
	auditorIds?: readonly string[];
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
}

export interface PaginatedListQuery {
	page?: number;
	pageSize?: number;
	search?: string;
	sort?: string;
}

export interface AuditorPlacesQuery extends PaginatedListQuery {
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED" | "not_started">;
}

export interface AuditorAuditsQuery extends PaginatedListQuery {
	statuses?: Array<"submitted" | "in_progress" | "paused">;
}

export interface AdminAccountsQuery extends PaginatedListQuery {
	accountTypes?: Array<"ADMIN" | "MANAGER" | "AUDITOR">;
}

export interface AdminPlacesQuery extends PaginatedListQuery {
	projectIds?: readonly string[];
	accountIds?: readonly string[];
	auditStatuses?: readonly string[];
	surveyStatuses?: readonly string[];
}

export interface AdminAuditorsQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
}

export interface AdminProjectsQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
}

export interface AdminAuditsQuery extends PaginatedListQuery {
	projectIds?: readonly string[];
	accountIds?: readonly string[];
	auditorIds?: readonly string[];
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
}

export interface AdminExportQuery {
	search?: string;
	accountIds?: readonly string[];
	projectIds?: readonly string[];
	auditStatuses?: readonly string[];
	surveyStatuses?: readonly string[];
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
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
		} catch (error) {
			console.log("Error:", error);
			console.error("The server returned an unexpected response shape.", response.data);
			console.error("The expected response shape is:", schema.describe("The expected response shape."));
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

type QueryValue = number | string | readonly string[] | undefined | null;

/**
 * Build a stable query string for list endpoints with repeated filter params.
 */
function buildQueryString(params: Readonly<Record<string, QueryValue>>): string {
	const searchParams = new URLSearchParams();

	for (const [key, rawValue] of Object.entries(params)) {
		if (rawValue == null) {
			continue;
		}

		if (Array.isArray(rawValue)) {
			for (const value of rawValue) {
				const normalizedValue = value.trim();
				if (normalizedValue.length > 0) {
					searchParams.append(key, normalizedValue);
				}
			}
			continue;
		}

		if (typeof rawValue === "number") {
			searchParams.set(key, String(rawValue));
			continue;
		}

		const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;
		if (typeof normalizedValue === "string" && normalizedValue.length > 0) {
			searchParams.set(key, normalizedValue);
		}
	}

	const query = searchParams.toString();
	return query.length > 0 ? `?${query}` : "";
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
			),
		places: async (accountId: string, query: ManagerPlacesQuery = {}): Promise<ManagerPlacesList> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/places${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					project_id: query.projectIds,
					auditor_id: query.auditorIds,
					audit_status: query.auditStatuses,
					survey_status: query.surveyStatuses
				})}`,
				managerPlacesListSchema
			),
		audits: async (accountId: string, query: ManagerAuditsQuery = {}): Promise<ManagerAuditsList> =>
			fetchValidatedJson(
				`/playspace/accounts/${encodeURIComponent(accountId)}/audits${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					project_id: query.projectIds,
					auditor_id: query.auditorIds,
					status: query.statuses
				})}`,
				managerAuditsListSchema
			),
		auditDetail: async (auditId: string): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}`, auditSessionSchema)
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
		audits: async (placeId: string, projectId: string): Promise<PlaceAuditHistoryItem[]> =>
			fetchValidatedJson(
				`/playspace/places/${encodeURIComponent(placeId)}/audits${buildQueryString({ project_id: projectId })}`,
				z.array(placeAuditHistoryItemSchema)
			),
		history: async (placeId: string, projectId: string): Promise<PlaceHistory> =>
			fetchValidatedJson(
				`/playspace/places/${encodeURIComponent(placeId)}/history${buildQueryString({ project_id: projectId })}`,
				placeHistorySchema
			)
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
			),
		bulkCreate: async (payload: BulkAssignmentWrite): Promise<{ created_count: number }> => {
			const parsedPayload = bulkAssignmentWriteSchema.parse(payload);
			return fetchValidatedJson("/playspace/bulk-assignments", z.object({ created_count: z.number() }), {
				method: "POST",
				body: JSON.stringify(parsedPayload)
			});
		}
	},
	auditor: {
		assignedPlaces: async (query: AuditorPlacesQuery = {}): Promise<PaginatedResponse<AuditorPlace>> =>
			fetchValidatedJson(
				`/playspace/auditor/me/places${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					status: query.statuses
				})}`,
				paginatedResponseSchema(auditorPlaceSchema)
			),
		audits: async (query: AuditorAuditsQuery = {}): Promise<PaginatedResponse<AuditorAuditSummary>> =>
			fetchValidatedJson(
				`/playspace/auditor/me/audits${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					status: query.statuses
				})}`,
				paginatedResponseSchema(auditorAuditSummarySchema)
			),
		dashboardSummary: async (): Promise<AuditorDashboardSummary> =>
			fetchValidatedJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchInstrument: async (instrumentKey: string, lang: string = "en"): Promise<PlayspaceInstrument> =>
			fetchValidatedJson(
				`/playspace/instruments/active/${encodeURIComponent(instrumentKey)}${buildQueryString({ lang })}`,
				playspaceInstrumentSchema
			),
		createOrResumeAudit: async (
			placeId: string,
			projectId: string,
			executionMode?: "audit" | "survey" | "both"
		): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/places/${encodeURIComponent(placeId)}/audits/access`, auditSessionSchema, {
				method: "POST",
				body: JSON.stringify({
					project_id: projectId,
					execution_mode: executionMode ?? null
				})
			}),
		getAudit: async (auditId: string): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}`, auditSessionSchema),
		patchAuditDraft: async (auditId: string, patch: AuditDraftPatch): Promise<AuditDraftSave> => {
			const parsedPatch = auditDraftPatchSchema.parse(patch);
			return fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}/draft`, auditDraftSaveSchema, {
				method: "PATCH",
				body: JSON.stringify(parsedPatch)
			});
		},
		submitAudit: async (auditId: string, expectedRevision?: number): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}/submit`, auditSessionSchema, {
				method: "POST",
				body: JSON.stringify(expectedRevision === undefined ? {} : { expected_revision: expectedRevision })
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
		instruments: {
			list: async (instrumentKey: string = "pvua_v5_2"): Promise<z.infer<typeof instrumentResponseSchema>[]> =>
				fetchValidatedJson(
					`/playspace/admin/instruments${buildQueryString({ instrument_key: instrumentKey })}`,
					z.array(instrumentResponseSchema)
				),
			create: async (
				payload: z.infer<typeof instrumentCreateRequestSchema>,
				activate: boolean = true
			): Promise<z.infer<typeof instrumentResponseSchema>> => {
				const parsedPayload = instrumentCreateRequestSchema.parse(payload);
				return fetchValidatedJson(
					`/playspace/admin/instruments${buildQueryString({ activate: String(activate) })}`,
					instrumentResponseSchema,
					{
						method: "POST",
						body: JSON.stringify(parsedPayload)
					}
				);
			},
			update: async (
				instrumentId: string,
				payload: z.infer<typeof instrumentUpdateRequestSchema>
			): Promise<z.infer<typeof instrumentResponseSchema>> => {
				const parsedPayload = instrumentUpdateRequestSchema.parse(payload);
				return fetchValidatedJson(
					`/playspace/admin/instruments/${encodeURIComponent(instrumentId)}`,
					instrumentResponseSchema,
					{
						method: "PATCH",
						body: JSON.stringify(parsedPayload)
					}
				);
			}
		},
		accounts: async (query: AdminAccountsQuery = {}): Promise<PaginatedResponse<AdminAccountRow>> =>
			fetchValidatedJson(
				`/playspace/admin/accounts${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					account_type: query.accountTypes
				})}`,
				paginatedResponseSchema(adminAccountRowSchema)
			),
		projects: async (query: AdminProjectsQuery = {}): Promise<PaginatedResponse<AdminProjectRow>> =>
			fetchValidatedJson(
				`/playspace/admin/projects${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					account_id: query.accountIds
				})}`,
				paginatedResponseSchema(adminProjectRowSchema)
			),
		places: async (query: AdminPlacesQuery = {}): Promise<PaginatedResponse<AdminPlaceRow>> =>
			fetchValidatedJson(
				`/playspace/admin/places${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					project_id: query.projectIds,
					account_id: query.accountIds,
					audit_status: query.auditStatuses,
					survey_status: query.surveyStatuses
				})}`,
				paginatedResponseSchema(adminPlaceRowSchema)
			),
		auditors: async (query: AdminAuditorsQuery = {}): Promise<PaginatedResponse<AdminAuditorRow>> =>
			fetchValidatedJson(
				`/playspace/admin/auditors${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					account_id: query.accountIds
				})}`,
				paginatedResponseSchema(adminAuditorRowSchema)
			),
		audits: async (query: AdminAuditsQuery = {}): Promise<PaginatedResponse<AdminAuditRow>> =>
			fetchValidatedJson(
				`/playspace/admin/audits${buildQueryString({
					page: query.page,
					page_size: query.pageSize,
					search: query.search,
					sort: query.sort,
					project_id: query.projectIds,
					account_id: query.accountIds,
					auditor_id: query.auditorIds,
					status: query.statuses
				})}`,
				paginatedResponseSchema(adminAuditRowSchema)
			),
		auditDetail: async (auditId: string): Promise<AuditSession> =>
			fetchValidatedJson(`/playspace/audits/${encodeURIComponent(auditId)}`, auditSessionSchema),
		system: async (): Promise<AdminSystem> => fetchValidatedJson("/playspace/admin/system", adminSystemSchema),
		exportProjects: async (query: AdminExportQuery = {}): Promise<AdminProjectsExportResponse> =>
			fetchValidatedJson(
				`/playspace/admin/export/projects${buildQueryString({
					search: query.search,
					account_id: query.accountIds
				})}`,
				adminProjectsExportResponseSchema
			),
		exportPlaces: async (query: AdminExportQuery = {}): Promise<AdminPlacesExportResponse> =>
			fetchValidatedJson(
				`/playspace/admin/export/places${buildQueryString({
					search: query.search,
					account_id: query.accountIds,
					project_id: query.projectIds,
					audit_status: query.auditStatuses,
					survey_status: query.surveyStatuses
				})}`,
				adminPlacesExportResponseSchema
			),
		exportAudits: async (query: AdminExportQuery = {}): Promise<AdminAuditsExportResponse> =>
			fetchValidatedJson(
				`/playspace/admin/export/audits${buildQueryString({
					search: query.search,
					account_id: query.accountIds,
					project_id: query.projectIds,
					status: query.statuses
				})}`,
				adminAuditsExportResponseSchema
			),
		exportReports: async (query: AdminExportQuery = {}): Promise<AdminAuditsExportResponse> =>
			fetchValidatedJson(
				`/playspace/admin/export/reports${buildQueryString({
					search: query.search,
					account_id: query.accountIds,
					project_id: query.projectIds
				})}`,
				adminAuditsExportResponseSchema
			)
	}
};

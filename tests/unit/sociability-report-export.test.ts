import assert from "node:assert/strict";
import test from "node:test";

import { mergeAuditSessions } from "../../src/components/dashboard/place-report-merge";
import {
	buildSociabilityDimensionRankings,
	type DomainReportRow,
	getSociabilityCoverage
} from "../../src/lib/audit/report-helpers";
import { buildAuditJsonExport } from "../../src/lib/export/audit/json";
import { buildSingleAuditResponseRows } from "../../src/lib/export/audit/row-builders";
import {
	type ExportableAudit,
	SINGLE_RESPONSE_COLUMN_WIDTHS,
	SINGLE_RESPONSE_HEADERS
} from "../../src/lib/export/audit/types";
import type {
	AuditScoreTotals,
	AuditSession,
	ParsedInstrumentQuestion,
	PlayspaceInstrument
} from "../../src/types/audit";
import { addSociabilityBreakdowns, SOCIABILITY_DIMENSION_KEYS } from "../../src/types/sociability";

function totals(seed: number, breakdown: AuditScoreTotals["sociability_breakdown"] = null): AuditScoreTotals {
	return {
		provision_total: seed,
		provision_total_max: seed + 1,
		variety_total: seed,
		variety_total_max: seed + 1,
		challenge_total: seed,
		challenge_total_max: seed + 1,
		sociability_total: seed,
		sociability_total_max: seed + 3,
		sociability_breakdown: breakdown,
		play_value_total: seed,
		play_value_total_max: seed + 1,
		usability_total: seed,
		usability_total_max: seed + 1
	};
}

function breakdown(values: {
	playAlone: [number, number];
	smallGroup: [number, number];
	largeGroup: [number, number];
	captured: number;
	eligible: number;
}): NonNullable<AuditScoreTotals["sociability_breakdown"]> {
	return {
		model: "multi_select_v1",
		play_alone: { total: values.playAlone[0], max: values.playAlone[1] },
		small_group: { total: values.smallGroup[0], max: values.smallGroup[1] },
		large_group: { total: values.largeGroup[0], max: values.largeGroup[1] },
		captured_question_count: values.captured,
		eligible_question_count: values.eligible
	};
}

function session(mode: "audit" | "survey", scoreTotals: AuditScoreTotals): AuditSession {
	return {
		audit_id: `${mode}0000-0000-4000-8000-000000000001`,
		audit_code: mode,
		auditor_code: `auditor-${mode}`,
		selected_execution_mode: mode,
		meta: { execution_mode: mode, final_comments: null },
		aggregate: { sections: {}, meta: { execution_mode: mode, final_comments: null } },
		sections: {},
		scores: {
			draft_progress_percent: 100,
			execution_mode: mode,
			audit: mode === "audit" ? scoreTotals : null,
			survey: mode === "survey" ? scoreTotals : null,
			overall: scoreTotals,
			by_domain: { social: scoreTotals },
			by_section: { social: scoreTotals },
			unsure_answer_count: 0,
			unsure_variants: null
		},
		status: "SUBMITTED"
	} as unknown as AuditSession;
}

test("mixed-version place-report merge carries captured breakdown without manufacturing legacy zeros", () => {
	const capturedBreakdown = breakdown({
		playAlone: [1, 1],
		smallGroup: [0, 1],
		largeGroup: [1, 1],
		captured: 1,
		eligible: 1
	});
	const legacyAudit = session("audit", totals(2, null));
	const newSurvey = session("survey", totals(2, capturedBreakdown));

	const merged = mergeAuditSessions(
		legacyAudit as Parameters<typeof mergeAuditSessions>[0],
		newSurvey as Parameters<typeof mergeAuditSessions>[1]
	);

	assert.deepEqual(merged.scores.overall?.sociability_breakdown, capturedBreakdown);
	assert.deepEqual(merged.scores.by_domain.social?.sociability_breakdown, capturedBreakdown);
	assert.deepEqual(getSociabilityCoverage(merged.scores.overall), { captured: 1, eligible: 1 });
});

test("one-sided Sociability breakdown merges clone nested metrics and remain mutation-isolated", () => {
	const source = breakdown({
		playAlone: [1, 1],
		smallGroup: [0, 1],
		largeGroup: [1, 1],
		captured: 1,
		eligible: 1
	});
	const merged = addSociabilityBreakdowns(null, source);

	assert.notEqual(merged, source);
	assert.notEqual(merged?.play_alone, source.play_alone);
	assert.notEqual(merged?.small_group, source.small_group);
	assert.notEqual(merged?.large_group, source.large_group);
	assert.ok(merged !== null);
	merged.play_alone.total = 99;
	assert.equal(source.play_alone.total, 1);
});

test("per-dimension ranking inputs exclude null and zero-max domains and preserve stable ties", () => {
	const rows = [
		{
			domainTitle: "Legacy",
			scoreTotals: totals(0, null)
		},
		{
			domainTitle: "Zero max",
			scoreTotals: totals(
				0,
				breakdown({ playAlone: [0, 0], smallGroup: [0, 0], largeGroup: [0, 0], captured: 0, eligible: 0 })
			)
		},
		{
			domainTitle: "First tie",
			scoreTotals: totals(
				1,
				breakdown({ playAlone: [1, 2], smallGroup: [1, 2], largeGroup: [0, 2], captured: 2, eligible: 2 })
			)
		},
		{
			domainTitle: "Second tie",
			scoreTotals: totals(
				1,
				breakdown({ playAlone: [1, 2], smallGroup: [0, 2], largeGroup: [2, 2], captured: 2, eligible: 2 })
			)
		}
	] as DomainReportRow[];

	const rankings = buildSociabilityDimensionRankings(rows);
	const playAlone = rankings.find(ranking => ranking.dimensionKey === "play_alone");
	const largeGroup = rankings.find(ranking => ranking.dimensionKey === "large_group");

	assert.equal(rankings.length, 3);
	assert.equal(playAlone?.bestDomain?.domainTitle, "First tie");
	assert.equal(playAlone?.worstDomain?.domainTitle, "First tie");
	assert.equal(largeGroup?.bestDomain?.domainTitle, "Second tie");
	assert.equal(largeGroup?.worstDomain?.domainTitle, "First tie");
});

test("structured JSON export retains canonical Sociability arrays", () => {
	const auditSession = session("audit", totals(1));
	const aggregate = {
		...auditSession.aggregate,
		sections: {
			social: {
				section_key: "social",
				note: null,
				responses: {
					q_social: { provision: "some", sociability: ["play_alone", "large_group"] }
				}
			}
		}
	};
	const exportableAudit = {
		auditSession: { ...auditSession, aggregate, sections: aggregate.sections },
		context: null,
		auditorProfile: null
	} as ExportableAudit;
	const payload = buildAuditJsonExport(exportableAudit, {} as PlayspaceInstrument, "2026-08-06T12:00:00.000Z");
	const serialized = JSON.parse(JSON.stringify(payload)) as {
		audit: { aggregate: { sections: { social: { responses: { q_social: { sociability: unknown } } } } } };
	};

	assert.deepEqual(serialized.audit.aggregate.sections.social.responses.q_social.sociability, [
		"play_alone",
		"large_group"
	]);
});

function exportQuestion(selectionMode: "single" | "multiple"): ParsedInstrumentQuestion {
	return {
		question_key: "q_social",
		mode: "audit",
		constructs: ["play_value"],
		domains: ["social_play"],
		section_key: "social",
		prompt: "Social play",
		question_type: "scaled",
		required: true,
		display_if: null,
		notes_prompt: null,
		options: [],
		scales: [
			{
				key: "provision",
				title: "Provision",
				prompt: "Provision",
				selection_mode: "single",
				options: [
					{
						key: "some",
						label: "Some",
						addition_value: 1,
						boost_value: 1,
						allows_follow_up_scales: true,
						is_not_applicable: false,
						is_unsure: false
					}
				]
			},
			{
				key: "sociability",
				title: "Sociability",
				prompt: "Sociability",
				selection_mode: selectionMode,
				options:
					selectionMode === "multiple"
						? SOCIABILITY_DIMENSION_KEYS.map(key => ({
								key,
								label: key.replaceAll("_", " "),
								addition_value: 1,
								boost_value: 1,
								allows_follow_up_scales: false,
								is_not_applicable: false,
								is_unsure: false
							}))
						: [
								{
									key: "pairs",
									label: "Pairs",
									addition_value: 2,
									boost_value: 1,
									allows_follow_up_scales: false,
									is_not_applicable: false,
									is_unsure: false
								}
							]
			}
		]
	};
}

function exportFixture(
	question: ParsedInstrumentQuestion,
	sociabilityAnswer: string | string[]
): { exportableAudit: ExportableAudit; instrument: PlayspaceInstrument } {
	const scoreTotals = totals(1);
	const auditSession = session("audit", scoreTotals);
	const sectionState = {
		section_key: "social",
		note: null,
		responses: { q_social: { provision: "some", sociability: sociabilityAnswer } }
	};
	const instrument = {
		instrument_key: "pvua",
		instrument_name: "PVUA",
		instrument_version: "5.32",
		current_sheet: "PVUA",
		source_files: [],
		preamble: [],
		execution_modes: [],
		pre_audit_questions: [],
		scale_guidance: [],
		sections: [
			{
				section_key: "social",
				title: "Social",
				description: null,
				instruction: "Answer",
				notes_prompt: null,
				questions: [question]
			}
		],
		legal_documents: []
	} as PlayspaceInstrument;
	return {
		instrument,
		exportableAudit: {
			auditSession: {
				...auditSession,
				aggregate: { ...auditSession.aggregate, sections: { social: sectionState } },
				sections: { social: sectionState }
			},
			context: null,
			auditorProfile: null
		} as ExportableAudit
	};
}

test("production response table exports explicit structural columns and summary scores for array answers", () => {
	const fixture = exportFixture(exportQuestion("multiple"), ["large_group", "play_alone"]);
	const rows = buildSingleAuditResponseRows(fixture.exportableAudit, fixture.instrument);
	const questionRow = rows[1];
	const rawScoreRow = rows[2];

	assert.equal(SINGLE_RESPONSE_HEADERS.length, 16);
	assert.equal(SINGLE_RESPONSE_COLUMN_WIDTHS.length, SINGLE_RESPONSE_HEADERS.length);
	assert.deepEqual(SINGLE_RESPONSE_HEADERS.slice(10, 13), [
		"Sociability - Play Alone",
		"Sociability - Small Group",
		"Sociability - Large Group"
	]);
	assert.equal(questionRow?.length, SINGLE_RESPONSE_HEADERS.length);
	assert.equal(
		rows.every(row => row.length === SINGLE_RESPONSE_HEADERS.length),
		true
	);
	assert.match(String(questionRow?.[9]), /play alone/i);
	assert.deepEqual(questionRow?.slice(10, 13), ["Selected", "Not selected", "Selected"]);
	assert.deepEqual(rawScoreRow?.slice(10, 13), [1, 0, 1]);
});

test("production response table preserves legacy scalar Sociability and marks structural columns uncaptured", () => {
	const fixture = exportFixture(exportQuestion("single"), "pairs");
	const rows = buildSingleAuditResponseRows(fixture.exportableAudit, fixture.instrument);
	const questionRow = rows[1];
	const rawScoreRow = rows[2];

	assert.match(String(questionRow?.[9]), /Pairs/);
	assert.deepEqual(questionRow?.slice(10, 13), ["Not captured", "Not captured", "Not captured"]);
	assert.deepEqual(rawScoreRow?.slice(10, 13), ["Not captured", "Not captured", "Not captured"]);
});

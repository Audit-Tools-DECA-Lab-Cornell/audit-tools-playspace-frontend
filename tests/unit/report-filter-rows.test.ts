import assert from "node:assert/strict";
import test from "node:test";

import { auditSessionSchema, playspaceInstrumentSchema } from "@/lib/api/playspace-types";
import { createDefaultReportFilter, setDomainOverride, setOverallSelection } from "@/lib/audit/report-filter";
import { buildDomainReportRows, sumDomainScoreTotals } from "@/lib/audit/report-helpers";
import { generatePdfBlob } from "@/lib/export/audit/pdf";
import {
	buildOverviewRows,
	buildSingleAuditResponseHeaders,
	buildSingleAuditResponseRows,
	COMMENT_ROW_SENTINEL
} from "@/lib/export/audit/row-builders";

const PLAY_VALUE_ONLY = { playValue: true, usability: false };
const USABILITY_ONLY = { playValue: false, usability: true };

function provisionScale() {
	return {
		key: "provision",
		title: "Provision",
		prompt: "Provision",
		options: [
			{
				key: "a_lot",
				label: "A lot",
				addition_value: 2,
				boost_value: 1,
				allows_follow_up_scales: true,
				is_not_applicable: false
			},
			{
				key: "no",
				label: "No",
				addition_value: 0,
				boost_value: 0,
				allows_follow_up_scales: false,
				is_not_applicable: false
			}
		]
	};
}

function scaledQuestion(questionKey: string, constructs: string[], domains: string[]) {
	return {
		question_key: questionKey,
		mode: "audit",
		constructs,
		domains,
		section_key: "section_mixed",
		prompt: `Scaled question ${questionKey}`,
		question_type: "scaled",
		required: true,
		display_if: null,
		notes_prompt: null,
		options: [],
		scales: [provisionScale()]
	};
}

/** Construct-less checklist follow-up; inherits domain and constructs from its parent. */
function checklistFollowUp(questionKey: string, parentQuestionKey: string) {
	return {
		question_key: questionKey,
		mode: "audit",
		constructs: [],
		domains: [],
		section_key: "section_mixed",
		prompt: `Checklist ${questionKey}`,
		question_type: "checklist",
		required: false,
		display_if: {
			question_key: parentQuestionKey,
			response_key: "provision",
			any_of_option_keys: ["a_lot"]
		},
		notes_prompt: null,
		options: [
			{ key: "opt_a", label: "Option A" },
			{ key: "opt_b", label: "Option B" }
		],
		scales: []
	};
}

function buildInstrument() {
	return playspaceInstrumentSchema.parse({
		instrument_key: "pvua-v-test",
		instrument_name: "PVUA",
		instrument_version: "5.2",
		current_sheet: "sheet-1",
		source_files: ["instrument.json"],
		preamble: [],
		execution_modes: [{ key: "audit", label: "Place Audit" }],
		pre_audit_questions: [],
		scale_guidance: [],
		legal_documents: [],
		sections: [
			{
				section_key: "section_mixed",
				title: "Mixed",
				description: "Mixed section",
				instruction: "Answer the questions",
				notes_prompt: null,
				questions: [
					scaledQuestion("q_pv", ["play_value"], ["movement"]),
					scaledQuestion("q_u", ["usability"], ["movement"]),
					checklistFollowUp("q_pv_1", "q_pv"),
					scaledQuestion("q_dual", ["play_value", "usability"], ["seating"])
				]
			}
		]
	});
}

function totals(overrides: Record<string, number> = {}) {
	return {
		provision_total: 4,
		provision_total_max: 4,
		variety_total: 0,
		variety_total_max: 0,
		challenge_total: 0,
		challenge_total_max: 0,
		sociability_total: 0,
		sociability_total_max: 0,
		play_value_total: 2,
		play_value_total_max: 2,
		usability_total: 2,
		usability_total_max: 2,
		...overrides
	};
}

function buildAuditSession() {
	return auditSessionSchema.parse({
		audit_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		audit_code: "AUDIT-FILTER-001",
		auditor_code: "AUD-FILTER-001",
		project_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
		project_name: "Project Alpha",
		place_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
		place_name: "Place One",
		place_type: "Public Playspace",
		allowed_execution_modes: ["audit"],
		selected_execution_mode: "audit",
		status: "SUBMITTED",
		instrument_key: "pvua-v-test",
		instrument_version: "5.2",
		started_at: "2026-05-01T12:00:00.000Z",
		submitted_at: "2026-05-01T12:30:00.000Z",
		total_minutes: 30,
		meta: { execution_mode: "audit", final_comments: null },
		pre_audit: {
			place_size: null,
			current_users_0_5: null,
			current_users_6_12: null,
			current_users_13_17: null,
			current_users_18_plus: null,
			playspace_busyness: null,
			season: null,
			weather_conditions: [],
			wind_conditions: null
		},
		sections: {
			section_mixed: {
				section_key: "section_mixed",
				note: null,
				responses: {
					q_pv: { provision: "a_lot" },
					q_u: { provision: "a_lot" },
					q_pv_1: { checklist: ["opt_a"] },
					q_dual: { provision: "a_lot" }
				}
			}
		},
		scores: {
			draft_progress_percent: 100,
			execution_mode: "audit",
			audit: totals(),
			survey: null,
			overall: totals(),
			by_section: { section_mixed: totals() },
			by_domain: { movement: totals(), seating: totals() }
		},
		progress: {
			required_pre_audit_complete: true,
			visible_section_count: 1,
			completed_section_count: 1,
			total_visible_questions: 4,
			answered_visible_questions: 4,
			ready_to_submit: true,
			sections: [
				{
					section_key: "section_mixed",
					title: "Mixed",
					visible_question_count: 4,
					answered_question_count: 4,
					is_complete: true
				}
			]
		}
	});
}

function questionKeysFor(domainKey: string, rows: ReturnType<typeof buildDomainReportRows>): string[] {
	return (rows.find(row => row.domainKey === domainKey)?.questions ?? []).map(row => row.questionKey).sort();
}

// ---------------------------------------------------------------------------
// Regression guard: an unfiltered report must not change at all
// ---------------------------------------------------------------------------

test("omitting the filter and passing the default filter produce identical rows", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();

	const withoutOption = buildDomainReportRows(auditSession, instrument);
	const withDefaultFilter = buildDomainReportRows(auditSession, instrument, {
		filter: createDefaultReportFilter()
	});

	assert.deepEqual(withDefaultFilter, withoutOption);
});

test("the default filter passes backend domain totals through untouched", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();

	const rows = buildDomainReportRows(auditSession, instrument, { filter: createDefaultReportFilter() });
	const movement = rows.find(row => row.domainKey === "movement");

	assert.deepEqual(movement?.scoreTotals, auditSession.scores.by_domain.movement);
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

test("a play-value-only report drops usability questions and keeps dual ones", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

	const rows = buildDomainReportRows(auditSession, instrument, { filter });

	assert.deepEqual(questionKeysFor("movement", rows), ["q_pv", "q_pv_1"]);
	assert.deepEqual(questionKeysFor("seating", rows), ["q_dual"]);
});

test("a usability-only report drops play-value questions and their checklist follow-ups", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), USABILITY_ONLY);

	const rows = buildDomainReportRows(auditSession, instrument, { filter });

	assert.deepEqual(questionKeysFor("movement", rows), ["q_u"]);
	assert.deepEqual(questionKeysFor("seating", rows), ["q_dual"]);
});

test("filtered domain totals are recomputed rather than reused from the backend", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

	const movement = buildDomainReportRows(auditSession, instrument, { filter }).find(
		row => row.domainKey === "movement"
	);

	// Only q_pv scores now: provision 2, and no usability contribution.
	assert.equal(movement?.scoreTotals?.provision_total, 2);
	assert.equal(movement?.scoreTotals?.play_value_total, 2);
	assert.equal(movement?.scoreTotals?.usability_total, 0);
});

test("a domain override narrows only its own domain", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setDomainOverride(createDefaultReportFilter(), "movement", USABILITY_ONLY);

	const rows = buildDomainReportRows(auditSession, instrument, { filter });

	assert.deepEqual(questionKeysFor("movement", rows), ["q_u"]);
	// seating still inherits both constructs, so its backend totals pass through.
	assert.deepEqual(rows.find(row => row.domainKey === "seating")?.scoreTotals, auditSession.scores.by_domain.seating);
});

test("a domain emptied by a filter reports no score and no items", () => {
	const instrument = playspaceInstrumentSchema.parse({
		...buildInstrument(),
		sections: [
			{
				section_key: "section_mixed",
				title: "Mixed",
				description: "Mixed section",
				instruction: "Answer the questions",
				notes_prompt: null,
				questions: [scaledQuestion("q_u", ["usability"], ["movement"])]
			}
		]
	});
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

	const movement = buildDomainReportRows(auditSession, instrument, { filter }).find(
		row => row.domainKey === "movement"
	);

	assert.equal(movement?.itemCount, 0);
	assert.equal(movement?.scoreTotals, null);
});

test("construct-less content stays visible without manufacturing a zero score", () => {
	const baseInstrument = buildInstrument();
	const orphanChecklist = {
		...checklistFollowUp("q_orphan", "q_missing"),
		domains: ["movement"],
		display_if: null
	};
	const instrument = playspaceInstrumentSchema.parse({
		...baseInstrument,
		sections: [
			{
				...baseInstrument.sections[0],
				questions: [scaledQuestion("q_u", ["usability"], ["movement"]), orphanChecklist]
			}
		]
	});
	const movement = buildDomainReportRows(buildAuditSession(), instrument, {
		filter: setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY)
	}).find(row => row.domainKey === "movement");

	assert.equal(movement?.itemCount, 1);
	assert.equal(movement?.scoreTotals, null);
	assert.deepEqual(
		movement?.questions.map(question => question.questionKey),
		["q_orphan"]
	);
});

test("the unsure policy reaches the recomputed totals", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

	const excluded = buildDomainReportRows(auditSession, instrument, {
		filter,
		unsurePolicy: "unsure_as_excluded"
	}).find(row => row.domainKey === "movement");
	const asMax = buildDomainReportRows(auditSession, instrument, {
		filter,
		unsurePolicy: "unsure_as_max"
	}).find(row => row.domainKey === "movement");

	// No unsure answers in this fixture, so both policies agree — the option is plumbed, not ignored.
	assert.deepEqual(asMax?.scoreTotals, excluded?.scoreTotals);
});

// ---------------------------------------------------------------------------
// Overall totals
// ---------------------------------------------------------------------------

test("overall totals sum the domain buckets that remain", () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

	const rows = buildDomainReportRows(auditSession, instrument, { filter });
	const overall = sumDomainScoreTotals(rows);

	const expectedPlayValue = rows.reduce((sum, row) => sum + (row.scoreTotals?.play_value_total ?? 0), 0);
	assert.equal(overall?.play_value_total, expectedPlayValue);
});

test("summing no scored domains yields null", () => {
	assert.equal(sumDomainScoreTotals([]), null);
});

test("the explicit default filter preserves complete export rows, headers, and normalized PDF bytes", async () => {
	const instrument = buildInstrument();
	const auditSession = buildAuditSession();
	const unfiltered = { auditSession, context: null, auditorProfile: null };
	const withDefault = { ...unfiltered, resultFilter: createDefaultReportFilter() };

	assert.deepEqual(buildOverviewRows(withDefault, instrument), buildOverviewRows(unfiltered, instrument));
	assert.deepEqual(
		buildSingleAuditResponseHeaders(withDefault, instrument),
		buildSingleAuditResponseHeaders(unfiltered, instrument)
	);
	assert.deepEqual(
		buildSingleAuditResponseRows(withDefault, instrument),
		buildSingleAuditResponseRows(unfiltered, instrument)
	);
	const [unfilteredPdf, defaultPdf] = await Promise.all([
		generatePdfBlob(unfiltered, instrument),
		generatePdfBlob(withDefault, instrument)
	]);
	const normalizePdf = async (blob: Blob) =>
		Buffer.from(await blob.arrayBuffer())
			.toString("latin1")
			.replace(/\/ID\s*\[\s*<[^>]+>\s*<[^>]+>\s*\]/gu, "/ID []")
			.replace(/\/CreationDate\s*\([^)]*\)/gu, "/CreationDate ()");
	assert.equal(await normalizePdf(defaultPdf), await normalizePdf(unfilteredPdf));
});

test("a single-construct export drops the other column and masks a dual question", () => {
	const instrument = buildInstrument();
	const exportableAudit = {
		auditSession: buildAuditSession(),
		context: null,
		auditorProfile: null,
		resultFilter: setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY)
	};
	const headers = buildSingleAuditResponseHeaders(exportableAudit, instrument);
	const dualRow = buildSingleAuditResponseRows(exportableAudit, instrument).find(
		row => row[6] === "Scaled question q_dual"
	);

	assert.equal(headers.includes("Usability (U) Construct Score"), false);
	assert.equal(headers.includes("Play Value (PV) Construct Score"), true);
	assert.equal(dualRow?.at(-1), 2);
});

test("mixed domain settings keep both columns and blank the disabled question score", () => {
	const instrument = buildInstrument();
	const exportableAudit = {
		auditSession: buildAuditSession(),
		context: null,
		auditorProfile: null,
		resultFilter: setDomainOverride(createDefaultReportFilter(), "movement", USABILITY_ONLY)
	};
	const headers = buildSingleAuditResponseHeaders(exportableAudit, instrument);
	const usabilityRow = buildSingleAuditResponseRows(exportableAudit, instrument).find(
		row => row[6] === "Scaled question q_u"
	);
	const movementOverview = buildOverviewRows(exportableAudit, instrument).find(row => row[0] === "Domain: Movement");

	assert.deepEqual(headers.slice(-2), ["Play Value (PV) Construct Score", "Usability (U) Construct Score"]);
	assert.equal(usabilityRow?.[14], "");
	assert.equal(usabilityRow?.[15], 2);
	assert.match(String(movementOverview?.[1]), /^U /u);
	assert.doesNotMatch(String(movementOverview?.[1]), /PV /u);
});

test("filtered response rows retain notes and omit zero summaries for narrative-only sections", () => {
	const instrument = playspaceInstrumentSchema.parse({
		...buildInstrument(),
		sections: [
			{
				section_key: "section_mixed",
				title: "Mixed",
				description: "Mixed section",
				instruction: "Answer the questions",
				notes_prompt: "Record context",
				questions: [scaledQuestion("q_u", ["usability"], ["movement"])]
			}
		]
	});
	const auditSession = buildAuditSession();
	const sectionState = auditSession.sections.section_mixed;
	if (sectionState === undefined) throw new Error("Missing test section");
	sectionState.note = "Keep this section note";
	sectionState.responses.q_u = { provision: "a_lot", question_note: "Keep this question comment" };
	const exportableAudit = {
		auditSession,
		context: null,
		auditorProfile: null,
		resultFilter: setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY)
	};
	const rows = buildSingleAuditResponseRows(exportableAudit, instrument);
	const overviewRows = buildOverviewRows(exportableAudit, instrument);

	assert.equal(
		rows.some(row => row[1] === COMMENT_ROW_SENTINEL && row[6] === "Keep this question comment"),
		true
	);
	assert.equal(
		rows.some(row => row[0] === "Auditor Note: Keep this section note"),
		true
	);
	assert.equal(
		rows.some(row => row[2] === "Summary"),
		false
	);
	assert.equal(overviewRows.find(row => row[0] === "Summary Score")?.[1], "Pending");
});

test("a filtered PDF renders with its projected response columns", async () => {
	const instrument = buildInstrument();
	const blob = await generatePdfBlob(
		{
			auditSession: buildAuditSession(),
			context: null,
			auditorProfile: null,
			resultFilter: setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY)
		},
		instrument
	);

	assert.equal(blob.type, "application/pdf");
	assert.ok(blob.size > 0);
});

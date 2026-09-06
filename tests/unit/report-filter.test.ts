import assert from "node:assert/strict";
import test from "node:test";

import {
	applySelectionToAllDomains,
	buildQuestionLookup,
	clearDomainOverride,
	createDefaultReportFilter,
	getDomainConstructCoverage,
	getQuestionConstructKeys,
	isDefaultReportFilter,
	isSingleConstructSelection,
	pruneUnknownDomainOverrides,
	questionMatchesConstructSelection,
	resolveDomainConstructSelection,
	setDomainOverride,
	setOverallSelection
} from "@/lib/audit/report-filter";
import { getQuestionDomainKeys } from "@/lib/audit/report-helpers";
import type { ConstructKey, ParsedInstrumentQuestion, PlayspaceInstrument } from "@/types/audit";

const PLAY_VALUE_ONLY = { playValue: true, usability: false };
const USABILITY_ONLY = { playValue: false, usability: true };
const BOTH = { playValue: true, usability: true };

function buildQuestion(
	questionKey: string,
	constructs: ConstructKey[],
	domains: string[],
	overrides: Partial<ParsedInstrumentQuestion> = {}
): ParsedInstrumentQuestion {
	return {
		question_key: questionKey,
		mode: "audit",
		constructs,
		domains,
		section_key: "section_test",
		prompt: `Prompt ${questionKey}`,
		question_type: "scaled",
		required: true,
		display_if: null,
		notes_prompt: null,
		options: [],
		scales: [],
		...overrides
	};
}

/** Mirrors the instrument's checklist follow-ups, which carry no constructs of their own. */
function buildChecklistFollowUp(questionKey: string, parentQuestionKey: string): ParsedInstrumentQuestion {
	return buildQuestion(questionKey, [], [], {
		question_type: "checklist",
		display_if: { question_key: parentQuestionKey, response_key: "provision", any_of_option_keys: ["some"] }
	});
}

function buildInstrument(questions: ParsedInstrumentQuestion[]): PlayspaceInstrument {
	return {
		instrument_key: "test_instrument",
		instrument_name: "Test Instrument",
		instrument_version: "1.0",
		current_sheet: "sheet",
		source_files: [],
		preamble: [],
		execution_modes: [],
		pre_audit_questions: [],
		scale_guidance: [],
		legal_documents: [],
		sections: [
			{
				section_key: "section_test",
				title: "Test Section",
				description: null,
				instruction: "Instruction",
				notes_prompt: null,
				questions
			}
		]
	} as unknown as PlayspaceInstrument;
}

// ---------------------------------------------------------------------------
// Construct resolution and inheritance
// ---------------------------------------------------------------------------

test("a question's own constructs win over inheritance", () => {
	const parent = buildQuestion("q_parent", ["play_value"], ["Seating"]);
	const child = buildQuestion("q_child", ["usability"], [], {
		display_if: { question_key: "q_parent", response_key: "provision", any_of_option_keys: ["some"] }
	});
	const lookup = { q_parent: parent, q_child: child };

	assert.deepEqual(getQuestionConstructKeys(child, lookup), ["usability"]);
});

test("a construct-less checklist follow-up inherits a single-construct parent", () => {
	const parent = buildQuestion("q_14_1", ["play_value"], ["Loose Manufactured Parts & Equipment"]);
	const child = buildChecklistFollowUp("q_14_1_1", "q_14_1");
	const lookup = { q_14_1: parent, q_14_1_1: child };

	assert.deepEqual(getQuestionConstructKeys(child, lookup), ["play_value"]);
});

test("a construct-less checklist follow-up inherits a dual-construct parent", () => {
	const parent = buildQuestion("q_16_1", ["play_value", "usability"], ["Seating"]);
	const child = buildChecklistFollowUp("q_16_1_1", "q_16_1");
	const lookup = { q_16_1: parent, q_16_1_1: child };

	assert.deepEqual(getQuestionConstructKeys(child, lookup), ["play_value", "usability"]);
});

test("a construct-less question with no parent resolves to no constructs", () => {
	const orphan = buildQuestion("q_orphan", [], ["Seating"]);
	assert.deepEqual(getQuestionConstructKeys(orphan, { q_orphan: orphan }), []);
});

test("construct inheritance stops on a self-referencing parent", () => {
	const looping = buildQuestion("q_loop", [], [], {
		display_if: { question_key: "q_loop", response_key: "provision", any_of_option_keys: ["some"] }
	});
	assert.deepEqual(getQuestionConstructKeys(looping, { q_loop: looping }), []);
});

test("construct inheritance stops on a two-question cycle", () => {
	const first = buildQuestion("q_a", [], [], {
		display_if: { question_key: "q_b", response_key: "provision", any_of_option_keys: ["some"] }
	});
	const second = buildQuestion("q_b", [], [], {
		display_if: { question_key: "q_a", response_key: "provision", any_of_option_keys: ["some"] }
	});
	assert.deepEqual(getQuestionConstructKeys(first, { q_a: first, q_b: second }), []);
});

// ---------------------------------------------------------------------------
// Inclusion rule
// ---------------------------------------------------------------------------

test("a play-value question is excluded from a usability-only report", () => {
	assert.equal(questionMatchesConstructSelection(["play_value"], USABILITY_ONLY), false);
	assert.equal(questionMatchesConstructSelection(["play_value"], PLAY_VALUE_ONLY), true);
});

test("a usability question is excluded from a play-value-only report", () => {
	assert.equal(questionMatchesConstructSelection(["usability"], PLAY_VALUE_ONLY), false);
	assert.equal(questionMatchesConstructSelection(["usability"], USABILITY_ONLY), true);
});

test("a dual-construct question survives either single-construct filter", () => {
	const dual: ConstructKey[] = ["play_value", "usability"];
	assert.equal(questionMatchesConstructSelection(dual, PLAY_VALUE_ONLY), true);
	assert.equal(questionMatchesConstructSelection(dual, USABILITY_ONLY), true);
	assert.equal(questionMatchesConstructSelection(dual, BOTH), true);
});

test("an unresolvable construct-less question is never dropped by a filter", () => {
	assert.equal(questionMatchesConstructSelection([], PLAY_VALUE_ONLY), true);
	assert.equal(questionMatchesConstructSelection([], USABILITY_ONLY), true);
	assert.equal(questionMatchesConstructSelection([], BOTH), true);
});

test("every question is included when both constructs are enabled", () => {
	const cases: ConstructKey[][] = [["play_value"], ["usability"], ["play_value", "usability"], []];
	cases.forEach(constructKeys => {
		assert.equal(questionMatchesConstructSelection(constructKeys, BOTH), true);
	});
});

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

test("the default filter excludes nothing", () => {
	const filter = createDefaultReportFilter();
	assert.deepEqual(filter.overall, BOTH);
	assert.deepEqual(filter.domainOverrides, {});
	assert.equal(isDefaultReportFilter(filter), true);
});

test("a narrowed report-level selection is not the default", () => {
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);
	assert.equal(isDefaultReportFilter(filter), false);
});

test("a narrowed domain override is not the default even with both constructs on overall", () => {
	const filter = setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY);
	assert.deepEqual(filter.overall, BOTH);
	assert.equal(isDefaultReportFilter(filter), false);
});

test("a domain override that narrows nothing still counts as the default", () => {
	const filter = setDomainOverride(createDefaultReportFilter(), "seating", BOTH);
	assert.equal(isDefaultReportFilter(filter), true);
});

test("disabling both constructs is rejected at report level and per domain", () => {
	const filter = createDefaultReportFilter();
	const none = { playValue: false, usability: false };
	assert.equal(setOverallSelection(filter, none), filter);
	assert.equal(setDomainOverride(filter, "seating", none), filter);
});

test("a domain inherits the report-level selection until overridden", () => {
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);
	assert.deepEqual(resolveDomainConstructSelection(filter, "seating"), PLAY_VALUE_ONLY);

	const overridden = setDomainOverride(filter, "seating", USABILITY_ONLY);
	assert.deepEqual(resolveDomainConstructSelection(overridden, "seating"), USABILITY_ONLY);
	assert.deepEqual(resolveDomainConstructSelection(overridden, "pathways"), PLAY_VALUE_ONLY);
});

test("clearing an override returns a domain to inheritance", () => {
	const filter = setDomainOverride(
		setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY),
		"seating",
		USABILITY_ONLY
	);
	const cleared = clearDomainOverride(filter, "seating");
	assert.deepEqual(cleared.domainOverrides, {});
	assert.deepEqual(resolveDomainConstructSelection(cleared, "seating"), PLAY_VALUE_ONLY);
});

test("applying the report selection to all domains drops every override", () => {
	const filter = setDomainOverride(
		setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY),
		"pathways",
		PLAY_VALUE_ONLY
	);
	const applied = applySelectionToAllDomains(filter);
	assert.deepEqual(applied.domainOverrides, {});
	assert.deepEqual(applied.overall, filter.overall);
});

test("overrides for domains absent from the report are pruned, and present ones kept", () => {
	const filter = setDomainOverride(
		setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY),
		"retired_domain",
		PLAY_VALUE_ONLY
	);
	const pruned = pruneUnknownDomainOverrides(filter, ["seating", "pathways"]);
	assert.deepEqual(Object.keys(pruned.domainOverrides), ["seating"]);
});

test("pruning returns the same filter when every override is still present", () => {
	const filter = setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY);
	assert.equal(pruneUnknownDomainOverrides(filter, ["seating"]), filter);
});

test("a single-construct selection is detected for the scope label", () => {
	assert.equal(isSingleConstructSelection(PLAY_VALUE_ONLY), true);
	assert.equal(isSingleConstructSelection(USABILITY_ONLY), true);
	assert.equal(isSingleConstructSelection(BOTH), false);
});

// ---------------------------------------------------------------------------
// Domain coverage (drives hiding controls that cannot act)
// ---------------------------------------------------------------------------

test("domain coverage reports a single-construct domain as such", () => {
	const instrument = buildInstrument([
		buildQuestion("q_1", ["usability"], ["Amenities"]),
		buildQuestion("q_2", ["usability"], ["Amenities"])
	]);
	const coverage = getDomainConstructCoverage(instrument, getQuestionDomainKeys);
	assert.deepEqual(coverage.amenities, { playValue: false, usability: true });
});

test("domain coverage reports a mixed domain as carrying both constructs", () => {
	const instrument = buildInstrument([
		buildQuestion("q_1", ["play_value"], ["Pathways"]),
		buildQuestion("q_2", ["usability"], ["Pathways"])
	]);
	const coverage = getDomainConstructCoverage(instrument, getQuestionDomainKeys);
	assert.deepEqual(coverage.pathways, { playValue: true, usability: true });
});

test("a dual-construct question alone covers both constructs for its domain", () => {
	const instrument = buildInstrument([buildQuestion("q_16_3", ["play_value", "usability"], ["Seating"])]);
	const coverage = getDomainConstructCoverage(instrument, getQuestionDomainKeys);
	assert.deepEqual(coverage.seating, { playValue: true, usability: true });
});

test("an inherited checklist follow-up contributes its parent's construct to domain coverage", () => {
	const instrument = buildInstrument([
		buildQuestion("q_14_1", ["play_value"], ["Loose Manufactured Parts & Equipment"]),
		buildChecklistFollowUp("q_14_1_1", "q_14_1")
	]);
	const coverage = getDomainConstructCoverage(instrument, getQuestionDomainKeys);
	assert.deepEqual(coverage["loose_manufactured_parts_&_equipment"], { playValue: true, usability: false });
});

test("the question lookup covers every question in the instrument", () => {
	const instrument = buildInstrument([
		buildQuestion("q_1", ["play_value"], ["Seating"]),
		buildQuestion("q_2", ["usability"], ["Seating"])
	]);
	const lookup = buildQuestionLookup(instrument);
	assert.deepEqual(Object.keys(lookup).sort(), ["q_1", "q_2"]);
});

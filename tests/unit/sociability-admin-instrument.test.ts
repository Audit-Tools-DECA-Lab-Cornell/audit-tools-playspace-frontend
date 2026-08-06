import assert from "node:assert/strict";
import test from "node:test";

import {
	applySociabilityMultiSelect,
	applySociabilityMultiSelectToContent,
	contentUsesMultipleSelection,
	findSociabilityMultiSelectTargets,
	findUntranslatedSociabilityLabels,
	isCanonicalMultiSelectScale,
	SOCIABILITY_MULTI_SELECT_LABELS,
	SOCIABILITY_MULTI_SELECT_PROMPT,
	validateSociabilityMultiSelect
} from "../../src/components/dashboard/instruments/sociability-multi-select";
import type { InstrumentContent } from "../../src/components/dashboard/instruments/types";
import type { PlayspaceInstrument, QuestionScale, ScaleOption } from "../../src/types/audit";

function option(key: string, label: string, value = 1): ScaleOption {
	return {
		key,
		label,
		addition_value: value,
		boost_value: value,
		allows_follow_up_scales: false,
		is_not_applicable: false,
		is_unsure: false
	};
}

/** A scalar Sociability scale, the shape every pre-5.32 instrument carries. */
function legacySociabilityScale(): QuestionScale {
	return {
		key: "sociability",
		title: "Sociability Support",
		prompt: "Does this feature support social play?",
		options: [option("none", "None", 1), option("some", "Some", 2), option("many", "Many", 3)]
	};
}

function instrument(scales: QuestionScale[][]): PlayspaceInstrument {
	return {
		instrument_key: "pvua_v5_2",
		instrument_name: "PVUA",
		instrument_version: "5.31",
		current_sheet: "sheet",
		preamble: [],
		execution_modes: [],
		pre_audit_questions: [],
		legal_documents: [],
		scale_guidance: [
			{
				key: "sociability",
				title: "Sociability Support",
				prompt: "Does this feature support social play?",
				description: "Guidance",
				options: [option("none", "None", 1)]
			}
		],
		sections: [
			{
				section_key: "section_1",
				title: "Section 1",
				description: "",
				instruction: "",
				notes_prompt: null,
				questions: scales.map((questionScales, index) => ({
					question_key: `q_1_${index + 1}`,
					section_key: "section_1",
					mode: "both",
					prompt: `Question ${index + 1}`,
					question_type: "scaled",
					constructs: ["play_value"],
					domains: ["Pathways"],
					options: [],
					required: true,
					display_if: null,
					notes_prompt: null,
					scales: questionScales
				}))
			}
		]
	} as unknown as PlayspaceInstrument;
}

test("only questions that already carry a Sociability scale are bulk-action targets", () => {
	const source = instrument([
		[legacySociabilityScale()],
		[{ key: "provision", title: "Provision", prompt: "How many?", options: [option("some", "Some", 2)] }]
	]);

	const targets = findSociabilityMultiSelectTargets(source);

	assert.equal(targets.length, 1, "a question without the Sociability scale is never converted");
	assert.equal(targets[0]?.questionKey, "q_1_1");
	assert.equal(targets[0]?.alreadyApplied, false);
});

test("applying the bulk action writes the exact three keys, labels, prompt, and equal values", () => {
	const applied = applySociabilityMultiSelect(instrument([[legacySociabilityScale()]]));
	const scale = applied.sections[0].questions[0].scales[0];

	assert.equal(scale.selection_mode, "multiple");
	assert.equal(scale.prompt, SOCIABILITY_MULTI_SELECT_PROMPT);
	assert.deepEqual(
		scale.options.map(entry => entry.key),
		["play_alone", "small_group", "large_group"]
	);
	assert.deepEqual(
		scale.options.map(entry => entry.label),
		[
			SOCIABILITY_MULTI_SELECT_LABELS.play_alone,
			SOCIABILITY_MULTI_SELECT_LABELS.small_group,
			SOCIABILITY_MULTI_SELECT_LABELS.large_group
		]
	);
	assert.deepEqual(
		scale.options.map(entry => entry.addition_value),
		[1, 1, 1],
		"every opportunity is worth exactly one point"
	);
	assert.equal(applied.scale_guidance[0].selection_mode, "multiple", "shared guidance moves with the items");
});

test("the bulk action is idempotent and reports already-converted items separately", () => {
	const once = applySociabilityMultiSelect(instrument([[legacySociabilityScale()]]));
	const twice = applySociabilityMultiSelect(once);

	assert.deepEqual(twice, once);
	const targets = findSociabilityMultiSelectTargets(once);
	assert.equal(targets[0]?.alreadyApplied, true);
	assert.equal(isCanonicalMultiSelectScale(once.sections[0].questions[0].scales[0]), true);
});

test("validation names each contract violation instead of failing the whole payload at once", () => {
	const wrongKeys = instrument([
		[
			{
				key: "sociability",
				title: "Sociability Support",
				prompt: SOCIABILITY_MULTI_SELECT_PROMPT,
				selection_mode: "multiple",
				options: [option("solo", "Solo"), option("small_group", "Small"), option("large_group", "Large")]
			}
		]
	]);
	assert.deepEqual(
		validateSociabilityMultiSelect(wrongKeys).map(issue => issue.code),
		["wrong_option_keys"]
	);

	const wrongValues = instrument([
		[
			{
				key: "sociability",
				title: "Sociability Support",
				prompt: SOCIABILITY_MULTI_SELECT_PROMPT,
				selection_mode: "multiple",
				options: [
					option("play_alone", SOCIABILITY_MULTI_SELECT_LABELS.play_alone, 1),
					option("small_group", SOCIABILITY_MULTI_SELECT_LABELS.small_group, 2),
					option("large_group", SOCIABILITY_MULTI_SELECT_LABELS.large_group, 3)
				]
			}
		]
	]);
	assert.deepEqual(
		validateSociabilityMultiSelect(wrongValues).map(issue => issue.code),
		["wrong_option_values"],
		"unequal values would rank the three opportunities"
	);

	const wrongCopy = instrument([
		[
			{
				key: "sociability",
				title: "Sociability Support",
				prompt: "Best social option?",
				selection_mode: "multiple",
				options: [option("play_alone", "Alone"), option("small_group", "Small"), option("large_group", "Large")]
			}
		]
	]);
	assert.deepEqual(
		validateSociabilityMultiSelect(wrongCopy).map(issue => issue.code),
		["wrong_prompt", "wrong_labels"]
	);
});

test("a single-select instrument raises no multi-select validation issues", () => {
	assert.deepEqual(validateSociabilityMultiSelect(instrument([[legacySociabilityScale()]])), []);
});

test("activation gating and translation approval read the whole multi-language version", () => {
	const legacyContent = { en: instrument([[legacySociabilityScale()]]) } as unknown as InstrumentContent;
	assert.equal(contentUsesMultipleSelection(legacyContent), false);

	const converted = applySociabilityMultiSelectToContent({
		en: instrument([[legacySociabilityScale()]]),
		de: instrument([[legacySociabilityScale()]])
	} as unknown as InstrumentContent);

	assert.equal(contentUsesMultipleSelection(converted), true);
	assert.deepEqual(
		findUntranslatedSociabilityLabels(converted, "en"),
		["de"],
		"German still shows the approved English copy, which needs manager sign-off"
	);
	assert.deepEqual(findUntranslatedSociabilityLabels({ en: converted.en } as InstrumentContent, "en"), []);
});

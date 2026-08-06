import assert from "node:assert/strict";
import test from "node:test";

import { calculateQuestionScores } from "../../src/lib/audit/question-scoring";
import { getVisibleQuestions, isInstrumentQuestionComplete } from "../../src/lib/audit/selectors";
import {
	auditScoreTotalsSchema,
	type ParsedInstrumentQuestion,
	type ParsedQuestionScale,
	playspaceInstrumentSchema,
	type QuestionScaleInput,
	questionScaleSchema
} from "../../src/types/audit";
import { SOCIABILITY_DIMENSION_KEYS, validateAndNormalizeMultipleScaleAnswer } from "../../src/types/sociability";

const BASE_SCORE_TOTALS = {
	provision_total: 1,
	provision_total_max: 2,
	variety_total: 0,
	variety_total_max: 0,
	challenge_total: 0,
	challenge_total_max: 0,
	sociability_total: 1,
	sociability_total_max: 3,
	play_value_total: 1,
	play_value_total_max: 2,
	usability_total: 0,
	usability_total_max: 0
};

type ParsedSelectionModeIsRequired = ParsedQuestionScale extends {
	selection_mode: "single" | "multiple";
}
	? true
	: false;

const parsedSelectionModeIsRequired: ParsedSelectionModeIsRequired = true;

function buildMultipleQuestion(mode: "audit" | "survey" | "both" = "audit"): ParsedInstrumentQuestion {
	return {
		question_key: `q_${mode}`,
		mode,
		constructs: ["play_value"],
		domains: ["social_play"],
		section_key: "section_social",
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
						key: "no",
						label: "No",
						addition_value: 0,
						boost_value: 1,
						allows_follow_up_scales: false,
						is_not_applicable: false,
						is_unsure: false
					},
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
				selection_mode: "multiple",
				options: SOCIABILITY_DIMENSION_KEYS.map(key => ({
					key,
					label: key,
					addition_value: 1,
					boost_value: 1,
					allows_follow_up_scales: false,
					is_not_applicable: false,
					is_unsure: false
				}))
			}
		]
	};
}

test("old instrument and score payloads parse with single selection and null breakdown defaults", () => {
	const rawScale: QuestionScaleInput = {
		key: "sociability",
		title: "Sociability",
		prompt: "Prompt",
		options: []
	};
	const parsedScale: ParsedQuestionScale = questionScaleSchema.parse(rawScale);
	const parsedInstrument = playspaceInstrumentSchema.parse({
		instrument_key: "pvua",
		instrument_name: "PVUA",
		instrument_version: "5.31",
		current_sheet: "PVUA",
		source_files: [],
		preamble: [],
		execution_modes: [],
		pre_audit_questions: [],
		scale_guidance: [
			{
				key: "sociability",
				title: "Sociability",
				prompt: "Prompt",
				description: "Description",
				options: []
			}
		],
		sections: [],
		legal_documents: []
	});
	const parsedTotals = auditScoreTotalsSchema.parse(BASE_SCORE_TOTALS);

	assert.equal(parsedSelectionModeIsRequired, true);
	assert.equal(parsedScale.selection_mode, "single");
	assert.equal(parsedInstrument.scale_guidance[0]?.selection_mode, "single");
	assert.equal(parsedTotals.sociability_breakdown, null);
});

test("new instrument and score payloads retain multiple selection and versioned breakdown", () => {
	const question = buildMultipleQuestion();
	const parsedInstrument = playspaceInstrumentSchema.parse({
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
				section_key: "section_social",
				title: "Social",
				instruction: "Answer",
				questions: [question]
			}
		],
		legal_documents: []
	});
	const parsedTotals = auditScoreTotalsSchema.parse({
		...BASE_SCORE_TOTALS,
		sociability_breakdown: {
			model: "multi_select_v1",
			play_alone: { total: 1, max: 1 },
			small_group: { total: 0, max: 1 },
			large_group: { total: 0, max: 1 },
			captured_question_count: 1,
			eligible_question_count: 1
		}
	});

	assert.equal(parsedInstrument.sections[0]?.questions[0]?.scales[1]?.selection_mode, "multiple");
	assert.equal(parsedTotals.sociability_breakdown?.model, "multi_select_v1");
});

test("multiple scale normalization orders valid keys and rejects scalar, empty, duplicate, and unknown answers", () => {
	assert.deepEqual(
		validateAndNormalizeMultipleScaleAnswer(["large_group", "play_alone"], SOCIABILITY_DIMENSION_KEYS),
		{ ok: true, value: ["play_alone", "large_group"] }
	);
	for (const value of ["play_alone", [], ["play_alone", "play_alone"], ["unknown"]]) {
		assert.equal(validateAndNormalizeMultipleScaleAnswer(value, SOCIABILITY_DIMENSION_KEYS).ok, false);
	}
});

test("visible multiple Sociability requires a non-empty valid array while provision gating remains intact", () => {
	const question = buildMultipleQuestion();

	assert.equal(isInstrumentQuestionComplete(question, { provision: "some", sociability: ["play_alone"] }), true);
	assert.equal(
		isInstrumentQuestionComplete(question, { provision: "some", sociability: [...SOCIABILITY_DIMENSION_KEYS] }),
		true
	);
	assert.equal(isInstrumentQuestionComplete(question, { provision: "some", sociability: "play_alone" }), false);
	assert.equal(isInstrumentQuestionComplete(question, { provision: "some", sociability: [] }), false);
	assert.equal(isInstrumentQuestionComplete(question, { provision: "some", sociability: ["unknown"] }), false);
	assert.equal(
		isInstrumentQuestionComplete(question, { provision: "some", sociability: ["play_alone", "play_alone"] }),
		false
	);
	assert.equal(isInstrumentQuestionComplete(question, { provision: "no", sociability: "stale_scalar" }), true);
});

test("multiple Sociability scores one or all selected dimensions at one point each with max three", () => {
	const question = buildMultipleQuestion();
	const one = calculateQuestionScores(question, { provision: "some", sociability: ["small_group"] });
	const all = calculateQuestionScores(question, {
		provision: "some",
		sociability: [...SOCIABILITY_DIMENSION_KEYS]
	});

	assert.equal(one.sociability_total, 1);
	assert.equal(one.sociability_total_max, 3);
	assert.equal(one.sociability_breakdown?.small_group.total, 1);
	assert.equal(one.sociability_breakdown?.captured_question_count, 1);
	assert.equal(all.sociability_total, 3);
	assert.equal(all.sociability_breakdown?.large_group.total, 1);
	assert.throws(() => calculateQuestionScores(question, { provision: "some", sociability: "play_alone" }));
	assert.throws(() =>
		calculateQuestionScores(question, { provision: "some", sociability: ["play_alone", "play_alone"] })
	);
});

test("provision gating removes multi-select Sociability score and denominator", () => {
	const totals = calculateQuestionScores(buildMultipleQuestion(), {
		provision: "no",
		sociability: ["play_alone"]
	});

	assert.equal(totals.sociability_total, 0);
	assert.equal(totals.sociability_total_max, 0);
	assert.equal(totals.sociability_breakdown?.eligible_question_count, 0);
});

test("audit and survey question mode partitions remain unchanged", () => {
	const questions = [buildMultipleQuestion("audit"), buildMultipleQuestion("survey"), buildMultipleQuestion("both")];

	assert.deepEqual(
		getVisibleQuestions(questions, "audit").map(question => question.mode),
		["audit", "both"]
	);
	assert.deepEqual(
		getVisibleQuestions(questions, "survey").map(question => question.mode),
		["survey", "both"]
	);
	assert.equal(getVisibleQuestions(questions, "both").length, 3);
});

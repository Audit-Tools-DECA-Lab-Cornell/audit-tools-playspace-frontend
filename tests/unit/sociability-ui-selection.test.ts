import assert from "node:assert/strict";
import test from "node:test";

import {
	isInstrumentQuestionComplete,
	isMultipleSelectionScale,
	readMultipleScaleSelection,
	toggleMultipleScaleOption
} from "../../src/lib/audit/selectors";
import type { InstrumentQuestion, QuestionResponsePayload, QuestionScale } from "../../src/types/audit";

/**
 * The canonical Sociability multi-select scale, exactly as the 5.32 candidate defines it.
 */
function sociabilityScale(): QuestionScale {
	return {
		key: "sociability",
		title: "Sociability Support",
		prompt: "Does this feature/environmental characteristic provide opportunities for a child to",
		selection_mode: "multiple",
		options: [
			{
				key: "play_alone",
				label: "Play on their own",
				addition_value: 1,
				boost_value: 1,
				allows_follow_up_scales: false,
				is_not_applicable: false,
				is_unsure: false
			},
			{
				key: "small_group",
				label: "Play together in a small group (1-4 other users)",
				addition_value: 1,
				boost_value: 1,
				allows_follow_up_scales: false,
				is_not_applicable: false,
				is_unsure: false
			},
			{
				key: "large_group",
				label: "Play together in a larger group (5 or more other users)",
				addition_value: 1,
				boost_value: 1,
				allows_follow_up_scales: false,
				is_not_applicable: false,
				is_unsure: false
			}
		]
	};
}

function provisionScale(): QuestionScale {
	return {
		key: "provision",
		title: "Provision",
		prompt: "How many?",
		options: [
			{
				key: "some",
				label: "Some",
				addition_value: 2,
				boost_value: 1,
				allows_follow_up_scales: true,
				is_not_applicable: false,
				is_unsure: false
			},
			{
				key: "none",
				label: "None",
				addition_value: 0,
				boost_value: 1,
				allows_follow_up_scales: false,
				is_not_applicable: false,
				is_unsure: false
			}
		]
	};
}

function question(): InstrumentQuestion {
	return {
		question_key: "q_1_1",
		section_key: "section_1",
		mode: "both",
		prompt: "Prompt",
		question_type: "scaled",
		constructs: ["play_value"],
		domains: ["Pathways"],
		options: [],
		required: true,
		display_if: null,
		notes_prompt: null,
		scales: [provisionScale(), sociabilityScale()]
	};
}

test("only an explicit multiple selection_mode switches a scale to checkbox behaviour", () => {
	assert.equal(isMultipleSelectionScale(sociabilityScale()), true);
	assert.equal(isMultipleSelectionScale(provisionScale()), false);
	assert.equal(isMultipleSelectionScale({ selection_mode: undefined }), false);
	assert.equal(isMultipleSelectionScale({ selection_mode: "single" }), false);
});

test("toggling builds one, two, and three selections in instrument option order", () => {
	const scale = sociabilityScale();
	let answers: QuestionResponsePayload = { provision: "some" };

	answers = toggleMultipleScaleOption(answers, scale, "large_group");
	assert.deepEqual(answers.sociability, ["large_group"]);

	answers = toggleMultipleScaleOption(answers, scale, "play_alone");
	assert.deepEqual(answers.sociability, ["play_alone", "large_group"], "order follows the instrument, not clicks");

	answers = toggleMultipleScaleOption(answers, scale, "small_group");
	assert.deepEqual(answers.sociability, ["play_alone", "small_group", "large_group"]);
	assert.equal(answers.provision, "some", "sibling scale answers survive a Sociability toggle");
});

test("clearing the last selection removes the key instead of storing an empty array", () => {
	const scale = sociabilityScale();
	const selected = toggleMultipleScaleOption({ provision: "some" }, scale, "small_group");

	const cleared = toggleMultipleScaleOption(selected, scale, "small_group");

	assert.equal("sociability" in cleared, false, "the backend rejects empty arrays; unanswered means absent");
	assert.equal(cleared.provision, "some");
});

test("reading a selection ignores stray values and restores instrument order", () => {
	const scale = sociabilityScale();

	assert.deepEqual(readMultipleScaleSelection({ sociability: ["large_group", "play_alone"] }, scale), [
		"play_alone",
		"large_group"
	]);
	assert.deepEqual(readMultipleScaleSelection({ sociability: ["unknown_key"] }, scale), []);
	assert.deepEqual(readMultipleScaleSelection({ sociability: "play_alone" }, scale), []);
	assert.deepEqual(readMultipleScaleSelection({}, scale), []);
});

test("a visible multiple Sociability question needs at least one selection to count as answered", () => {
	const instrumentQuestion = question();

	assert.equal(isInstrumentQuestionComplete(instrumentQuestion, { provision: "some" }), false);
	assert.equal(isInstrumentQuestionComplete(instrumentQuestion, { provision: "some", sociability: [] }), false);
	assert.equal(
		isInstrumentQuestionComplete(instrumentQuestion, { provision: "some", sociability: ["play_alone"] }),
		true
	);
	assert.equal(
		isInstrumentQuestionComplete(instrumentQuestion, {
			provision: "some",
			sociability: ["play_alone", "small_group", "large_group"]
		}),
		true
	);
});

test("a provision answer that hides follow-ups leaves the question complete without Sociability", () => {
	assert.equal(isInstrumentQuestionComplete(question(), { provision: "none" }), true);
});

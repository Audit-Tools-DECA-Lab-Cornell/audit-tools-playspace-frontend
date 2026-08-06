import type {
	AuditScoreTotals,
	AuditSession,
	ParsedInstrumentQuestion,
	ParsedQuestionScale,
	QuestionResponsePayload,
	ScaleOption
} from "@/types/audit";
import {
	addSociabilityBreakdowns,
	createEmptySociabilityBreakdown,
	hasCanonicalSociabilityDimensionKeys,
	SOCIABILITY_DIMENSION_KEYS,
	type SociabilityBreakdown,
	validateAndNormalizeMultipleScaleAnswer
} from "@/types/sociability";

export type UnsurePolicy = "unsure_as_excluded" | "unsure_as_zero" | "unsure_as_max";

interface MultiplierScaleResult {
	readonly columnTotal: number;
	readonly columnTotalMax: number;
	readonly boostValue: number;
	readonly boostValueMax: number;
}

const EMPTY_SCORE_TOTALS: AuditScoreTotals = {
	provision_total: 0,
	provision_total_max: 0,
	variety_total: 0,
	variety_total_max: 0,
	challenge_total: 0,
	challenge_total_max: 0,
	sociability_total: 0,
	sociability_total_max: 0,
	sociability_breakdown: null,
	play_value_total: 0,
	play_value_total_max: 0,
	usability_total: 0,
	usability_total_max: 0
};

export function createEmptyScoreTotals(): AuditScoreTotals {
	return { ...EMPTY_SCORE_TOTALS };
}

export function addScoreTotals(left: AuditScoreTotals, right: AuditScoreTotals): AuditScoreTotals {
	return {
		provision_total: left.provision_total + right.provision_total,
		provision_total_max: left.provision_total_max + right.provision_total_max,
		variety_total: left.variety_total + right.variety_total,
		variety_total_max: left.variety_total_max + right.variety_total_max,
		challenge_total: left.challenge_total + right.challenge_total,
		challenge_total_max: left.challenge_total_max + right.challenge_total_max,
		sociability_total: left.sociability_total + right.sociability_total,
		sociability_total_max: left.sociability_total_max + right.sociability_total_max,
		sociability_breakdown: addSociabilityBreakdowns(left.sociability_breakdown, right.sociability_breakdown),
		play_value_total: left.play_value_total + right.play_value_total,
		play_value_total_max: left.play_value_total_max + right.play_value_total_max,
		usability_total: left.usability_total + right.usability_total,
		usability_total_max: left.usability_total_max + right.usability_total_max
	};
}

export function deriveSummaryScore(auditSession: AuditSession): number | string {
	const overall = auditSession.scores.overall;
	if (overall === null) {
		return "Pending";
	}
	return Math.round((overall.play_value_total + overall.usability_total) * 100) / 100;
}

export function findScale(
	question: ParsedInstrumentQuestion,
	scaleKey: ParsedQuestionScale["key"]
): ParsedQuestionScale | undefined {
	return question.scales.find(scale => scale.key === scaleKey);
}

export function findScaleOption(scale: ParsedQuestionScale, optionKey: string): ScaleOption | undefined {
	return scale.options.find(option => option.key === optionKey);
}

function isExcludingOption(option: ScaleOption, unsurePolicy: UnsurePolicy): boolean {
	return option.is_not_applicable === true || (option.is_unsure === true && unsurePolicy === "unsure_as_excluded");
}

function maxCandidateOptions(options: readonly ScaleOption[]): readonly ScaleOption[] {
	return options.filter(option => option.is_not_applicable !== true && option.is_unsure !== true);
}

function readProvisionScaleMaximum(question: ParsedInstrumentQuestion): number {
	const scale = findScale(question, "provision");
	if (scale === undefined) {
		return 0;
	}
	return maxCandidateOptions(scale.options).reduce((max, option) => Math.max(max, option.addition_value), 0);
}

function readMultiplierScaleMaximum(
	question: ParsedInstrumentQuestion,
	scaleKey: "variety" | "challenge"
): Pick<MultiplierScaleResult, "columnTotalMax" | "boostValueMax"> {
	const scale = findScale(question, scaleKey);
	if (scale === undefined) {
		return { columnTotalMax: 0, boostValueMax: 1 };
	}
	const candidates = maxCandidateOptions(scale.options);
	return {
		columnTotalMax: candidates.reduce((max, option) => Math.max(max, Math.max(option.addition_value - 1, 0)), 0),
		boostValueMax: candidates.reduce((max, option) => Math.max(max, option.boost_value), 1)
	};
}

function readMultiplierScaleResult(
	question: ParsedInstrumentQuestion,
	answers: QuestionResponsePayload,
	scaleKey: "variety" | "challenge",
	unsurePolicy: UnsurePolicy
): MultiplierScaleResult {
	const scale = findScale(question, scaleKey);
	if (scale === undefined) {
		return { columnTotal: 0, columnTotalMax: 0, boostValue: 1, boostValueMax: 1 };
	}

	const maximum = readMultiplierScaleMaximum(question, scaleKey);
	const rawAnswer = answers[scaleKey];
	const answerKey = typeof rawAnswer === "string" ? rawAnswer : undefined;
	if (answerKey === undefined) {
		return {
			columnTotal: 0,
			columnTotalMax: maximum.columnTotalMax,
			boostValue: 1,
			boostValueMax: maximum.boostValueMax
		};
	}

	const selectedOption = findScaleOption(scale, answerKey);
	if (selectedOption === undefined) {
		return {
			columnTotal: 0,
			columnTotalMax: maximum.columnTotalMax,
			boostValue: 1,
			boostValueMax: maximum.boostValueMax
		};
	}

	if (isExcludingOption(selectedOption, unsurePolicy)) {
		return { columnTotal: 0, columnTotalMax: 0, boostValue: 1, boostValueMax: 1 };
	}

	if (selectedOption.is_unsure === true) {
		if (unsurePolicy === "unsure_as_max") {
			return {
				columnTotal: maximum.columnTotalMax,
				columnTotalMax: maximum.columnTotalMax,
				boostValue: maximum.boostValueMax,
				boostValueMax: maximum.boostValueMax
			};
		}
		return {
			columnTotal: 0,
			columnTotalMax: maximum.columnTotalMax,
			boostValue: 1,
			boostValueMax: maximum.boostValueMax
		};
	}

	const columnTotal = Math.max(selectedOption.addition_value - 1, 0);
	return {
		columnTotal,
		columnTotalMax: maximum.columnTotalMax,
		boostValue: selectedOption.addition_value <= 0 ? 1 : selectedOption.boost_value,
		boostValueMax: maximum.boostValueMax
	};
}

function readSociabilityScaleMaximum(question: ParsedInstrumentQuestion): number {
	const scale = findScale(question, "sociability");
	if (scale === undefined) {
		return 0;
	}
	if (scale.selection_mode === "multiple") {
		assertCanonicalSociabilityOptions(scale);
		return SOCIABILITY_DIMENSION_KEYS.length;
	}
	return maxCandidateOptions(scale.options).reduce(
		(max, option) => Math.max(max, Math.max(option.addition_value - 1, 0)),
		0
	);
}

function assertCanonicalSociabilityOptions(scale: ParsedQuestionScale): void {
	const optionKeys = scale.options.map(option => option.key);
	if (!hasCanonicalSociabilityDimensionKeys(optionKeys)) {
		throw new Error("Multiple Sociability options must use the canonical ordered dimension keys.");
	}
}

function readSociabilityScaleResult(
	question: ParsedInstrumentQuestion,
	answers: QuestionResponsePayload,
	unsurePolicy: UnsurePolicy
): { readonly total: number; readonly totalMax: number; readonly breakdown: SociabilityBreakdown | null } {
	const scale = findScale(question, "sociability");
	if (scale === undefined) {
		return { total: 0, totalMax: 0, breakdown: null };
	}

	const totalMax = readSociabilityScaleMaximum(question);
	if (scale.selection_mode === "multiple") {
		assertCanonicalSociabilityOptions(scale);
		if (!("sociability" in answers)) {
			return { total: 0, totalMax, breakdown: createEmptySociabilityBreakdown({ eligible: true }) };
		}

		const normalizedAnswer = validateAndNormalizeMultipleScaleAnswer(
			answers.sociability,
			SOCIABILITY_DIMENSION_KEYS
		);
		if (!normalizedAnswer.ok) {
			throw new Error(`Invalid multiple Sociability answer: ${normalizedAnswer.reason}.`);
		}

		const selectedKeys = new Set(normalizedAnswer.value);
		return {
			total: normalizedAnswer.value.length,
			totalMax,
			breakdown: {
				model: "multi_select_v1",
				play_alone: { total: selectedKeys.has("play_alone") ? 1 : 0, max: 1 },
				small_group: { total: selectedKeys.has("small_group") ? 1 : 0, max: 1 },
				large_group: { total: selectedKeys.has("large_group") ? 1 : 0, max: 1 },
				captured_question_count: 1,
				eligible_question_count: 1
			}
		};
	}

	const rawAnswer = answers.sociability;
	const answerKey = typeof rawAnswer === "string" ? rawAnswer : undefined;
	if (answerKey === undefined) {
		return { total: 0, totalMax, breakdown: null };
	}

	const selectedOption = findScaleOption(scale, answerKey);
	if (selectedOption === undefined) {
		return { total: 0, totalMax, breakdown: null };
	}

	if (isExcludingOption(selectedOption, unsurePolicy)) {
		return { total: 0, totalMax: 0, breakdown: null };
	}

	if (selectedOption.is_unsure === true) {
		return unsurePolicy === "unsure_as_max"
			? { total: totalMax, totalMax, breakdown: null }
			: { total: 0, totalMax, breakdown: null };
	}

	return { total: Math.max(selectedOption.addition_value - 1, 0), totalMax, breakdown: null };
}

export function calculateQuestionScores(
	question: ParsedInstrumentQuestion,
	answers: QuestionResponsePayload,
	unsurePolicy: UnsurePolicy = "unsure_as_excluded"
): AuditScoreTotals {
	const sociabilityScale = findScale(question, "sociability");
	const capturesSociabilityBreakdown = sociabilityScale?.selection_mode === "multiple";
	const emptySociabilityBreakdown = capturesSociabilityBreakdown ? createEmptySociabilityBreakdown() : null;
	if (question.question_type !== "scaled" || question.scales.length === 0) {
		return { ...createEmptyScoreTotals(), sociability_breakdown: emptySociabilityBreakdown };
	}

	const provisionScale = findScale(question, "provision");
	const rawProvisionAnswer = answers.provision;
	const provisionAnswerKey = typeof rawProvisionAnswer === "string" ? rawProvisionAnswer : undefined;
	const provisionOption =
		provisionScale === undefined || provisionAnswerKey === undefined
			? undefined
			: findScaleOption(provisionScale, provisionAnswerKey);

	if (provisionOption === undefined || isExcludingOption(provisionOption, unsurePolicy)) {
		return { ...createEmptyScoreTotals(), sociability_breakdown: emptySociabilityBreakdown };
	}

	const provisionTotalMax = readProvisionScaleMaximum(question);
	const varietyMaximum = readMultiplierScaleMaximum(question, "variety");
	const challengeMaximum = readMultiplierScaleMaximum(question, "challenge");
	const sociabilityTotalMax = readSociabilityScaleMaximum(question);

	let provisionTotal = provisionOption.addition_value;
	let varietyTotal = 0;
	let varietyTotalMax = varietyMaximum.columnTotalMax;
	let varietyBoost = 1;
	let varietyBoostMax = varietyMaximum.boostValueMax;
	let challengeTotal = 0;
	let challengeTotalMax = challengeMaximum.columnTotalMax;
	let challengeBoost = 1;
	let challengeBoostMax = challengeMaximum.boostValueMax;
	let sociabilityTotal = 0;
	let effectiveSociabilityTotalMax = sociabilityTotalMax;
	let sociabilityBreakdown = emptySociabilityBreakdown;

	if (provisionOption.is_unsure === true && unsurePolicy === "unsure_as_max") {
		provisionTotal = provisionTotalMax;
		varietyTotal = varietyTotalMax;
		varietyBoost = varietyBoostMax;
		challengeTotal = challengeTotalMax;
		challengeBoost = challengeBoostMax;
		sociabilityTotal = sociabilityTotalMax;
		if (capturesSociabilityBreakdown) {
			sociabilityBreakdown = {
				model: "multi_select_v1",
				play_alone: { total: 1, max: 1 },
				small_group: { total: 1, max: 1 },
				large_group: { total: 1, max: 1 },
				captured_question_count: 0,
				eligible_question_count: 1
			};
		}
	} else if (provisionOption.allows_follow_up_scales === true) {
		const varietyResult = readMultiplierScaleResult(question, answers, "variety", unsurePolicy);
		const challengeResult = readMultiplierScaleResult(question, answers, "challenge", unsurePolicy);
		const sociabilityResult = readSociabilityScaleResult(question, answers, unsurePolicy);
		varietyTotal = varietyResult.columnTotal;
		varietyTotalMax = varietyResult.columnTotalMax;
		varietyBoost = varietyResult.boostValue;
		varietyBoostMax = varietyResult.boostValueMax;
		challengeTotal = challengeResult.columnTotal;
		challengeTotalMax = challengeResult.columnTotalMax;
		challengeBoost = challengeResult.boostValue;
		challengeBoostMax = challengeResult.boostValueMax;
		sociabilityTotal = sociabilityResult.total;
		effectiveSociabilityTotalMax = sociabilityResult.totalMax;
		sociabilityBreakdown = sociabilityResult.breakdown;
	} else if (capturesSociabilityBreakdown && provisionOption.is_unsure === true) {
		sociabilityBreakdown = createEmptySociabilityBreakdown({ eligible: true });
	} else if (capturesSociabilityBreakdown) {
		effectiveSociabilityTotalMax = 0;
	}

	const constructTotal = provisionTotal * varietyBoost * challengeBoost;
	const constructTotalMax = provisionTotalMax * varietyBoostMax * challengeBoostMax;

	return {
		provision_total: provisionTotal,
		provision_total_max: provisionTotalMax,
		variety_total: varietyTotal,
		variety_total_max: varietyTotalMax,
		challenge_total: challengeTotal,
		challenge_total_max: challengeTotalMax,
		sociability_total: sociabilityTotal,
		sociability_total_max: effectiveSociabilityTotalMax,
		sociability_breakdown: sociabilityBreakdown,
		play_value_total: question.constructs.includes("play_value") ? constructTotal : 0,
		play_value_total_max: question.constructs.includes("play_value") ? constructTotalMax : 0,
		usability_total: question.constructs.includes("usability") ? constructTotal : 0,
		usability_total_max: question.constructs.includes("usability") ? constructTotalMax : 0
	};
}

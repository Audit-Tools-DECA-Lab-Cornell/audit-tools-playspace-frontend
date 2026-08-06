import { z } from "zod";

export const selectionModeSchema = z.enum(["single", "multiple"]);

export const SOCIABILITY_DIMENSION_KEYS = ["play_alone", "small_group", "large_group"] as const;

export const sociabilityDimensionKeySchema = z.enum(SOCIABILITY_DIMENSION_KEYS);

export const sociabilityCategoryTotalsSchema = z.object({
	total: z.number(),
	max: z.number()
});

export const sociabilityBreakdownSchema = z.object({
	model: z.literal("multi_select_v1"),
	play_alone: sociabilityCategoryTotalsSchema,
	small_group: sociabilityCategoryTotalsSchema,
	large_group: sociabilityCategoryTotalsSchema,
	captured_question_count: z.number().int().nonnegative(),
	eligible_question_count: z.number().int().nonnegative()
});

export type SelectionMode = z.infer<typeof selectionModeSchema>;
export type SociabilityDimensionKey = z.infer<typeof sociabilityDimensionKeySchema>;
export type SociabilityCategoryTotals = z.infer<typeof sociabilityCategoryTotalsSchema>;
export type SociabilityBreakdown = z.infer<typeof sociabilityBreakdownSchema>;

export type MultipleScaleAnswerValidation =
	| { readonly ok: true; readonly value: string[] }
	| {
			readonly ok: false;
			readonly reason: "expected_array" | "empty" | "non_string" | "blank" | "duplicate" | "unknown";
			readonly invalidKeys?: readonly string[];
	  };

export function hasCanonicalSociabilityDimensionKeys(optionKeys: readonly string[]): boolean {
	return (
		optionKeys.length === SOCIABILITY_DIMENSION_KEYS.length &&
		optionKeys.every((optionKey, index) => optionKey === SOCIABILITY_DIMENSION_KEYS[index])
	);
}

export function validateAndNormalizeMultipleScaleAnswer(
	value: unknown,
	allowedOptionKeys: readonly string[]
): MultipleScaleAnswerValidation {
	if (!Array.isArray(value)) {
		return { ok: false, reason: "expected_array" };
	}
	if (value.length === 0) {
		return { ok: false, reason: "empty" };
	}
	if (value.some(optionKey => typeof optionKey !== "string")) {
		return { ok: false, reason: "non_string" };
	}

	const selectedOptionKeys = value.filter((optionKey): optionKey is string => typeof optionKey === "string");
	if (selectedOptionKeys.some(optionKey => optionKey.trim().length === 0)) {
		return { ok: false, reason: "blank" };
	}
	if (new Set(selectedOptionKeys).size !== selectedOptionKeys.length) {
		return { ok: false, reason: "duplicate" };
	}

	const allowedOptionKeySet = new Set(allowedOptionKeys);
	const invalidKeys = selectedOptionKeys.filter(optionKey => !allowedOptionKeySet.has(optionKey));
	if (invalidKeys.length > 0) {
		return { ok: false, reason: "unknown", invalidKeys };
	}

	const selectedOptionKeySet = new Set(selectedOptionKeys);
	return {
		ok: true,
		value: allowedOptionKeys.filter(optionKey => selectedOptionKeySet.has(optionKey))
	};
}

export function createEmptySociabilityBreakdown(options: { readonly eligible?: boolean } = {}): SociabilityBreakdown {
	const maximum = options.eligible === true ? 1 : 0;
	return {
		model: "multi_select_v1",
		play_alone: { total: 0, max: maximum },
		small_group: { total: 0, max: maximum },
		large_group: { total: 0, max: maximum },
		captured_question_count: 0,
		eligible_question_count: options.eligible === true ? 1 : 0
	};
}

export function addSociabilityBreakdowns(
	left: SociabilityBreakdown | null,
	right: SociabilityBreakdown | null
): SociabilityBreakdown | null {
	if (left === null) {
		return right === null ? null : cloneSociabilityBreakdown(right);
	}
	if (right === null) {
		return cloneSociabilityBreakdown(left);
	}

	return {
		model: "multi_select_v1",
		play_alone: {
			total: left.play_alone.total + right.play_alone.total,
			max: left.play_alone.max + right.play_alone.max
		},
		small_group: {
			total: left.small_group.total + right.small_group.total,
			max: left.small_group.max + right.small_group.max
		},
		large_group: {
			total: left.large_group.total + right.large_group.total,
			max: left.large_group.max + right.large_group.max
		},
		captured_question_count: left.captured_question_count + right.captured_question_count,
		eligible_question_count: left.eligible_question_count + right.eligible_question_count
	};
}

function cloneSociabilityBreakdown(breakdown: SociabilityBreakdown): SociabilityBreakdown {
	return {
		...breakdown,
		play_alone: { ...breakdown.play_alone },
		small_group: { ...breakdown.small_group },
		large_group: { ...breakdown.large_group }
	};
}

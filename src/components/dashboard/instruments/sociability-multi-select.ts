import type { PlayspaceInstrument, QuestionScale, ScaleDefinition, ScaleOption } from "@/types/audit";
import { SOCIABILITY_DIMENSION_KEYS } from "@/types/sociability";

import type { InstrumentContent, Lang } from "./types";

/**
 * Canonical English Sociability multi-select content.
 *
 * The manager approves this copy; it is the contract every client, export, and report renders
 * against. The three opportunities are equal - the order here is storage order only and must not
 * be read as a ranking.
 */
export const SOCIABILITY_MULTI_SELECT_PROMPT =
	"Does this feature/environmental characteristic provide opportunities for a child to";

export const SOCIABILITY_MULTI_SELECT_LABELS: Readonly<Record<string, string>> = {
	play_alone: "Play on their own",
	small_group: "Play together in a small group (1-4 other users)",
	large_group: "Play together in a larger group (5 or more other users)"
};

/** Every selected opportunity is worth exactly one point. */
const SOCIABILITY_MULTI_SELECT_VALUE = 1;

export interface SociabilityMultiSelectTarget {
	readonly sectionIndex: number;
	readonly questionIndex: number;
	readonly sectionKey: string;
	readonly sectionTitle: string;
	readonly questionKey: string;
	readonly questionPrompt: string;
	/** True when the question's Sociability scale already matches the canonical multi-select shape. */
	readonly alreadyApplied: boolean;
}

export interface SociabilityValidationIssue {
	readonly code:
		| "wrong_option_keys"
		| "wrong_option_values"
		| "wrong_prompt"
		| "wrong_labels"
		| "duplicate_option_keys"
		| "empty_option_keys";
	readonly location: string;
}

/**
 * Build the canonical three-option Sociability scale, keeping the title the instrument already uses.
 */
export function buildCanonicalSociabilityScale(existingScale: QuestionScale | undefined): QuestionScale {
	return {
		key: "sociability",
		title: existingScale?.title ?? "Sociability Support",
		prompt: SOCIABILITY_MULTI_SELECT_PROMPT,
		selection_mode: "multiple",
		options: SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => buildCanonicalOption(dimensionKey))
	};
}

/**
 * Build the canonical Sociability entry for the shared `scale_guidance` block.
 */
export function buildCanonicalSociabilityGuidance(existingGuidance: ScaleDefinition | undefined): ScaleDefinition {
	return {
		key: "sociability",
		title: existingGuidance?.title ?? "Sociability Support",
		prompt: SOCIABILITY_MULTI_SELECT_PROMPT,
		description:
			existingGuidance?.description ??
			"Record every play opportunity the feature supports. Choosing more than one is expected.",
		selection_mode: "multiple",
		options: SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => buildCanonicalOption(dimensionKey))
	};
}

function buildCanonicalOption(dimensionKey: string): ScaleOption {
	return {
		key: dimensionKey,
		label: SOCIABILITY_MULTI_SELECT_LABELS[dimensionKey] ?? dimensionKey,
		addition_value: SOCIABILITY_MULTI_SELECT_VALUE,
		boost_value: SOCIABILITY_MULTI_SELECT_VALUE,
		allows_follow_up_scales: false,
		is_not_applicable: false,
		is_unsure: false
	};
}

/**
 * List every question that carries a Sociability scale, flagging the ones already converted.
 *
 * Only assigned items are touched. Questions without a Sociability scale keep their shape; the bulk
 * action never adds the scale where the instrument does not use it.
 */
export function findSociabilityMultiSelectTargets(
	instrument: PlayspaceInstrument
): readonly SociabilityMultiSelectTarget[] {
	const targets: SociabilityMultiSelectTarget[] = [];

	instrument.sections.forEach((section, sectionIndex) => {
		section.questions.forEach((question, questionIndex) => {
			const sociabilityScale = question.scales.find(scale => scale.key === "sociability");
			if (sociabilityScale === undefined) {
				return;
			}

			targets.push({
				sectionIndex,
				questionIndex,
				sectionKey: section.section_key,
				sectionTitle: section.title,
				questionKey: question.question_key,
				questionPrompt: question.prompt,
				alreadyApplied: isCanonicalMultiSelectScale(sociabilityScale)
			});
		});
	});

	return targets;
}

/**
 * Report whether one scale already matches the canonical multi-select contract exactly.
 */
export function isCanonicalMultiSelectScale(scale: Pick<QuestionScale, "selection_mode" | "options" | "prompt">) {
	if (scale.selection_mode !== "multiple") {
		return false;
	}
	if (scale.prompt !== SOCIABILITY_MULTI_SELECT_PROMPT) {
		return false;
	}
	if (scale.options.length !== SOCIABILITY_DIMENSION_KEYS.length) {
		return false;
	}

	return SOCIABILITY_DIMENSION_KEYS.every((dimensionKey, index) => {
		const option = scale.options[index];
		return (
			option?.key === dimensionKey &&
			option.label === SOCIABILITY_MULTI_SELECT_LABELS[dimensionKey] &&
			option.addition_value === SOCIABILITY_MULTI_SELECT_VALUE &&
			option.boost_value === SOCIABILITY_MULTI_SELECT_VALUE
		);
	});
}

/**
 * Apply the canonical Sociability multi-select to every assigned item of one language.
 *
 * Returns a new instrument; the caller keeps the original for the publish diff.
 */
export function applySociabilityMultiSelect(instrument: PlayspaceInstrument): PlayspaceInstrument {
	const next = structuredClone(instrument);

	next.scale_guidance = next.scale_guidance.map(guidance =>
		guidance.key === "sociability" ? buildCanonicalSociabilityGuidance(guidance) : guidance
	);

	for (const section of next.sections) {
		for (const question of section.questions) {
			question.scales = question.scales.map(scale =>
				scale.key === "sociability" ? buildCanonicalSociabilityScale(scale) : scale
			);
		}
	}

	return next;
}

/**
 * Apply the canonical Sociability multi-select across every language of one instrument version.
 *
 * Canonical option keys and `selection_mode` are structural, so they stay identical in every
 * language. Translated labels are not invented here - a locale that still shows English copy is
 * reported by {@link findUntranslatedSociabilityLabels} for manager approval before activation.
 */
export function applySociabilityMultiSelectToContent(content: InstrumentContent): InstrumentContent {
	const next: InstrumentContent = {};
	for (const [lang, instrument] of Object.entries(content)) {
		next[lang] = applySociabilityMultiSelect(instrument);
	}
	return next;
}

/**
 * Validate the Sociability multi-select contract for one instrument.
 *
 * Returns every violation so the editor can block publish with a specific message instead of
 * letting the backend reject the whole payload with one opaque 422.
 */
export function validateSociabilityMultiSelect(instrument: PlayspaceInstrument): readonly SociabilityValidationIssue[] {
	const issues: SociabilityValidationIssue[] = [];

	const checkScale = (
		scale: Pick<QuestionScale, "selection_mode" | "options" | "prompt">,
		location: string
	): void => {
		if (scale.selection_mode !== "multiple") {
			return;
		}

		const optionKeys = scale.options.map(option => option.key);
		if (optionKeys.some(optionKey => optionKey.trim().length === 0)) {
			issues.push({ code: "empty_option_keys", location });
		}
		if (new Set(optionKeys).size !== optionKeys.length) {
			issues.push({ code: "duplicate_option_keys", location });
		}
		if (
			optionKeys.length !== SOCIABILITY_DIMENSION_KEYS.length ||
			!SOCIABILITY_DIMENSION_KEYS.every((dimensionKey, index) => optionKeys[index] === dimensionKey)
		) {
			issues.push({ code: "wrong_option_keys", location });
			return;
		}
		if (
			scale.options.some(
				option =>
					option.addition_value !== SOCIABILITY_MULTI_SELECT_VALUE ||
					option.boost_value !== SOCIABILITY_MULTI_SELECT_VALUE
			)
		) {
			issues.push({ code: "wrong_option_values", location });
		}
		if (scale.prompt !== SOCIABILITY_MULTI_SELECT_PROMPT) {
			issues.push({ code: "wrong_prompt", location });
		}
		if (
			SOCIABILITY_DIMENSION_KEYS.some(
				(dimensionKey, index) => scale.options[index]?.label !== SOCIABILITY_MULTI_SELECT_LABELS[dimensionKey]
			)
		) {
			issues.push({ code: "wrong_labels", location });
		}
	};

	for (const guidance of instrument.scale_guidance) {
		if (guidance.key === "sociability") {
			checkScale(guidance, "Scale guidance → Sociability");
		}
	}

	for (const section of instrument.sections) {
		for (const question of section.questions) {
			for (const scale of question.scales) {
				if (scale.key === "sociability") {
					checkScale(scale, `${section.title} → ${question.question_key}`);
				}
			}
		}
	}

	return issues;
}

/**
 * List the non-base languages whose Sociability copy is still the English source text.
 *
 * Instrument translations are manager-supplied. Surfacing the gap keeps activation honest instead
 * of shipping English strings inside a localized instrument.
 */
export function findUntranslatedSociabilityLabels(content: InstrumentContent, baseLang: string): readonly Lang[] {
	const untranslated: Lang[] = [];

	for (const [lang, instrument] of Object.entries(content)) {
		if (lang === baseLang) {
			continue;
		}

		const usesEnglishCopy = instrument.sections.some(section =>
			section.questions.some(question =>
				question.scales.some(
					scale =>
						scale.key === "sociability" &&
						scale.selection_mode === "multiple" &&
						(scale.prompt === SOCIABILITY_MULTI_SELECT_PROMPT ||
							scale.options.some(option => option.label === SOCIABILITY_MULTI_SELECT_LABELS[option.key]))
				)
			)
		);

		if (usesEnglishCopy) {
			untranslated.push(lang as Lang);
		}
	}

	return untranslated;
}

/**
 * Report whether any language of a version uses a multiple-selection scale.
 *
 * Activation of such a version requires web and mobile clients that render checkbox answers.
 */
export function contentUsesMultipleSelection(content: InstrumentContent): boolean {
	return Object.values(content).some(instrument =>
		instrument.sections.some(section =>
			section.questions.some(question => question.scales.some(scale => scale.selection_mode === "multiple"))
		)
	);
}

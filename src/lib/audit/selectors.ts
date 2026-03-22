import type {
	AuditSession,
	ExecutionMode,
	InstrumentQuestion,
	InstrumentSection,
	PlayspaceInstrument,
	PreAuditQuestion,
	QuestionScale
} from "@/types/audit";

export interface InstrumentSectionLocalProgress {
	readonly visibleQuestionCount: number;
	readonly answeredQuestionCount: number;
	readonly isComplete: boolean;
}

/**
 * Filter instrument sections down to those visible in the active execution mode.
 */
export function getVisibleSections(
	instrument: PlayspaceInstrument,
	executionMode: ExecutionMode | null
): InstrumentSection[] {
	if (executionMode === null) {
		return [];
	}

	return instrument.sections
		.map(section => ({
			...section,
			questions: getVisibleQuestions(section.questions, executionMode)
		}))
		.filter(section => section.questions.length > 0);
}

/**
 * Filter questions down to those visible for one execution mode.
 */
export function getVisibleQuestions(
	questions: readonly InstrumentQuestion[],
	executionMode: ExecutionMode
): InstrumentQuestion[] {
	if (executionMode === "both") {
		return [...questions];
	}

	return questions.filter(question => question.mode === "both" || question.mode === executionMode);
}

/**
 * Read the stored pre-audit values from the raw audit payload.
 */
export function getPreAuditValues(auditSession: AuditSession): Record<string, string | string[]> {
	return {
		season: auditSession.pre_audit.season ?? "",
		weather_conditions: [...auditSession.pre_audit.weather_conditions],
		users_present: [...auditSession.pre_audit.users_present],
		user_count: auditSession.pre_audit.user_count ?? "",
		age_groups: [...auditSession.pre_audit.age_groups],
		place_size: auditSession.pre_audit.place_size ?? ""
	};
}

/**
 * Read one question's selected scale answers.
 */
export function getQuestionAnswers(
	auditSession: AuditSession,
	sectionKey: string,
	questionKey: string
): Record<string, string> {
	return auditSession.sections[sectionKey]?.responses[questionKey] ?? {};
}

/**
 * List scale keys the user must answer for one question, given current selections.
 */
export function getActiveScaleKeysForQuestion(
	question: InstrumentQuestion,
	selectedAnswers: Record<string, string>
): readonly string[] {
	if (question.scales.length === 0) {
		return [];
	}

	const quantityScale = question.scales[0];
	if (quantityScale === undefined) {
		return [];
	}

	const selectedQuantityKey = selectedAnswers[quantityScale.key];
	const selectedQuantityOption = quantityScale.options.find(option => option.key === selectedQuantityKey);
	const showFollowUpScales = selectedQuantityOption?.allows_follow_up_scales === true;
	const keys: string[] = [quantityScale.key];

	if (showFollowUpScales) {
		for (let index = 1; index < question.scales.length; index += 1) {
			const scale = question.scales[index];
			if (scale !== undefined) {
				keys.push(scale.key);
			}
		}
	}

	return keys;
}

/**
 * Whether every visible scale for the question has a selected option.
 */
export function isInstrumentQuestionComplete(
	question: InstrumentQuestion,
	selectedAnswers: Record<string, string>
): boolean {
	if (question.scales.length === 0) {
		return false;
	}

	const requiredKeys = getActiveScaleKeysForQuestion(question, selectedAnswers);
	if (requiredKeys.length === 0) {
		return false;
	}

	return requiredKeys.every(scaleKey => {
		const value = selectedAnswers[scaleKey];
		return typeof value === "string" && value.trim().length > 0;
	});
}

/**
 * Aggregate answered count and completion for one section using local draft responses.
 */
export function getInstrumentSectionLocalProgress(
	section: InstrumentSection,
	responses: Record<string, Record<string, string>>
): InstrumentSectionLocalProgress {
	const visibleQuestionCount = section.questions.length;
	let answeredQuestionCount = 0;

	for (const question of section.questions) {
		const selectedAnswers = responses[question.question_key] ?? {};
		if (isInstrumentQuestionComplete(question, selectedAnswers)) {
			answeredQuestionCount += 1;
		}
	}

	return {
		visibleQuestionCount,
		answeredQuestionCount,
		isComplete: visibleQuestionCount > 0 && answeredQuestionCount === visibleQuestionCount
	};
}

/**
 * Determine whether one pre-audit question is complete.
 */
export function isPreAuditQuestionComplete(question: PreAuditQuestion, value: string | string[] | undefined): boolean {
	if (!question.required) {
		return true;
	}

	if (question.input_type === "auto_timestamp") {
		return true;
	}

	if (question.input_type === "multi_select") {
		return Array.isArray(value) && value.some(optionValue => optionValue.trim().length > 0);
	}

	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Determine whether every required pre-audit field is complete.
 */
export function isRequiredPreAuditComplete(
	questions: readonly PreAuditQuestion[],
	values: Record<string, string | string[]>
): boolean {
	return questions.every(question => isPreAuditQuestionComplete(question, values[question.key]));
}

/**
 * Apply one option selection and clear gated follow-up answers when needed.
 */
export function buildNextQuestionAnswers(
	currentAnswers: Record<string, string>,
	question: { readonly scales: readonly QuestionScale[] },
	scaleKey: string,
	optionKey: string
): Record<string, string> {
	const nextAnswers: Record<string, string> = {
		...currentAnswers,
		[scaleKey]: optionKey
	};

	if (scaleKey !== "quantity") {
		return nextAnswers;
	}

	const quantityScale = question.scales.find(scale => scale.key === "quantity");
	const selectedOption = quantityScale?.options.find(option => option.key === optionKey);
	if (selectedOption?.allows_follow_up_scales !== false) {
		return nextAnswers;
	}

	return { quantity: optionKey };
}

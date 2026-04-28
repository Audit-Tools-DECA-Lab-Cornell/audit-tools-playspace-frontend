import type {
	AuditScoreTotals,
	AuditSession,
	AuditStatus,
	ExecutionMode,
	InstrumentQuestion,
	PlayspaceInstrument,
	QuestionResponsePayload,
	QuestionScale,
	ScaleOption
} from "@/types/audit";

// ── Exported Types ──────────────────────────────────────────────────────

/** File formats supported by the browser export flow. */
export type AuditExportFormat = "pdf" | "csv" | "xlsx";

/**
 * Optional place-level context not present on the audit session payload
 * itself. Used to populate locality fields in export documents.
 */
export interface AuditExportContext {
	readonly projectName: string;
	readonly city: string | null;
	readonly province: string | null;
	readonly country: string | null;
}

/**
 * Anonymous auditor metadata that is safe to include in exports.
 * Does not contain backend UUIDs or PII beyond the auditor code.
 */
export interface ExportAuditorProfile {
	readonly auditorCode: string;
	readonly ageRange: string | null;
	readonly gender: string | null;
	readonly country: string | null;
	readonly role: string | null;
}

/**
 * One submitted audit bundled with the extra context needed for exports.
 * Consumers build this from the audit session + place + profile data.
 */
export interface ExportableAudit {
	readonly auditSession: AuditSession;
	readonly context: AuditExportContext | null;
	readonly auditorProfile: ExportAuditorProfile | null;
}

// ── Internal Types & Constants ──────────────────────────────────────────

type SpreadsheetCell = string | number;
type SpreadsheetRow = readonly SpreadsheetCell[];

interface MultiplierScaleScore {
	readonly columnTotal: number;
	readonly boostValue: number;
}

/** Column headers for the PVUA response matrix, matching the reference workbook. */
const SINGLE_RESPONSE_HEADERS = [
	"ID_Number",
	"Survey or Audit",
	"Construct",
	"Domain",
	"Domain Description",
	"Instructions",
	"Items",
	"Provision",
	"Diversity",
	"Sociability",
	"Challenge Opportunities",
	"Play Value (PV) Construct Score",
	"Usability (U) Construct Score",
	"Auditor Comment"
] as const;

const INVALID_SHEET_NAME_CHARACTERS = [":", "\\", "/", "?", "*", "[", "]"] as const;

/** Warm terracotta used for PDF table header backgrounds. */
const PDF_HEADER_RGB: [number, number, number] = [180, 83, 9];
const PDF_HEADER_TEXT_RGB: [number, number, number] = [255, 255, 255];
const PDF_ALT_ROW_RGB: [number, number, number] = [248, 250, 252];

const EMPTY_SCORE_TOTALS: AuditScoreTotals = {
	provision_total: 0,
	provision_total_max: 0,
	diversity_total: 0,
	diversity_total_max: 0,
	challenge_total: 0,
	challenge_total_max: 0,
	sociability_total: 0,
	sociability_total_max: 0,
	play_value_total: 0,
	play_value_total_max: 0,
	usability_total: 0,
	usability_total_max: 0
};

// ── Score Calculation Helpers ───────────────────────────────────────────

/**
 * Create a new zeroed score bucket that mirrors the backend contract.
 */
function createEmptyScoreTotals(): AuditScoreTotals {
	return { ...EMPTY_SCORE_TOTALS };
}

/**
 * Add two score buckets together while preserving raw and max totals.
 */
function addScoreTotals(left: AuditScoreTotals, right: AuditScoreTotals): AuditScoreTotals {
	return {
		provision_total: left.provision_total + right.provision_total,
		provision_total_max: left.provision_total_max + right.provision_total_max,
		diversity_total: left.diversity_total + right.diversity_total,
		diversity_total_max: left.diversity_total_max + right.diversity_total_max,
		challenge_total: left.challenge_total + right.challenge_total,
		challenge_total_max: left.challenge_total_max + right.challenge_total_max,
		sociability_total: left.sociability_total + right.sociability_total,
		sociability_total_max: left.sociability_total_max + right.sociability_total_max,
		play_value_total: left.play_value_total + right.play_value_total,
		play_value_total_max: left.play_value_total_max + right.play_value_total_max,
		usability_total: left.usability_total + right.usability_total,
		usability_total_max: left.usability_total_max + right.usability_total_max
	};
}

function findScale(question: InstrumentQuestion, scaleKey: QuestionScale["key"]): QuestionScale | undefined {
	return question.scales.find(scale => scale.key === scaleKey);
}

function findScaleOption(scale: QuestionScale, optionKey: string): ScaleOption | undefined {
	return scale.options.find(option => option.key === optionKey);
}

function readProvisionScaleMaximum(question: InstrumentQuestion): number {
	const scale = findScale(question, "provision");
	if (scale === undefined) {
		return 0;
	}
	return scale.options.reduce((max, option) => Math.max(max, option.addition_value), 0);
}

function readMultiplierScaleScore(
	question: InstrumentQuestion,
	answers: QuestionResponsePayload,
	scaleKey: "diversity" | "challenge"
): MultiplierScaleScore {
	const scale = findScale(question, scaleKey);
	const rawAnswer = answers[scaleKey];
	const answerKey = typeof rawAnswer === "string" ? rawAnswer : undefined;
	if (scale === undefined || answerKey === undefined) {
		return { columnTotal: 0, boostValue: 1 };
	}

	const selectedOption = findScaleOption(scale, answerKey);
	if (selectedOption === undefined) {
		return { columnTotal: 0, boostValue: 1 };
	}

	const columnTotal = Math.max(selectedOption.addition_value - 1, 0);
	if (selectedOption.addition_value <= 0) {
		return { columnTotal, boostValue: 1 };
	}

	return { columnTotal, boostValue: selectedOption.boost_value };
}

function readMultiplierScaleMaximum(
	question: InstrumentQuestion,
	scaleKey: "diversity" | "challenge"
): MultiplierScaleScore {
	const scale = findScale(question, scaleKey);
	if (scale === undefined) {
		return { columnTotal: 0, boostValue: 1 };
	}

	const columnTotal = scale.options.reduce((max, option) => Math.max(max, Math.max(option.addition_value - 1, 0)), 0);
	const boostValue = scale.options.reduce((max, option) => Math.max(max, option.boost_value), 1);
	return { columnTotal, boostValue };
}

function readSociabilityScaleScore(question: InstrumentQuestion, answers: QuestionResponsePayload): number {
	const scale = findScale(question, "sociability");
	const rawAnswer = answers.sociability;
	const answerKey = typeof rawAnswer === "string" ? rawAnswer : undefined;
	if (scale === undefined || answerKey === undefined) {
		return 0;
	}

	const selectedOption = findScaleOption(scale, answerKey);
	if (selectedOption === undefined) {
		return 0;
	}

	return Math.max(selectedOption.addition_value - 1, 0);
}

function readSociabilityScaleMaximum(question: InstrumentQuestion): number {
	const scale = findScale(question, "sociability");
	if (scale === undefined) {
		return 0;
	}
	return scale.options.reduce((max, option) => Math.max(max, Math.max(option.addition_value - 1, 0)), 0);
}

/**
 * Calculate one question's raw and maximum score totals using the same
 * rules as the backend scoring engine.
 */
function calculateQuestionScores(question: InstrumentQuestion, answers: QuestionResponsePayload): AuditScoreTotals {
	if (question.question_type !== "scaled" || question.scales.length === 0) {
		return createEmptyScoreTotals();
	}

	const provisionScale = findScale(question, "provision");
	const rawProvisionAnswer = answers.provision;
	const provisionAnswerKey = typeof rawProvisionAnswer === "string" ? rawProvisionAnswer : undefined;
	const provisionOption =
		provisionScale === undefined || provisionAnswerKey === undefined
			? undefined
			: findScaleOption(provisionScale, provisionAnswerKey);

	const provisionTotal = provisionOption?.addition_value ?? 0;
	const provisionTotalMax = readProvisionScaleMaximum(question);
	const shouldReadFollowUpScales = provisionOption?.allows_follow_up_scales === true;

	const diversityScore = shouldReadFollowUpScales
		? readMultiplierScaleScore(question, answers, "diversity")
		: { columnTotal: 0, boostValue: 1 };
	const challengeScore = shouldReadFollowUpScales
		? readMultiplierScaleScore(question, answers, "challenge")
		: { columnTotal: 0, boostValue: 1 };
	const sociabilityTotal = shouldReadFollowUpScales ? readSociabilityScaleScore(question, answers) : 0;

	const diversityMaximum = readMultiplierScaleMaximum(question, "diversity");
	const challengeMaximum = readMultiplierScaleMaximum(question, "challenge");
	const sociabilityTotalMax = readSociabilityScaleMaximum(question);

	const constructTotal = provisionTotal * diversityScore.boostValue * challengeScore.boostValue;
	const constructTotalMax = provisionTotalMax * diversityMaximum.boostValue * challengeMaximum.boostValue;

	return {
		provision_total: provisionTotal,
		provision_total_max: provisionTotalMax,
		diversity_total: diversityScore.columnTotal,
		diversity_total_max: diversityMaximum.columnTotal,
		challenge_total: challengeScore.columnTotal,
		challenge_total_max: challengeMaximum.columnTotal,
		sociability_total: sociabilityTotal,
		sociability_total_max: sociabilityTotalMax,
		play_value_total: question.constructs.includes("play_value") ? constructTotal : 0,
		play_value_total_max: question.constructs.includes("play_value") ? constructTotalMax : 0,
		usability_total: question.constructs.includes("usability") ? constructTotal : 0,
		usability_total_max: question.constructs.includes("usability") ? constructTotalMax : 0
	};
}

/**
 * Format a numeric result as a percentage of its maximum possible score.
 */
function formatPercentage(value: number, maximum: number): string {
	if (maximum <= 0) {
		return "--";
	}
	const percentage = (value / maximum) * 100;
	const rounded = Math.round(percentage * 10) / 10;
	return Number.isInteger(rounded) ? `${rounded.toFixed(0)}%` : `${rounded.toFixed(1)}%`;
}

/**
 * Format one raw score value for compact display surfaces.
 * Integers stay as-is; decimals are shown with one decimal place.
 */
function formatScoreValue(value: number): string {
	return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

// ── Formatting Helpers ──────────────────────────────────────────────────

function roundToTwoDecimals(value: number): number {
	return Math.round(value * 100) / 100;
}

function formatNumericCell(value: number): string {
	return Number.isInteger(value) ? value.toString() : roundToTwoDecimals(value).toString();
}

function stringifyCell(cell: SpreadsheetCell): string {
	return typeof cell === "number" ? formatNumericCell(cell) : cell;
}

function stripPromptMarkup(value: string): string {
	return value.split("**").join("").trim();
}

function slugifySegment(value: string): string {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return normalized.length === 0 ? "audit" : normalized;
}

function sanitizeSheetName(value: string): string {
	let sanitized = value.trim();
	for (const invalidChar of INVALID_SHEET_NAME_CHARACTERS) {
		sanitized = sanitized.split(invalidChar).join("_");
	}
	if (sanitized.length === 0) {
		return "Sheet";
	}
	return sanitized.slice(0, 31);
}

function formatLocality(context: AuditExportContext | null): string {
	if (context === null) {
		return "";
	}
	return [context.city, context.province, context.country]
		.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
		.join(", ");
}

function formatAuditStatusLabel(status: AuditStatus): string {
	switch (status) {
		case "IN_PROGRESS":
			return "In progress";
		case "PAUSED":
			return "Paused";
		case "SUBMITTED":
			return "Submitted";
		default:
			return status;
	}
}

function resolveExecutionMode(auditSession: AuditSession): ExecutionMode | null {
	return auditSession.selected_execution_mode ?? auditSession.meta.execution_mode;
}

function formatExecutionModeLabel(auditSession: AuditSession, instrument: PlayspaceInstrument): string {
	const executionMode = resolveExecutionMode(auditSession);
	if (executionMode === null) {
		return "";
	}
	const matchedMode = instrument.execution_modes.find(mode => mode.key === executionMode);
	return matchedMode === undefined ? formatQuestionModeLabel(executionMode) : matchedMode.label;
}

function formatTimestampForDisplay(value: string | null): string {
	if (typeof value !== "string" || value.trim().length === 0) {
		return "";
	}
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) {
		return value;
	}
	return `${parsedDate.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function formatQuestionModeLabel(mode: ExecutionMode): string {
	switch (mode) {
		case "survey":
			return "Survey";
		case "audit":
			return "Audit";
		case "both":
			return "Survey + Audit";
		default:
			return mode;
	}
}

function formatConstructLabel(constructs: readonly InstrumentQuestion["constructs"][number][]): string {
	const uniqueConstructs = Array.from(new Set(constructs));
	if (uniqueConstructs.length === 0) {
		return "";
	}
	if (uniqueConstructs.length > 1) {
		return "Both";
	}
	return uniqueConstructs[0] === "play_value" ? "Play Value" : "Usability";
}

function formatQuestionDomainLabel(question: InstrumentQuestion): string {
	return question.domains.map(domain => questionDomainFallback(domain)).join(" | ");
}

function questionDomainFallback(value: string): string {
	return stripPromptMarkup(value).trim();
}

function formatQuestionAnswer(
	question: InstrumentQuestion,
	scaleKey: QuestionScale["key"],
	answerKey: string | undefined
): string {
	if (typeof answerKey !== "string" || answerKey.trim().length === 0) {
		return "";
	}
	const scale = question.scales.find(s => s.key === scaleKey);
	if (scale === undefined) {
		return answerKey;
	}
	const option = scale.options.find(o => o.key === answerKey);
	if (option === undefined) {
		return answerKey;
	}
	return formatOptionScoreLabel(option);
}

function formatChecklistAnswer(question: InstrumentQuestion, answers: QuestionResponsePayload): string {
	const selectedKeys = answers["selected_option_keys"];
	if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
		return "";
	}

	const labels: string[] = selectedKeys
		.filter((key): key is string => typeof key === "string")
		.map(key => {
			const option = question.options.find(o => o.key === key);
			return option?.label ?? key;
		});

	const otherDetails = answers["other_details"];
	if (typeof otherDetails === "object" && otherDetails !== null && !Array.isArray(otherDetails)) {
		const textValue = otherDetails["text"];
		if (typeof textValue === "string" && textValue.trim().length > 0) {
			labels.push(`Other: ${textValue.trim()}`);
		}
	}

	return labels.join(" | ");
}

function formatOptionScoreLabel(option: ScaleOption): string {
	const scoreText = formatScaleScoreText(option);
	const label = stripPromptMarkup(option.label);
	return scoreText.length === 0 ? label : `${label} (${scoreText})`;
}

function formatScaleScoreText(option: ScaleOption): string {
	const additionText = formatNumericCell(option.addition_value);
	const boostText = formatNumericCell(option.boost_value);
	return additionText === boostText ? additionText : `${additionText}, ${boostText}`;
}

function deriveSummaryScore(auditSession: AuditSession): number | string {
	const overall = auditSession.scores.overall;
	if (overall === null) {
		return "Pending";
	}
	return roundToTwoDecimals(overall.play_value_total + overall.usability_total);
}

function isQuestionVisible(
	question: InstrumentQuestion,
	executionMode: ExecutionMode | null,
	sectionResponses: Record<string, QuestionResponsePayload>
): boolean {
	if (executionMode !== null && question.mode !== "both" && question.mode !== executionMode) {
		return false;
	}

	if (question.display_if === null || question.display_if === undefined) {
		return true;
	}

	const parentAnswers = sectionResponses[question.display_if.question_key];
	if (parentAnswers === undefined) {
		return false;
	}

	const selectedValue = parentAnswers[question.display_if.response_key];
	if (typeof selectedValue === "string") {
		return question.display_if.any_of_option_keys.includes(selectedValue);
	}

	if (Array.isArray(selectedValue)) {
		const displayCondition = question.display_if;
		return selectedValue.some(entry => {
			return typeof entry === "string" && displayCondition.any_of_option_keys.includes(entry);
		});
	}

	return false;
}

function validateExportableAudit(exportableAudit: ExportableAudit): void {
	if (exportableAudit.auditSession.status !== "SUBMITTED") {
		throw new Error("Only submitted audits can be exported.");
	}
}

// ── Workbook Row Builders ───────────────────────────────────────────────

/**
 * Build key/value overview rows for one submitted audit. Used by the
 * Excel "Overview" sheet and PDF score header.
 */
function buildOverviewRows(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly SpreadsheetRow[] {
	const { auditSession, context, auditorProfile } = exportableAudit;
	const overallScores = auditSession.scores.overall;

	return [
		["Field", "Value"],
		["Instrument", `${instrument.instrument_name} v${instrument.instrument_version}`],
		["Audit Code", auditSession.audit_code],
		["Place Name", auditSession.place_name],
		["Project Name", auditSession.project_name],
		["Locality", formatLocality(context)],
		["Status", formatAuditStatusLabel(auditSession.status)],
		["Execution Mode", formatExecutionModeLabel(auditSession, instrument)],
		["Started At", formatTimestampForDisplay(auditSession.started_at)],
		["Submitted At", formatTimestampForDisplay(auditSession.submitted_at)],
		["Total Minutes", auditSession.total_minutes ?? "Pending"],
		["Summary Score", deriveSummaryScore(auditSession)],
		["Play Value Total", overallScores?.play_value_total ?? "Pending"],
		["Usability Total", overallScores?.usability_total ?? "Pending"],
		["Provision Total", overallScores?.provision_total ?? "Pending"],
		["Diversity Total", overallScores?.diversity_total ?? "Pending"],
		["Sociability Total", overallScores?.sociability_total ?? "Pending"],
		["Challenge Total", overallScores?.challenge_total ?? "Pending"],
		["Auditor Code", auditorProfile?.auditorCode ?? ""],
		["Auditor Country", auditorProfile?.country ?? ""],
		["Auditor Gender", auditorProfile?.gender ?? ""],
		["Auditor Age", auditorProfile?.ageRange ?? ""],
		["Auditor Role", auditorProfile?.role ?? ""]
	];
}

/**
 * Build detailed PVUA-style response rows for one audit, including
 * section headers, per-question scale answers, notes, and score summaries.
 */
function buildSingleAuditResponseRows(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly SpreadsheetRow[] {
	const { auditSession } = exportableAudit;
	const executionMode = resolveExecutionMode(auditSession);
	const rows: SpreadsheetRow[] = [];
	let overallTotals = createEmptyScoreTotals();

	for (const [sectionIndex, section] of instrument.sections.entries()) {
		const sectionResponses = auditSession.sections[section.section_key]?.responses ?? {};
		const visibleQuestions = section.questions.filter(question =>
			isQuestionVisible(question, executionMode, sectionResponses)
		);
		if (visibleQuestions.length === 0) {
			continue;
		}

		const sectionState = auditSession.sections[section.section_key];
		let sectionTotals = createEmptyScoreTotals();
		rows.push(buildSectionHeaderRow(sectionIndex, section.title, section.description, section.instruction));

		for (const [questionIndex, question] of visibleQuestions.entries()) {
			const questionAnswers = sectionState?.responses[question.question_key] ?? {};
			const questionScores = calculateQuestionScores(question, questionAnswers);
			rows.push(buildQuestionResponseRow(sectionIndex, questionIndex, question, questionAnswers, questionScores));
			sectionTotals = addScoreTotals(sectionTotals, questionScores);
		}

		const sectionNote = sectionState?.note ?? "";
		const notesPrompt = typeof section.notes_prompt === "string" ? stripPromptMarkup(section.notes_prompt) : "";
		if (notesPrompt.length > 0 || sectionNote.trim().length > 0) {
			rows.push(
				buildSectionNoteRow(
					sectionIndex,
					visibleQuestions.length + 1,
					questionDomainFallback(section.title),
					notesPrompt,
					sectionNote
				)
			);
		}

		rows.push(...buildSectionSummaryRows(sectionTotals));
		overallTotals = addScoreTotals(overallTotals, sectionTotals);
	}

	if (rows.length > 0) {
		rows.push(buildEmptyResponseRow());
		rows.push(...buildOverallSummaryRows(overallTotals));
	}

	return rows;
}

function buildSectionHeaderRow(
	sectionIndex: number,
	title: string,
	description: string | null | undefined,
	instruction: string
): SpreadsheetRow {
	return [
		(sectionIndex + 1).toString(),
		"",
		"",
		questionDomainFallback(title),
		typeof description === "string" ? stripPromptMarkup(description) : "",
		stripPromptMarkup(instruction),
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		""
	];
}

function buildQuestionResponseRow(
	sectionIndex: number,
	questionIndex: number,
	question: InstrumentQuestion,
	answers: QuestionResponsePayload,
	questionScores: AuditScoreTotals
): SpreadsheetRow {
	if (question.question_type === "checklist") {
		return [
			`${sectionIndex + 1}.${questionIndex + 1}`,
			formatQuestionModeLabel(question.mode),
			formatConstructLabel(question.constructs),
			formatQuestionDomainLabel(question),
			"",
			"",
			stripPromptMarkup(question.prompt),
			formatChecklistAnswer(question, answers),
			"",
			"",
			"",
			"N/A",
			"N/A",
			""
		];
	}

	const rawProvision = answers.provision;
	const rawDiversity = answers.diversity;
	const rawSociability = answers.sociability;
	const rawChallenge = answers.challenge;

	return [
		`${sectionIndex + 1}.${questionIndex + 1}`,
		formatQuestionModeLabel(question.mode),
		formatConstructLabel(question.constructs),
		formatQuestionDomainLabel(question),
		"",
		"",
		stripPromptMarkup(question.prompt),
		formatQuestionAnswer(question, "provision", typeof rawProvision === "string" ? rawProvision : undefined),
		formatQuestionAnswer(question, "diversity", typeof rawDiversity === "string" ? rawDiversity : undefined),
		formatQuestionAnswer(question, "sociability", typeof rawSociability === "string" ? rawSociability : undefined),
		formatQuestionAnswer(question, "challenge", typeof rawChallenge === "string" ? rawChallenge : undefined),
		question.constructs.includes("play_value") ? questionScores.play_value_total : "N/A",
		question.constructs.includes("usability") ? questionScores.usability_total : "N/A",
		""
	];
}

function buildSectionNoteRow(
	sectionIndex: number,
	noteIndex: number,
	domainLabel: string,
	notesPrompt: string,
	submittedComment: string
): SpreadsheetRow {
	return [
		`${sectionIndex + 1}.${noteIndex}`,
		"",
		"",
		domainLabel,
		"",
		notesPrompt,
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		submittedComment.trim()
	];
}

function buildSectionSummaryRows(totals: AuditScoreTotals): readonly SpreadsheetRow[] {
	return [
		buildScoreSummaryRow("Total", "Raw Scores", totals, "raw"),
		buildScoreSummaryRow("Max", "Max Possible", totals, "maximum"),
		buildScoreSummaryRow("%", "Final Percentage", totals, "percentage")
	];
}

function buildOverallSummaryRows(totals: AuditScoreTotals): readonly SpreadsheetRow[] {
	return [
		buildScoreSummaryRow("Overall Total", "Raw Scores", totals, "raw"),
		buildScoreSummaryRow("Overall Max", "Max Possible", totals, "maximum"),
		buildScoreSummaryRow("Overall %", "Final Percentage", totals, "percentage")
	];
}

function buildScoreSummaryRow(
	idLabel: string,
	modeLabel: string,
	totals: AuditScoreTotals,
	rowKind: "raw" | "maximum" | "percentage"
): SpreadsheetRow {
	if (rowKind === "raw") {
		return [
			idLabel,
			modeLabel,
			"Summary",
			"",
			"",
			"",
			"",
			totals.provision_total,
			totals.diversity_total,
			totals.sociability_total,
			totals.challenge_total,
			totals.play_value_total,
			totals.usability_total,
			""
		];
	}

	if (rowKind === "maximum") {
		return [
			idLabel,
			modeLabel,
			"Summary",
			"",
			"",
			"",
			"",
			totals.provision_total_max,
			totals.diversity_total_max,
			totals.sociability_total_max,
			totals.challenge_total_max,
			totals.play_value_total_max,
			totals.usability_total_max,
			""
		];
	}

	return [
		idLabel,
		modeLabel,
		"Summary",
		"",
		"",
		"",
		"",
		formatPercentage(totals.provision_total, totals.provision_total_max),
		formatPercentage(totals.diversity_total, totals.diversity_total_max),
		formatPercentage(totals.sociability_total, totals.sociability_total_max),
		formatPercentage(totals.challenge_total, totals.challenge_total_max),
		formatPercentage(totals.play_value_total, totals.play_value_total_max),
		formatPercentage(totals.usability_total, totals.usability_total_max),
		""
	];
}

function buildEmptyResponseRow(): SpreadsheetRow {
	return ["", "", "", "", "", "", "", "", "", "", "", "", "", ""];
}

// ── CSV Builder ─────────────────────────────────────────────────────────

/**
 * Serialize spreadsheet rows into RFC-4180-style CSV text with proper
 * escaping for commas, quotes, and newlines.
 */
function buildCsvText(rows: readonly SpreadsheetRow[]): string {
	return rows
		.map(row =>
			row
				.map(cell => {
					const text = stringifyCell(cell);
					return `"${text.replace(/"/g, '""')}"`;
				})
				.join(",")
		)
		.join("\n");
}

// ── Format Generators ───────────────────────────────────────────────────

/**
 * Build a PDF document with a portrait overview page followed by a
 * landscape response-matrix page using jsPDF and jspdf-autotable.
 */
async function generatePdfBlob(exportableAudit: ExportableAudit, instrument: PlayspaceInstrument): Promise<Blob> {
	const jsPDFModule = await import("jspdf");
	const jsPDF = jsPDFModule.default;
	const autoTableModule = await import("jspdf-autotable");
	const autoTable = autoTableModule.default;

	const { auditSession } = exportableAudit;
	const responseRows = buildSingleAuditResponseRows(exportableAudit, instrument);
	const overallScores = auditSession.scores.overall;

	const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

	/* ── Page 1: title & score overview ── */

	doc.setFontSize(18);
	doc.setTextColor(66, 66, 66);
	doc.text(`PVUA Export - ${auditSession.audit_code}`, 14, 20);

	doc.setFontSize(10);
	doc.setTextColor(100, 100, 100);

	const metaLines = [
		`Place: ${auditSession.place_name}`,
		`Project: ${auditSession.project_name}`,
		`Status: ${formatAuditStatusLabel(auditSession.status)}`,
		`Mode: ${formatExecutionModeLabel(auditSession, instrument)}`,
		`Started: ${formatTimestampForDisplay(auditSession.started_at)}`,
		`Submitted: ${formatTimestampForDisplay(auditSession.submitted_at)}`
	];
	let metaY = 30;
	for (const line of metaLines) {
		doc.text(line, 14, metaY);
		metaY += 6;
	}

	const scoreTableBody: string[][] = [
		["Summary Score", String(deriveSummaryScore(auditSession))],
		["Play Value Total", formatScoreValue(overallScores?.play_value_total ?? 0)],
		["Usability Total", formatScoreValue(overallScores?.usability_total ?? 0)],
		["Provision Total", formatScoreValue(overallScores?.provision_total ?? 0)],
		["Diversity Total", formatScoreValue(overallScores?.diversity_total ?? 0)],
		["Sociability Total", formatScoreValue(overallScores?.sociability_total ?? 0)],
		["Challenge Total", formatScoreValue(overallScores?.challenge_total ?? 0)]
	];

	autoTable(doc, {
		head: [["Score Metric", "Value"]],
		body: scoreTableBody,
		startY: metaY + 4,
		theme: "grid",
		styles: { fontSize: 9, cellPadding: 4 },
		headStyles: {
			fillColor: PDF_HEADER_RGB,
			textColor: PDF_HEADER_TEXT_RGB,
			fontStyle: "bold"
		},
		alternateRowStyles: { fillColor: PDF_ALT_ROW_RGB },
		margin: { left: 14, right: 14 }
	});

	/* ── Page 2+: response detail table (landscape) ── */

	doc.addPage("a4", "landscape");
	doc.setFontSize(12);
	doc.setTextColor(66, 66, 66);
	doc.text("PVUA Response Matrix", 14, 15);

	const responseHeaderStrings: string[] = SINGLE_RESPONSE_HEADERS.map(h => h);
	const responseBodyStrings: string[][] = responseRows.map(row => row.map(cell => stringifyCell(cell)));

	autoTable(doc, {
		head: [responseHeaderStrings],
		body: responseBodyStrings,
		startY: 20,
		theme: "grid",
		styles: {
			fontSize: 6,
			cellPadding: 2,
			overflow: "linebreak"
		},
		headStyles: {
			fillColor: PDF_HEADER_RGB,
			textColor: PDF_HEADER_TEXT_RGB,
			fontStyle: "bold",
			fontSize: 7,
			halign: "center"
		},
		alternateRowStyles: { fillColor: PDF_ALT_ROW_RGB },
		margin: { left: 10, right: 10 }
	});

	return doc.output("blob");
}

/**
 * Build an Excel workbook with an "Overview" metadata sheet and a
 * "Responses" detail sheet.
 */
async function generateXlsxBlob(exportableAudit: ExportableAudit, instrument: PlayspaceInstrument): Promise<Blob> {
	const XLSX = await import("xlsx");
	const overviewRows = buildOverviewRows(exportableAudit, instrument);
	const responseRows = buildSingleAuditResponseRows(exportableAudit, instrument);

	const workbook = XLSX.utils.book_new();

	const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows.map(row => [...row]));
	XLSX.utils.book_append_sheet(workbook, overviewSheet, sanitizeSheetName("Overview"));

	const responsesSheet = XLSX.utils.aoa_to_sheet([
		[...SINGLE_RESPONSE_HEADERS],
		...responseRows.map(row => [...row])
	]);
	XLSX.utils.book_append_sheet(workbook, responsesSheet, sanitizeSheetName("Responses"));

	const xlsxOutput: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
	return new Blob([xlsxOutput], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	});
}

/**
 * Build a CSV blob from the response matrix rows with properly escaped
 * values.
 */
function generateCsvBlob(exportableAudit: ExportableAudit, instrument: PlayspaceInstrument): Blob {
	const responseRows = buildSingleAuditResponseRows(exportableAudit, instrument);
	const allRows: SpreadsheetRow[] = [[...SINGLE_RESPONSE_HEADERS], ...responseRows];
	const csvContent = buildCsvText(allRows);
	return new Blob([csvContent], { type: "text/csv;charset=utf-8" });
}

// ── Browser Download ────────────────────────────────────────────────────

/**
 * Trigger a file download in the browser by creating a temporary anchor
 * element, clicking it, and cleaning up the object URL.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

// ── Exported Functions ──────────────────────────────────────────────────

/**
 * Generate and trigger a browser download for one submitted audit.
 *
 * Validates that the audit has been submitted, builds the requested file
 * format (PDF, Excel, or CSV), and triggers a download via a temporary
 * anchor element.
 *
 * @param exportableAudit Submitted audit with optional place context and auditor profile.
 * @param instrument Static PVUA instrument definition.
 * @param format Target file format.
 * @returns The generated file name for user feedback.
 */
export async function downloadSingleAuditExport(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument | null,
	format: AuditExportFormat
): Promise<string> {
	validateExportableAudit(exportableAudit);

	if (instrument === null) {
		throw new Error("An instrument definition is required for export.");
	}

	const fileName = buildExportFileName(exportableAudit.auditSession.audit_code, format);

	let blob: Blob;
	switch (format) {
		case "pdf":
			blob = await generatePdfBlob(exportableAudit, instrument);
			break;
		case "xlsx":
			blob = await generateXlsxBlob(exportableAudit, instrument);
			break;
		case "csv":
			blob = generateCsvBlob(exportableAudit, instrument);
			break;
		default:
			throw new Error(`Unsupported export format: ${String(format)}`);
	}

	triggerBrowserDownload(blob, fileName);
	return fileName;
}

/**
 * Build a standardized export file name from the audit code and format.
 *
 * @param auditCode Unique audit code identifier (e.g. "AUD-001").
 * @param format Target file format extension.
 * @returns Filesystem-safe file name with extension.
 */
export function buildExportFileName(auditCode: string, format: AuditExportFormat): string {
	const slug = slugifySegment(auditCode);
	return `pvua-${slug}.${format}`;
}

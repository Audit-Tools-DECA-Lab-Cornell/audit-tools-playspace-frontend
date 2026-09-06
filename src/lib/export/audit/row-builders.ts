/**
 * Spreadsheet row builders for the audit export pipeline.
 *
 * Produces the ordered rows that populate the Overview and Responses
 * worksheets/pages. All functions are pure: given the same inputs they return
 * identical outputs with no side effects.
 */

import {
	buildQuestionLookup,
	type ConstructSelection,
	getQuestionConstructKeys,
	isDefaultReportFilter,
	maskScoreTotalsByConstructSelection,
	questionMatchesReportFilter,
	type ReportResultFilter,
	resolveDomainConstructSelection,
	resolveQuestionConstructSelection
} from "@/lib/audit/report-filter";
import {
	buildConstructRankings,
	buildReportScoreProjection,
	buildVisibleQuestionEntries,
	formatConstructDomainLine,
	getQuestionDomainKeys
} from "@/lib/audit/report-helpers";
import {
	getCombinedReportLegend,
	getCombinedReportSources,
	getReportSourceLabel,
	type ReportSourceComponent
} from "@/lib/audit/report-source-sessions";
import { getEffectiveScoreTotals, hasUnsureVariants, type ScoreVariantKey } from "@/lib/audit/score-mode-helpers";
import { formatQuestionKeyForDisplay } from "@/lib/audit/selectors";
import {
	hasCanonicalSociabilityDimensionKeys,
	SOCIABILITY_DIMENSION_KEYS,
	type SociabilityDimensionKey,
	validateAndNormalizeMultipleScaleAnswer
} from "@/types/sociability";

import {
	formatAuditStatusLabel,
	formatChecklistAnswer,
	formatConstructLabel,
	formatExecutionModeLabel,
	formatLocality,
	formatPercentage,
	formatQuestionAnswer,
	formatQuestionDomainLabel,
	formatQuestionModeLabel,
	formatTimestampForDisplay,
	joinSpaceAuditDisplayValues,
	questionDomainFallback,
	readSpaceAuditQuestionValues,
	resolveSpaceAuditDisplayValues,
	stripPromptMarkup
} from "./format-utils";
import { addScoreTotals, calculateQuestionScores, createEmptyScoreTotals, deriveSummaryScore } from "./score-utils";
import type {
	AuditScoreTotals,
	ExportableAudit,
	PlayspaceInstrument,
	SpreadsheetRow,
	WorkbookRowMetadata
} from "./types";
import { SINGLE_RESPONSE_HEADERS } from "./types";

interface ResponseTableBuildResult {
	readonly rows: readonly SpreadsheetRow[];
	readonly rowMetadata: readonly (WorkbookRowMetadata | null)[];
}

export interface SociabilityResponseColumn {
	readonly dimensionKey: SociabilityDimensionKey;
	readonly header: string;
	readonly selected: boolean | null;
	readonly value: string;
}

export const SOCIABILITY_DIMENSION_LABELS: Readonly<Record<SociabilityDimensionKey, string>> = {
	play_alone: "Play Alone",
	small_group: "Small Group",
	large_group: "Large Group"
};

function formatVariantScoreRow(
	label: string,
	variant: ScoreVariantKey,
	auditSession: ExportableAudit["auditSession"],
	filteredTotals?: AuditScoreTotals | null
): SpreadsheetRow {
	const totals =
		filteredTotals === undefined ? getEffectiveScoreTotals(auditSession.scores, variant) : filteredTotals;
	if (totals === null) {
		return [label, "--"];
	}
	const summaryTotal = totals.play_value_total + totals.usability_total;
	const summaryMax = totals.play_value_total_max + totals.usability_total_max;
	return [
		label,
		`PV ${totals.play_value_total}/${totals.play_value_total_max} (${formatPercentage(totals.play_value_total, totals.play_value_total_max)}) · U ${totals.usability_total}/${totals.usability_total_max} (${formatPercentage(totals.usability_total, totals.usability_total_max)}) · Summary ${summaryTotal}/${summaryMax} (${formatPercentage(summaryTotal, summaryMax)})`
	];
}

// ── Overview sheet ────────────────────────────────────────────────────────────

/**
 * Builds the full row set for the "Overview" worksheet.
 * The first row is the header; subsequent rows are key/value pairs.
 */
export function buildOverviewRows(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly SpreadsheetRow[] {
	const { auditSession, context, auditorProfile } = exportableAudit;
	const projection = buildReportScoreProjection(auditSession, instrument, exportableAudit.resultFilter);
	const overallScores = projection.isFiltered ? projection.overall : auditSession.scores.overall;
	const combinedSources = getCombinedReportSources(auditSession);
	const finalComments = auditSession.meta.final_comments?.trim() ?? "";

	const sourceRows: SpreadsheetRow[] =
		combinedSources === null
			? []
			: [
					["Report Type", "Combined place report"],
					["Place Audit Submission", combinedSources.audit.audit_code],
					["Place Audit Auditor", combinedSources.audit.auditor_code],
					["Place Audit Started", formatTimestampForDisplay(combinedSources.audit.started_at)],
					["Place Audit Submitted", formatTimestampForDisplay(combinedSources.audit.submitted_at)],
					["Place Survey Submission", combinedSources.survey.audit_code],
					["Place Survey Auditor", combinedSources.survey.auditor_code],
					["Place Survey Started", formatTimestampForDisplay(combinedSources.survey.started_at)],
					["Place Survey Submitted", formatTimestampForDisplay(combinedSources.survey.submitted_at)],
					["Component Legend", getCombinedReportLegend()]
				];

	const auditorRows: SpreadsheetRow[] =
		combinedSources === null
			? [
					["Auditor Code", auditorProfile?.auditorCode ?? ""],
					["Auditor Country", auditorProfile?.country ?? ""],
					["Auditor Gender", auditorProfile?.gender ?? ""],
					["Auditor Age", auditorProfile?.ageRange ?? ""],
					["Auditor Role", auditorProfile?.role ?? ""]
				]
			: [];

	const summaryMetadataRows: SpreadsheetRow[] =
		combinedSources === null
			? [
					["Execution Mode", formatExecutionModeLabel(auditSession, instrument)],
					["Started At", formatTimestampForDisplay(auditSession.started_at)],
					["Submitted At", formatTimestampForDisplay(auditSession.submitted_at)]
				]
			: [];

	const unsureRows: SpreadsheetRow[] =
		projection.unsureAnswerCount > 0 && hasUnsureVariants(auditSession.scores)
			? [
					["Unsure Answers", projection.unsureAnswerCount],
					formatVariantScoreRow(
						"Unsure Excluded",
						"canonical",
						auditSession,
						projection.isFiltered ? projection.overall : undefined
					),
					formatVariantScoreRow(
						"Unsure As Zero",
						"unsure_as_zero",
						auditSession,
						projection.isFiltered
							? buildReportScoreProjection(auditSession, instrument, projection.filter, "unsure_as_zero")
									.overall
							: undefined
					),
					formatVariantScoreRow(
						"Unsure As Maximum",
						"unsure_as_max",
						auditSession,
						projection.isFiltered
							? buildReportScoreProjection(auditSession, instrument, projection.filter, "unsure_as_max")
									.overall
							: undefined
					)
				]
			: [];
	const resultsIncludedRows: SpreadsheetRow[] = projection.isFiltered
		? [
				["Results Included", describeResultFilter(projection.filter)],
				...(projection.visibleConstructs.playValue !== projection.visibleConstructs.usability
					? [
							[
								"Shared-scale scope",
								projection.visibleConstructs.playValue
									? "Totals cover Play Value results only."
									: "Totals cover Usability results only."
							] as SpreadsheetRow
						]
					: [])
			]
		: [];
	const domainRows: SpreadsheetRow[] = projection.isFiltered
		? projection.domainRows.flatMap(domain => {
				const totals = domain.scoreTotals;
				if (totals === null) {
					return [[`Domain: ${domain.domainTitle}`, "No included scored results"]];
				}
				const selection = resolveDomainConstructSelection(projection.filter, domain.domainKey);
				const coverage = projection.domainCoverage[domain.domainKey] ?? {
					playValue: false,
					usability: false
				};
				const values = [
					...(selection.playValue && coverage.playValue
						? [`PV ${formatConstructDomainLine(totals.play_value_total, totals.play_value_total_max)}`]
						: []),
					...(selection.usability && coverage.usability
						? [`U ${formatConstructDomainLine(totals.usability_total, totals.usability_total_max)}`]
						: []),
					`Provision ${formatConstructDomainLine(totals.provision_total, totals.provision_total_max)}`,
					`Variety ${formatConstructDomainLine(totals.variety_total, totals.variety_total_max)}`,
					`Sociability ${formatConstructDomainLine(totals.sociability_total, totals.sociability_total_max)}`,
					`Challenge ${formatConstructDomainLine(totals.challenge_total, totals.challenge_total_max)}`
				];
				return [[`Domain: ${domain.domainTitle}`, values.join(" · ")]];
			})
		: [];
	const rankingRows: SpreadsheetRow[] = projection.isFiltered
		? buildConstructRankings([...projection.domainRows]).flatMap(ranking => {
				if (
					(ranking.constructKey === "play_value" && !projection.visibleConstructs.playValue) ||
					(ranking.constructKey === "usability" && !projection.visibleConstructs.usability)
				) {
					return [];
				}
				const label = ranking.constructKey
					.split("_")
					.map(part => part.charAt(0).toUpperCase() + part.slice(1))
					.join(" ");
				return [
					[
						`Highest ${label} Domain`,
						ranking.bestDomain === null
							? "Not enough data"
							: `${ranking.bestDomain.domainTitle} (${formatConstructDomainLine(ranking.bestDomain.score, ranking.bestDomain.max)})`
					],
					[
						`Lowest ${label} Domain`,
						ranking.worstDomain === null
							? "Not enough data"
							: `${ranking.worstDomain.domainTitle} (${formatConstructDomainLine(ranking.worstDomain.score, ranking.worstDomain.max)})`
					]
				];
			})
		: [];
	const summaryScore = projection.isFiltered
		? overallScores === null
			? "Pending"
			: Math.round((overallScores.play_value_total + overallScores.usability_total) * 100) / 100
		: deriveSummaryScore(auditSession);

	return [
		["Field", "Value"],
		...resultsIncludedRows,
		["Instrument", `${instrument.instrument_name} v${instrument.instrument_version}`],
		["Audit Code", auditSession.audit_code],
		["Place Name", auditSession.place_name],
		["Project Name", auditSession.project_name],
		["Locality", formatLocality(context)],
		["Status", formatAuditStatusLabel(auditSession.status)],
		...summaryMetadataRows,
		["Total Minutes", auditSession.total_minutes ?? "Pending"],
		...(finalComments.length > 0 ? ([["Final Comments", finalComments]] as SpreadsheetRow[]) : []),
		...sourceRows,
		["Summary Score", summaryScore],
		...(projection.isFiltered && !projection.visibleConstructs.playValue
			? []
			: [["Play Value Total", overallScores?.play_value_total ?? "Pending"]]),
		...(projection.isFiltered && !projection.visibleConstructs.usability
			? []
			: [["Usability Total", overallScores?.usability_total ?? "Pending"]]),
		["Provision Total", overallScores?.provision_total ?? "Pending"],
		["Variety Total", overallScores?.variety_total ?? "Pending"],
		["Sociability Total", overallScores?.sociability_total ?? "Pending"],
		["Challenge Total", overallScores?.challenge_total ?? "Pending"],
		...domainRows,
		...rankingRows,
		...unsureRows,
		...auditorRows
	];
}

/**
 * Plain-language description of what a filtered export contains.
 *
 * This is stamped into the exported document itself, not only its metadata: a
 * Play-Value-only export that is not visibly labelled could otherwise be read as
 * a complete audit, which matters for a research instrument.
 *
 * @param resultFilter - Filter applied to the export, if any.
 * @returns A sentence naming the constructs and whether domains were customized.
 */
export function describeResultFilter(resultFilter: ReportResultFilter | undefined): string {
	if (resultFilter === undefined || isDefaultReportFilter(resultFilter)) {
		return "Play Value and Usability (complete audit)";
	}
	const customized = Object.keys(resultFilter.domainOverrides).length > 0;
	const customizedNote = customized ? "; some domains customized" : "";
	if (!resultFilter.overall.usability) {
		return `Play Value only${customizedNote}`;
	}
	if (!resultFilter.overall.playValue) {
		return `Usability only${customizedNote}`;
	}
	return `Play Value and Usability${customizedNote}`;
}

// ── Space Audit sheet ─────────────────────────────────────────────────────────

/**
 * Builds the "Space Audit Setup" data rows - one `[label, answer]` per
 * space-setup question. No header row (callers prepend their own); empty when
 * the instrument has no space-setup questions, so callers can skip the table.
 */
export function buildSpaceAuditRows(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly SpreadsheetRow[] {
	const { auditSession } = exportableAudit;
	const spaceSetupQuestions = instrument.pre_audit_questions.filter(question => question.page_key === "space_setup");

	return spaceSetupQuestions.map(question => [
		stripPromptMarkup(question.label),
		joinSpaceAuditDisplayValues(
			resolveSpaceAuditDisplayValues(question, readSpaceAuditQuestionValues(auditSession, question))
		)
	]);
}

export function buildSociabilityResponseColumns(
	question: import("@/types/audit").ParsedInstrumentQuestion,
	answers: import("@/types/audit").QuestionResponsePayload
): readonly SociabilityResponseColumn[] {
	const scale = question.scales.find(candidate => candidate.key === "sociability");
	if (scale?.selection_mode !== "multiple") {
		return SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => ({
			dimensionKey,
			header: `Sociability - ${SOCIABILITY_DIMENSION_LABELS[dimensionKey]}`,
			selected: null,
			value: scale === undefined ? "N/A" : "Not captured"
		}));
	}
	if (!hasCanonicalSociabilityDimensionKeys(scale.options.map(option => option.key))) {
		throw new Error("Multiple Sociability options must use the canonical ordered dimension keys.");
	}
	if (!("sociability" in answers)) {
		return SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => ({
			dimensionKey,
			header: `Sociability - ${SOCIABILITY_DIMENSION_LABELS[dimensionKey]}`,
			selected: null,
			value: "Not answered"
		}));
	}

	const normalizedAnswer = validateAndNormalizeMultipleScaleAnswer(answers.sociability, SOCIABILITY_DIMENSION_KEYS);
	if (!normalizedAnswer.ok) {
		throw new Error(`Invalid multiple Sociability answer: ${normalizedAnswer.reason}.`);
	}
	const selectedKeys = new Set(normalizedAnswer.value);
	return SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => ({
		dimensionKey,
		header: `Sociability - ${SOCIABILITY_DIMENSION_LABELS[dimensionKey]}`,
		selected: selectedKeys.has(dimensionKey),
		value: selectedKeys.has(dimensionKey) ? "Selected" : "Not selected"
	}));
}

export function buildSociabilityBreakdownScoreRows(totals: AuditScoreTotals): readonly SpreadsheetRow[] {
	const breakdown = totals.sociability_breakdown;
	if (breakdown === null) {
		return [];
	}

	return SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => {
		const categoryTotals = breakdown[dimensionKey];
		return [
			`Sociability - ${SOCIABILITY_DIMENSION_LABELS[dimensionKey]}`,
			categoryTotals.total,
			categoryTotals.max,
			formatPercentage(categoryTotals.total, categoryTotals.max),
			breakdown.captured_question_count,
			breakdown.eligible_question_count
		];
	});
}

// ── Responses sheet ───────────────────────────────────────────────────────────

/**
 * Builds the full row set for the PVUA Response Matrix.
 *
 * Each visible question in each section produces one data row. The section is
 * preceded by a header row and followed by per-section summary rows. An
 * overall summary block is appended after the last section.
 *
 * The header row (`SINGLE_RESPONSE_HEADERS`) is NOT prepended here - callers
 * add it as needed to support both XLSX (sheet prepend) and CSV (array prepend).
 */
function buildSingleAuditResponseTable(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): ResponseTableBuildResult {
	const { auditSession } = exportableAudit;
	const combinedSources = getCombinedReportSources(auditSession);
	const rows: SpreadsheetRow[] = [];
	const rowMetadata: Array<WorkbookRowMetadata | null> = [];
	let overallTotals = createEmptyScoreTotals();

	const questionLookup = buildQuestionLookup(instrument);
	const projection = buildReportScoreProjection(auditSession, instrument, exportableAudit.resultFilter);
	const resultFilter = projection.filter;
	const isFiltering = projection.isFiltered;

	for (const [sectionIndex, section] of instrument.sections.entries()) {
		const allVisibleEntries = buildVisibleQuestionEntries(auditSession, section);

		if (allVisibleEntries.length === 0) {
			continue;
		}

		let sectionTotals = createEmptyScoreTotals();
		let sectionConstructs: ConstructSelection = { playValue: false, usability: false };
		let includedScoredQuestionCount = 0;

		rows.push(buildSectionHeaderRow(sectionIndex, section.title, section.description, section.instruction));
		rowMetadata.push(null);

		for (const [questionIndex, visibleEntry] of allVisibleEntries.entries()) {
			const { question, answers, sourceComponent } = visibleEntry;
			const included =
				!isFiltering ||
				questionMatchesReportFilter(question, questionLookup, getQuestionDomainKeys, resultFilter);
			const selection = isFiltering
				? resolveQuestionConstructSelection(question, questionLookup, getQuestionDomainKeys, resultFilter)
				: { playValue: true, usability: true };
			const constructKeys = getQuestionConstructKeys(question, questionLookup);

			if (included) {
				const calculatedScores = calculateQuestionScores(question, answers);
				const questionScores = isFiltering
					? maskScoreTotalsByConstructSelection(calculatedScores, selection)
					: calculatedScores;
				rows.push(
					buildQuestionResponseRow(sectionIndex, questionIndex, question, answers, questionScores, {
						selection,
						constructKeys
					})
				);
				rowMetadata.push(sourceComponent === null ? null : { sourceComponent });
				sectionTotals = addScoreTotals(sectionTotals, questionScores);
				if (question.question_type === "scaled") {
					includedScoredQuestionCount += 1;
				}
				sectionConstructs = {
					playValue:
						sectionConstructs.playValue || (selection.playValue && constructKeys.includes("play_value")),
					usability:
						sectionConstructs.usability || (selection.usability && constructKeys.includes("usability"))
				};
			}

			const questionComment = typeof answers.question_note === "string" ? answers.question_note.trim() : "";
			if (questionComment.length > 0) {
				rows.push(
					buildQuestionCommentRow(
						sectionIndex,
						questionIndex,
						questionComment,
						formatQuestionKeyForDisplay(question.question_key),
						sourceComponent
					)
				);
				rowMetadata.push(null);
			}
		}

		const notesPrompt = typeof section.notes_prompt === "string" ? stripPromptMarkup(section.notes_prompt) : "";

		if (notesPrompt.length > 0) {
			const notePromptRows = buildSectionNoteRow(
				sectionIndex,
				allVisibleEntries.length + 1,
				questionDomainFallback(section.title),
				notesPrompt,
				""
			);
			rows.push(...notePromptRows);
			rowMetadata.push(...Array.from({ length: notePromptRows.length }, () => null));
		}

		if (combinedSources === null) {
			const sectionNote = auditSession.sections[section.section_key]?.note ?? "";
			if (sectionNote.trim().length > 0) {
				const noteRows = buildSectionNoteRow(
					sectionIndex,
					allVisibleEntries.length + 1,
					questionDomainFallback(section.title),
					"",
					sectionNote
				);
				rows.push(...noteRows);
				rowMetadata.push(...Array.from({ length: noteRows.length }, () => null));
			}
		} else {
			(["audit", "survey"] as const).forEach(sourceComponent => {
				const sourceSession = combinedSources[sourceComponent];
				const sectionNote = sourceSession.sections[section.section_key]?.note ?? "";
				if (sectionNote.trim().length === 0) {
					return;
				}
				const noteRows = buildSectionNoteRow(
					sectionIndex,
					allVisibleEntries.length + 1,
					questionDomainFallback(section.title),
					"",
					`${getReportSourceLabel(sourceComponent)}: ${sectionNote}`
				);
				rows.push(...noteRows);
				rowMetadata.push(...Array.from({ length: noteRows.length }, () => null));
			});
		}

		if (!isFiltering || includedScoredQuestionCount > 0) {
			rows.push(...buildSectionSummaryRows(sectionTotals, isFiltering ? sectionConstructs : undefined));
			rowMetadata.push(null, null, null);
		}
		if (!isFiltering) {
			overallTotals = addScoreTotals(overallTotals, sectionTotals);
		}
	}

	if (rows.length > 0 && (!isFiltering || projection.overall !== null)) {
		if (isFiltering) {
			overallTotals = projection.overall ?? createEmptyScoreTotals();
		}
		rows.push(buildEmptyResponseRow());
		rows.push(...buildOverallSummaryRows(overallTotals, isFiltering ? projection.visibleConstructs : undefined));
		rowMetadata.push(null, null, null, null);
	}

	return {
		rows: isFiltering ? rows.map(row => projectResponseRow(row, projection.visibleConstructs)) : rows,
		rowMetadata
	};
}

function projectResponseRow(row: SpreadsheetRow, visibleConstructs: ConstructSelection): SpreadsheetRow {
	return row.filter(
		(_cell, index) => (index !== 14 || visibleConstructs.playValue) && (index !== 15 || visibleConstructs.usability)
	);
}

export function buildSingleAuditResponseHeaders(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly string[] {
	const projection = buildReportScoreProjection(
		exportableAudit.auditSession,
		instrument,
		exportableAudit.resultFilter
	);
	return projection.isFiltered
		? projectResponseRow([...SINGLE_RESPONSE_HEADERS], projection.visibleConstructs).map(String)
		: SINGLE_RESPONSE_HEADERS;
}

export function buildSingleAuditResponseRows(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly SpreadsheetRow[] {
	return buildSingleAuditResponseTable(exportableAudit, instrument).rows;
}

export function buildSingleAuditResponseRowMetadata(
	exportableAudit: ExportableAudit,
	instrument: PlayspaceInstrument
): readonly (WorkbookRowMetadata | null)[] {
	return buildSingleAuditResponseTable(exportableAudit, instrument).rowMetadata;
}

// ── Individual row factories ──────────────────────────────────────────────────

/** Produces the full-width section header row (ID col = section number only). */
export function buildSectionHeaderRow(
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
		"",
		"",
		""
	];
}

/** Produces the data row for a single question + its recorded answers. */
export function buildQuestionResponseRow(
	_sectionIndex: number,
	_questionIndex: number,
	question: import("@/types/audit").ParsedInstrumentQuestion,
	answers: import("@/types/audit").QuestionResponsePayload,
	questionScores: AuditScoreTotals,
	filtering?: Readonly<{
		selection: ConstructSelection;
		constructKeys: readonly import("@/types/audit").ConstructKey[];
	}>
): SpreadsheetRow {
	const sociabilityColumns = buildSociabilityResponseColumns(question, answers);
	const constructKeys = filtering?.constructKeys ?? question.constructs;
	const visibleConstructKeys = constructKeys.filter(constructKey =>
		constructKey === "play_value"
			? filtering?.selection.playValue !== false
			: filtering?.selection.usability !== false
	);
	if (question.question_type === "checklist") {
		return [
			formatQuestionKeyForDisplay(question.question_key),
			formatQuestionModeLabel(question.mode),
			formatConstructLabel(visibleConstructKeys),
			formatQuestionDomainLabel(question),
			"",
			"",
			stripPromptMarkup(question.prompt),
			formatChecklistAnswer(question, answers),
			"",
			"",
			...sociabilityColumns.map(column => column.value),
			"",
			filtering?.selection.playValue === false ? "" : "N/A",
			filtering?.selection.usability === false ? "" : "N/A"
		];
	}

	const rawProvision = answers.provision;
	const rawVariety = answers.variety;
	const rawSociability = answers.sociability;
	const rawChallenge = answers.challenge;
	const sociabilityScale = question.scales.find(scale => scale.key === "sociability");
	const sociabilityAnswer =
		Array.isArray(rawSociability) && sociabilityScale?.selection_mode === "multiple"
			? rawSociability
					.filter((answer): answer is string => typeof answer === "string")
					.map(answer => formatQuestionAnswer(question, "sociability", answer))
					.join(" | ")
			: formatQuestionAnswer(
					question,
					"sociability",
					typeof rawSociability === "string" ? rawSociability : undefined
				);

	return [
		formatQuestionKeyForDisplay(question.question_key),
		formatQuestionModeLabel(question.mode),
		formatConstructLabel(visibleConstructKeys),
		formatQuestionDomainLabel(question),
		"",
		"",
		stripPromptMarkup(question.prompt),
		formatQuestionAnswer(question, "provision", typeof rawProvision === "string" ? rawProvision : undefined),
		formatQuestionAnswer(question, "variety", typeof rawVariety === "string" ? rawVariety : undefined),
		sociabilityAnswer,
		...sociabilityColumns.map(column => column.value),
		formatQuestionAnswer(question, "challenge", typeof rawChallenge === "string" ? rawChallenge : undefined),
		filtering?.selection.playValue === false
			? ""
			: constructKeys.includes("play_value")
				? questionScores.play_value_total
				: "N/A",
		filtering?.selection.usability === false
			? ""
			: constructKeys.includes("usability")
				? questionScores.usability_total
				: "N/A"
	];
}

/**
 * Sentinel placed in col 1 so the XLSX styler can identify per-question
 * auditor comment rows without a fragile text scan.
 * @internal
 */
export const COMMENT_ROW_SENTINEL = "__comment__" as const;

/**
 * Sentinel placed in col 1 for the bold Notes Prompt banner row.
 * @internal
 */
export const SECTION_NOTE_SENTINEL = "__section_note__" as const;

/**
 * Sentinel placed in col 1 for the normal-weight Auditor Note response row.
 * @internal
 */
export const SECTION_NOTE_RESPONSE_SENTINEL = "__section_note_response__" as const;

/**
 * Produces a per-question auditor comment row.
 * Placed immediately after the question's data row and before score rows.
 * Col 6 ("Items") carries the comment text; all other data cells are blank.
 */
export function buildQuestionCommentRow(
	_sectionIndex: number,
	_questionIndex: number,
	comment: string,
	questionKey: string,
	sourceComponent: ReportSourceComponent | null
): SpreadsheetRow {
	const sourcePrefix = sourceComponent === null ? "" : `${getReportSourceLabel(sourceComponent)}: `;
	return [
		questionKey,
		COMMENT_ROW_SENTINEL,
		"",
		"",
		"",
		"",
		`${sourcePrefix}${comment}`,
		"",
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

/**
 * Produces one or two full-width banner rows for the section note block.
 *
 * - When a Notes Prompt is present: a bold header row (`SECTION_NOTE_SENTINEL`)
 *   carrying `"Notes Prompt: <text>"`.
 * - When an Auditor Note is present: a normal-weight response row
 *   (`SECTION_NOTE_RESPONSE_SENTINEL`) carrying `"Auditor Note: <text>"`.
 *
 * Both row types are detected by the XLSX styler for merge + banner styling.
 */
export function buildSectionNoteRow(
	_sectionIndex: number,
	_noteIndex: number,
	_domainLabel: string,
	notesPrompt: string,
	submittedComment: string
): readonly SpreadsheetRow[] {
	const BLANK = ["", "", "", "", "", "", "", "", "", "", "", "", "", ""] as const;
	const rows: SpreadsheetRow[] = [];

	if (notesPrompt.length > 0) {
		rows.push([`Notes Prompt: ${notesPrompt}`, SECTION_NOTE_SENTINEL, ...BLANK]);
	}

	if (submittedComment.trim().length > 0) {
		rows.push([`Auditor Note: ${submittedComment.trim()}`, SECTION_NOTE_RESPONSE_SENTINEL, ...BLANK]);
	}

	return rows;
}

/**
 * Col index that holds the score row kind label
 * ("Raw Scores" / "Max Possible" / "Final Percentage").
 * Used by the XLSX styler to pick the correct fill variant.
 *
 * @internal
 */
export const SCORE_ROW_KIND_COL = 1;

/** Produces the three per-section summary rows (raw, max, percentage). */
export function buildSectionSummaryRows(
	totals: AuditScoreTotals,
	visibleConstructs?: ConstructSelection
): readonly SpreadsheetRow[] {
	return [
		buildScoreSummaryRow("Total", "Raw Scores", totals, "raw", visibleConstructs),
		buildScoreSummaryRow("Max", "Max Possible", totals, "maximum", visibleConstructs),
		buildScoreSummaryRow("%", "Final Percentage", totals, "percentage", visibleConstructs)
	];
}

/** Produces the three overall summary rows appended at the end of the matrix. */
export function buildOverallSummaryRows(
	totals: AuditScoreTotals,
	visibleConstructs?: ConstructSelection
): readonly SpreadsheetRow[] {
	return [
		buildScoreSummaryRow("Overall Total", "Raw Scores", totals, "raw", visibleConstructs),
		buildScoreSummaryRow("Overall Max", "Max Possible", totals, "maximum", visibleConstructs),
		buildScoreSummaryRow("Overall %", "Final Percentage", totals, "percentage", visibleConstructs)
	];
}

/**
 * Sentinel placed in col 2 so the XLSX styler can identify score summary rows.
 * Variants allow per-kind fill differentiation (Total vs Max vs %).
 *
 * @internal Not part of the public row-data contract; used only by excel.ts.
 */
export const SCORE_ROW_SENTINEL = "Summary" as const;
export type ScoreRowKind = "raw" | "maximum" | "percentage";

/**
 * Produces a single score summary row.
 * @param rowKind - `"raw"` emits actual totals, `"maximum"` emits max values,
 *   `"percentage"` emits formatted percentages.
 */
export function buildScoreSummaryRow(
	idLabel: string,
	modeLabel: string,
	totals: AuditScoreTotals,
	rowKind: ScoreRowKind,
	visibleConstructs?: ConstructSelection
): SpreadsheetRow {
	const base = [idLabel, modeLabel, SCORE_ROW_SENTINEL, "", "", "", ""] as const;
	const breakdown = totals.sociability_breakdown;
	const sociabilityBreakdownCells =
		breakdown === null
			? (["Not captured", "Not captured", "Not captured"] as const)
			: SOCIABILITY_DIMENSION_KEYS.map(dimensionKey => {
					const dimension = breakdown[dimensionKey];
					if (rowKind === "raw") return dimension.total;
					if (rowKind === "maximum") return dimension.max;
					return formatPercentage(dimension.total, dimension.max);
				});

	if (rowKind === "raw") {
		return [
			...base,
			totals.provision_total,
			totals.variety_total,
			totals.sociability_total,
			...sociabilityBreakdownCells,
			totals.challenge_total,
			visibleConstructs?.playValue === false ? "" : totals.play_value_total,
			visibleConstructs?.usability === false ? "" : totals.usability_total
		];
	}

	if (rowKind === "maximum") {
		return [
			...base,
			totals.provision_total_max,
			totals.variety_total_max,
			totals.sociability_total_max,
			...sociabilityBreakdownCells,
			totals.challenge_total_max,
			visibleConstructs?.playValue === false ? "" : totals.play_value_total_max,
			visibleConstructs?.usability === false ? "" : totals.usability_total_max
		];
	}

	return [
		...base,
		formatPercentage(totals.provision_total, totals.provision_total_max),
		formatPercentage(totals.variety_total, totals.variety_total_max),
		formatPercentage(totals.sociability_total, totals.sociability_total_max),
		...sociabilityBreakdownCells,
		formatPercentage(totals.challenge_total, totals.challenge_total_max),
		visibleConstructs?.playValue === false
			? ""
			: formatPercentage(totals.play_value_total, totals.play_value_total_max),
		visibleConstructs?.usability === false
			? ""
			: formatPercentage(totals.usability_total, totals.usability_total_max)
	];
}

export function buildEmptyResponseRow(): SpreadsheetRow {
	return ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
}

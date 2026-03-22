import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import ts from "typescript";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const LIB_DIR = resolve(REPO_ROOT, "src", "lib");

/**
 * Convert a locale code into the export prefix used by instrument locale files.
 *
 * Examples:
 * - "de" -> "de"
 * - "pt-br" -> "ptBr"
 *
 * @param {string} locale Locale code passed to the CLI.
 * @returns {string} Safe identifier prefix for the locale export name.
 */
function toInstrumentExportPrefix(locale) {
	const segments = locale
		.trim()
		.split(/[^A-Za-z0-9]+/)
		.filter(segment => segment.length > 0)
		.map(segment => segment.toLowerCase());

	if (segments.length === 0) {
		throw new Error(`Invalid locale "${locale}".`);
	}

	const [firstSegment, ...remainingSegments] = segments;
	return [
		firstSegment,
		...remainingSegments.map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
	].join("");
}

/**
 * Resolve the TypeScript module path for one locale-specific instrument file.
 *
 * @param {string} locale Locale code passed to the CLI.
 * @returns {string} Absolute file path for the locale instrument module.
 */
function toInstrumentFilePath(locale) {
	return resolve(LIB_DIR, `${toInstrumentExportPrefix(locale)}Instrument.ts`);
}

/**
 * Load a TypeScript module by transpiling it to CommonJS in memory.
 *
 * The instrument files in this repo only use type-only imports at runtime, so a
 * lightweight transpile-and-evaluate flow is enough and avoids any Bun-specific
 * dependency.
 *
 * @param {string} filePath Absolute path to the TypeScript module.
 * @returns {Record<string, unknown>} Evaluated module exports.
 */
function loadTsModuleExports(filePath) {
	const sourceText = readFileSync(filePath, "utf8");
	const transpiled = ts.transpileModule(sourceText, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020
		}
	}).outputText;

	const module = { exports: {} };
	const context = vm.createContext({
		module,
		exports: module.exports,
		require(moduleSpecifier) {
			throw new Error(
				`Unsupported runtime import "${moduleSpecifier}" while loading ${filePath}. ` +
					"Only type-only imports are expected in instrument modules."
			);
		},
		__dirname: dirname(filePath),
		__filename: filePath,
		console,
		process,
		Buffer,
		setTimeout,
		clearTimeout
	});
	const script = new vm.Script(transpiled, { filename: filePath });
	script.runInContext(context);
	return module.exports;
}

/**
 * Load the canonical raw playspace instrument structure.
 *
 * @returns {Record<string, unknown>} Base instrument object.
 */
function loadBaseInstrument() {
	const instrumentModule = loadTsModuleExports(resolve(LIB_DIR, "instrument.ts"));
	const baseInstrument = instrumentModule.BASE_PLAYSPACE_INSTRUMENT;

	if (typeof baseInstrument !== "object" || baseInstrument === null) {
		throw new Error("Expected BASE_PLAYSPACE_INSTRUMENT to export an object.");
	}

	return baseInstrument;
}

/**
 * Keep an override string when provided, otherwise fall back to the base value.
 *
 * @param {string} baseValue Canonical English source text.
 * @param {string | undefined} overrideValue Locale override value.
 * @returns {string} Resolved text value.
 */
function mergeString(baseValue, overrideValue) {
	return typeof overrideValue === "string" ? overrideValue : baseValue;
}

/**
 * Keep an explicit null override when present, otherwise fall back to the base value.
 *
 * @param {string | null | undefined} baseValue Canonical English nullable text.
 * @param {string | null | undefined} overrideValue Locale override value.
 * @returns {string | null | undefined} Resolved nullable text value.
 */
function mergeNullableString(baseValue, overrideValue) {
	if (overrideValue === null) {
		return null;
	}

	return typeof overrideValue === "string" ? overrideValue : baseValue;
}

/**
 * Apply translation overrides to a reusable option-like structure.
 *
 * @param {{ label: string, description?: string | null }} baseOption Canonical option copy.
 * @param {{ label?: string, description?: string | null } | undefined} translation Optional locale override.
 * @returns {{ label: string, description?: string | null }} Localized option translation.
 */
function mergeChoiceOption(baseOption, translation) {
	return {
		label: mergeString(baseOption.label, translation?.label),
		description: mergeNullableString(baseOption.description, translation?.description)
	};
}

/**
 * Normalize a potentially missing translation sub-tree into a plain object.
 *
 * @param {unknown} value Candidate object-like value.
 * @returns {Record<string, unknown>} Safe object for nested reads.
 */
function asRecord(value) {
	return typeof value === "object" && value !== null ? value : {};
}

/**
 * Build the fully resolved compact translation bundle from the raw instrument and
 * optional locale-specific overrides.
 *
 * @param {typeof BASE_PLAYSPACE_INSTRUMENT} baseInstrument Canonical instrument definition.
 * @param {Record<string, unknown>} localeOverrides Partial locale translation overrides.
 * @returns {Record<string, unknown>} Fully resolved compact translation bundle.
 */
function buildResolvedInstrumentBundle(baseInstrument, localeOverrides) {
	const metadataOverrides = asRecord(localeOverrides.metadata);
	const preambleOverrides = Array.isArray(localeOverrides.preamble) ? localeOverrides.preamble : [];
	const executionModeOverrides = asRecord(localeOverrides.executionModes);
	const preAuditOverrides = asRecord(localeOverrides.preAuditQuestions);
	const scaleOverrides = asRecord(localeOverrides.scales);
	const sectionOverrides = asRecord(localeOverrides.sections);

	const bundle = {
		metadata: {
			instrumentName: mergeString(baseInstrument.instrument_name, metadataOverrides.instrumentName),
			currentSheet: mergeString(baseInstrument.current_sheet, metadataOverrides.currentSheet)
		},
		preamble: baseInstrument.preamble.map((paragraph, index) => {
			const overrideValue = preambleOverrides[index];
			return typeof overrideValue === "string" ? overrideValue : paragraph;
		}),
		executionModes: Object.fromEntries(
			baseInstrument.execution_modes.map(mode => {
				const translation = executionModeOverrides[mode.key];
				return [mode.key, mergeChoiceOption(mode, translation)];
			})
		),
		preAuditQuestions: Object.fromEntries(
			baseInstrument.pre_audit_questions.map(question => {
				const questionTranslation = asRecord(preAuditOverrides[question.key]);
				const optionTranslations = asRecord(questionTranslation.options);

				return [
					question.key,
					{
						label: mergeString(question.label, questionTranslation?.label),
						description: mergeNullableString(question.description, questionTranslation?.description),
						options: Object.fromEntries(
							question.options.map(option => [
								option.key,
								mergeChoiceOption(option, optionTranslations[option.key])
							])
						)
					}
				];
			})
		),
		scales: Object.fromEntries(
			baseInstrument.scale_guidance.map(scale => {
				const scaleTranslation = asRecord(scaleOverrides[scale.key]);
				const optionTranslations = asRecord(scaleTranslation.options);

				return [
					scale.key,
					{
						title: mergeString(scale.title, scaleTranslation?.title),
						prompt: mergeString(scale.prompt, scaleTranslation?.prompt),
						description: mergeString(scale.description, scaleTranslation?.description),
						options: Object.fromEntries(
							scale.options.map(option => [
								option.key,
								{
									label: mergeString(option.label, optionTranslations[option.key]?.label)
								}
							])
						)
					}
				];
			})
		),
		sections: Object.fromEntries(
			baseInstrument.sections.map(section => {
				const sectionTranslation = asRecord(sectionOverrides[section.section_key]);
				const questionTranslations = asRecord(sectionTranslation.questions);

				return [
					section.section_key,
					{
						title: mergeString(section.title, sectionTranslation?.title),
						description: mergeNullableString(section.description, sectionTranslation?.description),
						instruction: mergeString(section.instruction, sectionTranslation?.instruction),
						notesPrompt: mergeNullableString(section.notes_prompt, sectionTranslation?.notesPrompt),
						questions: Object.fromEntries(
							section.questions.map(question => [
								question.question_key,
								{
									prompt: mergeString(
										question.prompt,
										questionTranslations[question.question_key]?.prompt
									)
								}
							])
						)
					}
				];
			})
		)
	};

	return bundle;
}

/**
 * Load the current instrument translation override bundle for a locale.
 *
 * @param {string} locale Target locale code.
 * @param {{ allowMissing?: boolean }} options Missing-file behavior.
 * @returns {Record<string, unknown>} Existing locale bundle or an empty object.
 */
function loadLocaleBundle(locale, { allowMissing = false } = {}) {
	const localeFilePath = toInstrumentFilePath(locale);
	if (!existsSync(localeFilePath)) {
		if (allowMissing) {
			return {};
		}

		throw new Error(`Locale instrument file was not found: ${localeFilePath}`);
	}

	const localeModule = loadTsModuleExports(localeFilePath);
	const exportName = `${toInstrumentExportPrefix(locale)}InstrumentTranslations`;
	const localeBundle = localeModule[exportName];

	if (typeof localeBundle !== "object" || localeBundle === null) {
		throw new Error(
			`Expected ${exportName} to export an object from ${localeFilePath}, but got ${typeof localeBundle}.`
		);
	}

	return localeBundle;
}

/**
 * Print CLI usage information and exit.
 *
 * @param {number} code Process exit code.
 * @returns {never}
 */
function exitWithUsage(code) {
	console.error(
		[
			"Usage:",
			"  node scripts/translations/export_instrument_bundle.mjs source <locale>",
			"  node scripts/translations/export_instrument_bundle.mjs current <locale>"
		].join("\n")
	);
	process.exit(code);
}

/**
 * Entry point for the helper CLI.
 *
 * @returns {Promise<void>} Completion signal for the async CLI flow.
 */
async function main() {
	const [, , mode, locale] = process.argv;

	if (typeof mode !== "string" || typeof locale !== "string") {
		exitWithUsage(1);
	}

	if (mode === "source") {
		const bundle = buildResolvedInstrumentBundle(loadBaseInstrument(), loadLocaleBundle(locale));
		process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
		return;
	}

	if (mode === "current") {
		const bundle = loadLocaleBundle(locale, { allowMissing: true });
		process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
		return;
	}

	exitWithUsage(1);
}

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
}

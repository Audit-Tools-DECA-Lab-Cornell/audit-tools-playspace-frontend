import { enInstrumentTranslations } from "@/lib/enInstrument";
import { usePreferences } from "@/components/app/preferences-provider";

const EXECUTION_MODE_KEYS = ["both", "survey", "audit"] as const;
const DEFAULT_INSTRUMENT_NAME = "Playspace Play Value and Usability Audit Tool";
const DEFAULT_CURRENT_SHEET = "PVUA v5.2";
const TOTAL_SECTION_COUNT = 22;
const TOTAL_PRE_AUDIT_QUESTION_COUNT = 10;
const TOTAL_SECTION_QUESTION_COUNT = 123;
const TRANSLATIONS_BY_LANGUAGE: Readonly<Partial<Record<string, typeof enInstrumentTranslations>>> = {
	en: enInstrumentTranslations
};

export interface InstrumentSystemExecutionMode {
	readonly key: (typeof EXECUTION_MODE_KEYS)[number];
	readonly label: string;
	readonly description: string | null;
}

export interface InstrumentSystemMetadata {
	readonly instrumentName: string;
	readonly currentSheet: string;
	readonly totalSectionCount: number;
	readonly totalPreAuditQuestionCount: number;
	readonly totalSectionQuestionCount: number;
	readonly totalQuestionCount: number;
	readonly executionModes: readonly InstrumentSystemExecutionMode[];
}

/**
 * Read the lightweight instrument metadata needed by admin/system without loading the full instrument definition.
 */
export function useInstrumentSystemMetadata(): InstrumentSystemMetadata {
	const resolvedLanguage = usePreferences().resolvedLanguage;
	const translations = TRANSLATIONS_BY_LANGUAGE[resolvedLanguage] ?? enInstrumentTranslations;

	return {
		instrumentName: translations.metadata?.instrumentName ?? DEFAULT_INSTRUMENT_NAME,
		currentSheet: translations.metadata?.currentSheet ?? DEFAULT_CURRENT_SHEET,
		totalSectionCount: TOTAL_SECTION_COUNT,
		totalPreAuditQuestionCount: TOTAL_PRE_AUDIT_QUESTION_COUNT,
		totalSectionQuestionCount: TOTAL_SECTION_QUESTION_COUNT,
		totalQuestionCount: TOTAL_PRE_AUDIT_QUESTION_COUNT + TOTAL_SECTION_QUESTION_COUNT,
		executionModes: EXECUTION_MODE_KEYS.map(modeKey => ({
			key: modeKey,
			label: translations.executionModes?.[modeKey]?.label ?? modeKey,
			description: translations.executionModes?.[modeKey]?.description ?? null
		}))
	};
}

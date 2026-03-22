export const DEFAULT_WEB_LOCALE = "en" as const;
export const SUPPORTED_WEB_LOCALES = ["en", "de", "fr", "ja", "hi"] as const;
export const LANGUAGE_PREFERENCES = ["system", ...SUPPORTED_WEB_LOCALES] as const;
export const LOCALE_PREFERENCE_COOKIE_NAME = "playspace_locale_preference" as const;

export type ResolvedLanguage = (typeof SUPPORTED_WEB_LOCALES)[number];
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

/**
 * Check whether a value is one of the supported concrete app locales.
 */
export function isResolvedLanguage(value: string): value is ResolvedLanguage {
	return SUPPORTED_WEB_LOCALES.includes(value as ResolvedLanguage);
}

/**
 * Check whether a value is one of the supported language preference modes.
 */
export function isLanguagePreference(value: string): value is LanguagePreference {
	return LANGUAGE_PREFERENCES.includes(value as LanguagePreference);
}

/**
 * Resolve a browser or request language tag into the nearest supported locale.
 *
 * The input may be a single language tag such as `de-DE` or an `Accept-Language`
 * header with multiple comma-separated entries.
 */
export function resolveSupportedLanguage(languageTag: string | null | undefined): ResolvedLanguage {
	if (typeof languageTag !== "string" || languageTag.trim().length === 0) {
		return DEFAULT_WEB_LOCALE;
	}

	const candidates = languageTag
		.toLowerCase()
		.split(",")
		.map(segment => segment.split(";")[0]?.trim() ?? "")
		.filter(segment => segment.length > 0);

	for (const candidate of candidates) {
		if (candidate.startsWith("de")) {
			return "de";
		}

		if (candidate.startsWith("fr")) {
			return "fr";
		}

		if (candidate.startsWith("ja")) {
			return "ja";
		}

		if (candidate.startsWith("hi")) {
			return "hi";
		}

		if (candidate.startsWith("en")) {
			return "en";
		}
	}

	return DEFAULT_WEB_LOCALE;
}

/**
 * Resolve a stored language preference into a concrete locale.
 */
export function resolveLanguagePreference(
	languagePreference: LanguagePreference,
	systemLanguageTag: string | null | undefined
): ResolvedLanguage {
	if (languagePreference !== "system") {
		return languagePreference;
	}

	return resolveSupportedLanguage(systemLanguageTag);
}

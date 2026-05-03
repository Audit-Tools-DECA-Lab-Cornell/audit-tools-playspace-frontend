/**
 * Utilities for parsing `**bold**` marker syntax used in instrument question
 * prompts. Callers receive a flat segment array and apply their own styling so
 * that execute views, report tables, and any future surfaces can each choose
 * the appropriate visual treatment for bold segments.
 */

/** One contiguous run of text in a prompt string, optionally bold. */
export interface PromptSegment {
	readonly text: string;
	readonly bold: boolean;
}

/**
 * Split a raw prompt string on `**…**` markers into an ordered list of
 * segments. Empty segments (consecutive markers or leading/trailing delimiters)
 * are dropped.
 *
 * @param raw - Raw prompt string from the instrument definition.
 * @returns Ordered segments with `bold` flag set for content inside `**…**`.
 *
 * @example
 * parsePromptSegments("Has **varied** equipment")
 * // → [{ text: "Has ", bold: false }, { text: "varied", bold: true }, { text: " equipment", bold: false }]
 */
export function parsePromptSegments(raw: string): PromptSegment[] {
	const segments: PromptSegment[] = [];
	const parts = raw.split("**");

	for (let index = 0; index < parts.length; index += 1) {
		const part = parts[index] ?? "";
		if (part.length === 0) {
			continue;
		}
		segments.push({ text: part, bold: index % 2 === 1 });
	}

	return segments;
}

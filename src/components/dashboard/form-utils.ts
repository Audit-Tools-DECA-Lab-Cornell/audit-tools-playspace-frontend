/**
 * Normalize optional form text input into a nullable backend value.
 */
export function toNullableString(value: string): string | null {
	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Parse optional integer input while preserving null for empty values.
 */
export function toNullableInteger(value: string): number | null {
	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		return null;
	}

	const parsedValue = Number(trimmedValue);
	if (!Number.isInteger(parsedValue) || parsedValue < 0) {
		throw new Error("Expected a non-negative whole number.");
	}

	return parsedValue;
}

/**
 * Parse optional decimal input while preserving null for empty values.
 */
export function toNullableNumber(value: string): number | null {
	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		return null;
	}

	const parsedValue = Number(trimmedValue);
	if (!Number.isFinite(parsedValue)) {
		throw new Error("Expected a valid number.");
	}

	return parsedValue;
}

/**
 * Convert a comma-separated tag field into a trimmed array.
 */
export function toTrimmedList(value: string): string[] {
	return value
		.split(",")
		.map(item => item.trim())
		.filter(item => item.length > 0);
}

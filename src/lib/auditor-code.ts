/**
 * Deterministic auditor code generation.
 *
 * Format: AUD-{ORG}-{YY}-{NNN}
 *   AUD  = fixed prefix
 *   ORG  = uppercase initials from the organisation name (first letter of each word)
 *   YY   = two-digit invitation year
 *   NNN  = zero-padded sequence number (next available for this org+year prefix)
 */

/**
 * Extract uppercase initials from an organisation name.
 *
 * @param accountName - The manager account's organisation name.
 * @returns Uppercase initials string (e.g. "Auckland Playspace Collaborative" -> "APC").
 */
function extractOrgInitials(accountName: string): string {
	const words = accountName.trim().split(/\s+/);
	const initials = words
		.map(word => word.charAt(0))
		.filter(char => char.length > 0)
		.join("")
		.toUpperCase();

	return initials.length > 0 ? initials : "ORG";
}

/**
 * Build the stable prefix portion of an auditor code for a given org and year.
 *
 * @param orgInitials - Uppercase organisation initials.
 * @param twoDigitYear - Two-digit year string (e.g. "26").
 * @returns Prefix like "AUD-APC-26-".
 */
function buildPrefix(orgInitials: string, twoDigitYear: string): string {
	return `AUD-${orgInitials}-${twoDigitYear}-`;
}

/**
 * Derive the next sequence number by counting how many existing codes
 * share the same AUD-{ORG}-{YY}- prefix.
 *
 * @param prefix - The prefix to match against.
 * @param existingCodes - All auditor codes currently in the account.
 * @returns The next 1-based sequence number.
 */
function deriveNextSequence(prefix: string, existingCodes: readonly string[]): number {
	const uppercasePrefix = prefix.toUpperCase();
	const matchCount = existingCodes.filter(code => code.toUpperCase().startsWith(uppercasePrefix)).length;

	return matchCount + 1;
}

/**
 * Generate a deterministic, anonymous auditor code.
 *
 * @param accountName - The manager account's organisation name.
 * @param existingCodes - All auditor codes already registered under this account.
 * @returns A unique auditor code like "AUD-APC-26-003".
 */
export function generateAuditorCode(accountName: string, existingCodes: readonly string[]): string {
	const orgInitials = extractOrgInitials(accountName);
	const twoDigitYear = String(new Date().getFullYear() % 100).padStart(2, "0");
	const prefix = buildPrefix(orgInitials, twoDigitYear);
	const sequence = deriveNextSequence(prefix, existingCodes);
	const paddedSequence = String(sequence).padStart(3, "0");

	return `${prefix}${paddedSequence}`;
}

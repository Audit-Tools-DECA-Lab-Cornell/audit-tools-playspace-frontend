/**
 * Privacy helpers for defensive UI masking.
 */

/**
 * Mask an email address for display when a raw email slips through.
 */
export function maskEmail(email: string | null | undefined): string {
	if (!email) return "Email hidden";
	const normalizedEmail = email.trim();
	if (!normalizedEmail.includes("@")) return "***";

	const [localPart, domainPart] = normalizedEmail.split("@");
	if (!localPart || !domainPart) return "***";

	const maskedLocal = `${localPart.slice(0, 3) ?? "*"}${"*".repeat(Math.max(localPart.length - 3, 4))}`;
	const domainSegments = domainPart.split(".").filter(segment => segment.length > 0);
	if (domainSegments.length === 0) return `${maskedLocal}@***`;

	const firstDomainSegment = domainSegments[0] ?? "";
	const maskedDomainSegment = `${firstDomainSegment.slice(0, 2) ?? "*"}${"*".repeat(Math.max(firstDomainSegment.length - 2, 3))}`;
	const suffix = domainSegments.slice(1).join(".");
	return suffix.length > 0
		? `${maskedLocal}@${maskedDomainSegment}.${suffix}`
		: `${maskedLocal}@${maskedDomainSegment}`;
}

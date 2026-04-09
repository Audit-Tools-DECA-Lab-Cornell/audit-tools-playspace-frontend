export type UserRole = "admin" | "manager" | "auditor";

export const AUTH_COOKIE_NAMES = {
	accessToken: "playspace_access_token",
	role: "playspace_role",
	auditorCode: "playspace_auditor_code",
	accountId: "playspace_account_id",
	userName: "playspace_user_name",
	userEmail: "playspace_user_email"
} as const;

/**
 * Backend account_type values mapped to frontend UserRole.
 */
export function mapAccountTypeToRole(accountType: string): UserRole | null {
	const normalized = accountType.toUpperCase();
	if (normalized === "ADMIN") return "admin";
	if (normalized === "MANAGER") return "manager";
	if (normalized === "AUDITOR") return "auditor";
	return null;
}

export function isUserRole(value: string): value is UserRole {
	return value === "admin" || value === "manager" || value === "auditor";
}

export function parseUserRole(value: string | null | undefined): UserRole | null {
	if (!value) return null;
	return isUserRole(value) ? value : null;
}

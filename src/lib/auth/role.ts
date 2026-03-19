export type UserRole = "manager" | "auditor";

export const AUTH_COOKIE_NAMES = {
	accessToken: "playspace_access_token",
	role: "playspace_role",
	auditorCode: "playspace_auditor_code",
	managerEmail: "playspace_manager_email"
} as const;

export function isUserRole(value: string): value is UserRole {
	return value === "manager" || value === "auditor";
}

export function parseUserRole(value: string | null | undefined): UserRole | null {
	if (!value) return null;
	return isUserRole(value) ? value : null;
}

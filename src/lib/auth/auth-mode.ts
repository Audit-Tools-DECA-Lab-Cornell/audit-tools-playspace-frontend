import { resolveAdminAccountId, resolveManagerAccountId } from "./demo-identities";
import type { UserRole } from "./role";
import { parseUserRole } from "./role";
import type { AuthSession } from "./session";

export type AuthMode = "real" | "mock";

export const MOCK_AUTH_HEADERS = {
	role: "x-playspace-mock-role",
	accountId: "x-playspace-mock-account-id",
	auditorCode: "x-playspace-mock-auditor-code"
} as const;

const DEFAULT_MANAGER_EMAIL = "manager@example.org";
const DEFAULT_AUDITOR_CODE = "AKL-01";

function normalizeAuthMode(value: string | undefined): AuthMode {
	const normalizedValue = value?.trim().toLowerCase();
	if (normalizedValue === "mock" || normalizedValue === "development") {
		return "mock";
	}

	return "real";
}

function getDefaultAccountId(role: UserRole): string | null {
	if (role === "admin") {
		return resolveAdminAccountId();
	}

	if (role === "manager") {
		return resolveManagerAccountId(DEFAULT_MANAGER_EMAIL);
	}

	return null;
}

/**
 * Read the runtime auth mode from the deployment environment.
 */
export function getAuthMode(): AuthMode {
	return normalizeAuthMode(process.env.AUTH_MODE);
}

/**
 * Return whether the app should auto-seed a mock dashboard session.
 */
export function isMockAuthMode(): boolean {
	return getAuthMode() === "mock";
}

/**
 * Derive the role that best matches the requested route in mock mode.
 */
export function resolveMockRoleForPath(pathname: string, currentRole: UserRole | null = null): UserRole {
	if (pathname.startsWith("/admin")) {
		return "admin";
	}

	if (pathname.startsWith("/manager")) {
		return "manager";
	}

	if (pathname.startsWith("/auditor")) {
		return "auditor";
	}

	if (pathname.startsWith("/settings")) {
		return currentRole ?? "admin";
	}

	return currentRole ?? "admin";
}

/**
 * Build the cookie/header session shape used by the frontend and demo API.
 */
export function buildMockAuthSession(
	role: UserRole,
	overrides: Partial<Pick<AuthSession, "accessToken" | "accountId" | "auditorCode">> = {}
): AuthSession {
	const normalizedAccessToken = overrides.accessToken?.trim();
	const normalizedAccountId = overrides.accountId?.trim();
	const normalizedAuditorCode = overrides.auditorCode?.trim();

	return {
		role,
		accessToken:
			normalizedAccessToken && normalizedAccessToken.length > 0 ? normalizedAccessToken : `mock-${role}-token`,
		accountId:
			role === "auditor"
				? null
				: normalizedAccountId && normalizedAccountId.length > 0
					? normalizedAccountId
					: getDefaultAccountId(role),
		auditorCode:
			role === "auditor"
				? normalizedAuditorCode && normalizedAuditorCode.length > 0
					? normalizedAuditorCode
					: DEFAULT_AUDITOR_CODE
				: null
	};
}

/**
 * Parse a request header role into a seeded mock session when possible.
 */
export function getMockAuthSessionFromHeader(
	roleHeaderValue: string | null,
	overrides: Partial<Pick<AuthSession, "accountId" | "auditorCode">> = {}
): AuthSession | null {
	const role = parseUserRole(roleHeaderValue);
	if (!role) {
		return null;
	}

	return buildMockAuthSession(role, overrides);
}

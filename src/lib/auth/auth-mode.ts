import { resolveAdminAccountId, resolveManagerAccountId } from "./demo-identities";
import type { UserRole } from "./role";
import type { AuthSession } from "./session";

export type AuthMode = "real" | "mock";

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
 * Return whether the app should use the mock login flow.
 */
export function isMockAuthMode(): boolean {
	return getAuthMode() === "mock";
}

/**
 * Return the default landing page for a signed-in role.
 */
export function getDefaultDashboardPath(role: UserRole): string {
	if (role === "admin") {
		return "/admin/dashboard";
	}

	return role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
}

/**
 * Ensure post-login redirects stay inside the app.
 */
export function isSafeInternalPath(value: string): boolean {
	return value.startsWith("/") && !value.startsWith("//");
}

/**
 * Restrict post-login redirects to routes allowed for the selected role.
 */
export function resolvePostLoginPath(role: UserRole, nextPath: string | null): string {
	if (!nextPath || !isSafeInternalPath(nextPath)) {
		return getDefaultDashboardPath(role);
	}

	if (nextPath.startsWith("/settings")) {
		return nextPath;
	}

	if (role === "admin" && nextPath.startsWith("/admin")) {
		return nextPath;
	}

	if (role === "manager" && nextPath.startsWith("/manager")) {
		return nextPath;
	}

	if (role === "auditor" && nextPath.startsWith("/auditor")) {
		return nextPath;
	}

	return getDefaultDashboardPath(role);
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

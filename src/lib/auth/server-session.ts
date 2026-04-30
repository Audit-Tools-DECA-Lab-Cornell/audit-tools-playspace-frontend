import { cookies } from "next/headers";

import { AUTH_COOKIE_NAMES, parseUserRole } from "./role";
import type { AuthNextStep, AuthSession } from "./session";

export type ServerAuthSession = AuthSession;

function parseAuthNextStep(value: string | null | undefined): AuthNextStep {
	if (
		value === "VERIFY_EMAIL" ||
		value === "WAITING_APPROVAL" ||
		value === "COMPLETE_PROFILE" ||
		value === "DASHBOARD"
	) {
		return value;
	}

	return "DASHBOARD";
}

/**
 * Reads the current auth session from request cookies in a Server Component.
 */
export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
	const cookieStore = await cookies();

	const role = parseUserRole(cookieStore.get(AUTH_COOKIE_NAMES.role)?.value);
	const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;
	const accountId = cookieStore.get(AUTH_COOKIE_NAMES.accountId)?.value ?? null;

	if (!role || !accessToken) return null;

	const auditorCode = role === "auditor" ? (cookieStore.get(AUTH_COOKIE_NAMES.auditorCode)?.value ?? null) : null;
	const userName = cookieStore.get(AUTH_COOKIE_NAMES.userName)?.value ?? null;
	const userEmail = cookieStore.get(AUTH_COOKIE_NAMES.userEmail)?.value ?? null;
	const nextStep = parseAuthNextStep(cookieStore.get(AUTH_COOKIE_NAMES.nextStep)?.value);

	return { role, accessToken, accountId, auditorCode, userName, userEmail, nextStep };
}

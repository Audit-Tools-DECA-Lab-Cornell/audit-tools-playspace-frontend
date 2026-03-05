import { cookies } from "next/headers";

import { AUTH_COOKIE_NAMES, parseUserRole, type UserRole } from "./role";

export interface ServerAuthSession {
	role: UserRole;
	accessToken: string;
	/**
	 * Auditors are identified strictly by an alphanumeric code (no real names).
	 */
	auditorCode: string | null;
}

/**
 * Reads the current auth session from request cookies in a Server Component.
 */
export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
	const cookieStore = await cookies();

	const role = parseUserRole(cookieStore.get(AUTH_COOKIE_NAMES.role)?.value);
	const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;

	if (!role || !accessToken) return null;

	const auditorCode = role === "auditor" ? (cookieStore.get(AUTH_COOKIE_NAMES.auditorCode)?.value ?? null) : null;

	return { role, accessToken, auditorCode };
}

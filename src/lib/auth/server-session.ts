import { cookies } from "next/headers";

import { AUTH_COOKIE_NAMES, parseUserRole } from "./role";
import type { AuthSession } from "./session";

export type ServerAuthSession = AuthSession;

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

	return { role, accessToken, accountId, auditorCode };
}

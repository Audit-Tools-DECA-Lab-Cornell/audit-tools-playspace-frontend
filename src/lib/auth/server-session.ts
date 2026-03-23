import { cookies, headers } from "next/headers";

import { buildMockAuthSession, getMockAuthSessionFromHeader, isMockAuthMode, MOCK_AUTH_HEADERS } from "./auth-mode";
import { AUTH_COOKIE_NAMES, parseUserRole } from "./role";
import type { AuthSession } from "./session";

export type ServerAuthSession = AuthSession;

function normalizeCookieValue(value: string | null | undefined): string | null {
	const normalizedValue = value?.trim();
	return normalizedValue && normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Reads the current auth session from request cookies in a Server Component.
 */
export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
	const cookieStore = await cookies();

	const role = parseUserRole(cookieStore.get(AUTH_COOKIE_NAMES.role)?.value);
	const accessToken = normalizeCookieValue(cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value);
	const accountId = normalizeCookieValue(cookieStore.get(AUTH_COOKIE_NAMES.accountId)?.value);

	if (role && accessToken) {
		const auditorCode =
			role === "auditor" ? normalizeCookieValue(cookieStore.get(AUTH_COOKIE_NAMES.auditorCode)?.value) : null;

		return { role, accessToken, accountId, auditorCode };
	}

	if (!isMockAuthMode()) {
		return null;
	}

	if (role) {
		const auditorCode =
			role === "auditor" ? normalizeCookieValue(cookieStore.get(AUTH_COOKIE_NAMES.auditorCode)?.value) : null;
		return buildMockAuthSession(role, {
			accessToken: accessToken ?? undefined,
			accountId,
			auditorCode
		});
	}

	const headerStore = await headers();
	const headerSession = getMockAuthSessionFromHeader(headerStore.get(MOCK_AUTH_HEADERS.role), {
		accountId: normalizeCookieValue(headerStore.get(MOCK_AUTH_HEADERS.accountId)),
		auditorCode: normalizeCookieValue(headerStore.get(MOCK_AUTH_HEADERS.auditorCode))
	});
	if (headerSession) {
		return headerSession;
	}

	return buildMockAuthSession("admin");
}

import { NextResponse, type NextRequest } from "next/server";

import { buildMockAuthSession, isMockAuthMode, resolvePostLoginPath } from "@/lib/auth/auth-mode";
import { AUTH_COOKIE_NAMES, parseUserRole } from "@/lib/auth/role";

const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function setSessionCookie(response: NextResponse, name: string, value: string) {
	response.cookies.set(name, value, {
		path: "/",
		maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
		sameSite: "lax"
	});
}

function clearSessionCookie(response: NextResponse, name: string) {
	response.cookies.set(name, "", {
		path: "/",
		maxAge: 0,
		sameSite: "lax"
	});
}

/**
 * Seed a role-scoped mock session in non-production auth mode.
 */
export async function GET(request: NextRequest) {
	if (!isMockAuthMode()) {
		return new NextResponse("Not found.", {
			status: 404
		});
	}

	const role = parseUserRole(request.nextUrl.searchParams.get("role"));
	if (!role) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const nextPath = resolvePostLoginPath(role, request.nextUrl.searchParams.get("next"));
	const session = buildMockAuthSession(role);
	const response = NextResponse.redirect(new URL(nextPath, request.url));

	setSessionCookie(response, AUTH_COOKIE_NAMES.role, session.role);
	setSessionCookie(response, AUTH_COOKIE_NAMES.accessToken, session.accessToken);
	if (session.accountId) {
		setSessionCookie(response, AUTH_COOKIE_NAMES.accountId, session.accountId);
	} else {
		clearSessionCookie(response, AUTH_COOKIE_NAMES.accountId);
	}
	if (session.auditorCode) {
		setSessionCookie(response, AUTH_COOKIE_NAMES.auditorCode, session.auditorCode);
	} else {
		clearSessionCookie(response, AUTH_COOKIE_NAMES.auditorCode);
	}

	return response;
}

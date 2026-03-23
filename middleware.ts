import { NextResponse, type NextRequest } from "next/server";

import { buildMockAuthSession, isMockAuthMode, MOCK_AUTH_HEADERS, resolveMockRoleForPath } from "@/lib/auth/auth-mode";
import { AUTH_COOKIE_NAMES, parseUserRole, type UserRole } from "@/lib/auth/role";

interface AuthState {
	role: UserRole | null;
	isAuthenticated: boolean;
}

function redirectToLogin(request: NextRequest) {
	const loginUrl = request.nextUrl.clone();
	loginUrl.pathname = "/login";

	const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	loginUrl.searchParams.set("next", nextPath);

	return NextResponse.redirect(loginUrl);
}

function getAuthState(request: NextRequest): AuthState {
	const role = parseUserRole(request.cookies.get(AUTH_COOKIE_NAMES.role)?.value);
	const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;

	return {
		role,
		isAuthenticated: Boolean(role && accessToken)
	};
}

function getSessionCookieOptions() {
	return {
		path: "/",
		maxAge: 60 * 60 * 8,
		sameSite: "lax" as const
	};
}

function clearSessionCookie(response: NextResponse, name: string) {
	response.cookies.set(name, "", {
		path: "/",
		maxAge: 0,
		sameSite: "lax" as const
	});
}

function getDashboardPath(role: UserRole): string {
	if (role === "admin") {
		return "/admin/dashboard";
	}

	return role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
}

function getFallbackDashboardPath(currentRole: UserRole, requiredRole: UserRole): string {
	if (requiredRole === "admin") {
		return currentRole === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
	}

	if (requiredRole === "manager") {
		return currentRole === "admin" ? "/admin/dashboard" : "/auditor/dashboard";
	}

	return currentRole === "admin" ? "/admin/dashboard" : "/manager/dashboard";
}

function handleLoginRoute(request: NextRequest, auth: AuthState): NextResponse {
	if (!auth.isAuthenticated || !auth.role) {
		return NextResponse.next();
	}

	return NextResponse.redirect(new URL(getDashboardPath(auth.role), request.url));
}

function handleProtectedRoleRoute(request: NextRequest, auth: AuthState, requiredRole: UserRole): NextResponse {
	if (!auth.isAuthenticated || !auth.role) {
		return redirectToLogin(request);
	}

	if (auth.role !== requiredRole) {
		return NextResponse.redirect(new URL(getFallbackDashboardPath(auth.role, requiredRole), request.url));
	}

	return NextResponse.next();
}

function createMockAuthResponse(request: NextRequest) {
	const currentRole = getAuthState(request).role;
	const role = resolveMockRoleForPath(request.nextUrl.pathname, currentRole);
	const mockSession = buildMockAuthSession(role);
	const requestHeaders = new Headers(request.headers);

	requestHeaders.set(MOCK_AUTH_HEADERS.role, mockSession.role);
	if (mockSession.accountId) {
		requestHeaders.set(MOCK_AUTH_HEADERS.accountId, mockSession.accountId);
	} else {
		requestHeaders.delete(MOCK_AUTH_HEADERS.accountId);
	}
	if (mockSession.auditorCode) {
		requestHeaders.set(MOCK_AUTH_HEADERS.auditorCode, mockSession.auditorCode);
	} else {
		requestHeaders.delete(MOCK_AUTH_HEADERS.auditorCode);
	}

	const response = NextResponse.next({
		request: {
			headers: requestHeaders
		}
	});
	const cookieOptions = getSessionCookieOptions();

	response.cookies.set(AUTH_COOKIE_NAMES.role, mockSession.role, cookieOptions);
	response.cookies.set(AUTH_COOKIE_NAMES.accessToken, mockSession.accessToken, cookieOptions);
	if (mockSession.accountId) {
		response.cookies.set(AUTH_COOKIE_NAMES.accountId, mockSession.accountId, cookieOptions);
	} else {
		clearSessionCookie(response, AUTH_COOKIE_NAMES.accountId);
	}
	if (mockSession.auditorCode) {
		response.cookies.set(AUTH_COOKIE_NAMES.auditorCode, mockSession.auditorCode, cookieOptions);
	} else {
		clearSessionCookie(response, AUTH_COOKIE_NAMES.auditorCode);
	}

	return response;
}

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const auth = getAuthState(request);

	if (pathname.startsWith("/login")) {
		return handleLoginRoute(request, auth);
	}

	if (isMockAuthMode()) {
		return createMockAuthResponse(request);
	}

	if (pathname.startsWith("/admin")) {
		return handleProtectedRoleRoute(request, auth, "admin");
	}

	if (pathname.startsWith("/manager")) {
		return handleProtectedRoleRoute(request, auth, "manager");
	}

	if (pathname.startsWith("/auditor")) {
		return handleProtectedRoleRoute(request, auth, "auditor");
	}

	if (pathname.startsWith("/settings")) {
		if (!auth.isAuthenticated) return redirectToLogin(request);
		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/login", "/admin/:path*", "/manager/:path*", "/auditor/:path*", "/settings/:path*"]
};

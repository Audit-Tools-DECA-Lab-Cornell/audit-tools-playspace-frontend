import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAMES, parseUserRole } from "./src/lib/auth/role";

function redirectToLogin(request: NextRequest) {
	const loginUrl = request.nextUrl.clone();
	loginUrl.pathname = "/login";

	const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	loginUrl.searchParams.set("next", nextPath);

	return NextResponse.redirect(loginUrl);
}

function getAuthState(request: NextRequest) {
	const role = parseUserRole(request.cookies.get(AUTH_COOKIE_NAMES.role)?.value);
	const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;

	return {
		role,
		isAuthenticated: Boolean(role && accessToken)
	};
}

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const auth = getAuthState(request);

	if (pathname.startsWith("/login")) {
		if (!auth.isAuthenticated || !auth.role) return NextResponse.next();
		const dashboardPath = auth.role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
		return NextResponse.redirect(new URL(dashboardPath, request.url));
	}

	if (pathname.startsWith("/manager")) {
		if (!auth.isAuthenticated) return redirectToLogin(request);
		if (auth.role !== "manager") {
			return NextResponse.redirect(new URL("/auditor/dashboard", request.url));
		}
		return NextResponse.next();
	}

	if (pathname.startsWith("/auditor")) {
		if (!auth.isAuthenticated) return redirectToLogin(request);
		if (auth.role !== "auditor") {
			return NextResponse.redirect(new URL("/manager/dashboard", request.url));
		}
		return NextResponse.next();
	}

	if (pathname.startsWith("/settings")) {
		if (!auth.isAuthenticated) return redirectToLogin(request);
		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/login", "/manager/:path*", "/auditor/:path*", "/settings/:path*"]
};

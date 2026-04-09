"use client";

import { AUTH_COOKIE_NAMES, parseUserRole, type UserRole } from "./role";
import type { AuthSession } from "./session";

export type BrowserAuthSession = AuthSession;

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;

	const entries = document.cookie
		.split(";")
		.map(part => part.trim())
		.filter(part => part.length > 0);

	for (const entry of entries) {
		const [cookieName, ...cookieValueParts] = entry.split("=");
		if (cookieName !== name) continue;
		const rawValue = cookieValueParts.join("=");
		try {
			return decodeURIComponent(rawValue);
		} catch {
			return rawValue;
		}
	}

	return null;
}

function setCookieValue(name: string, value: string, maxAgeSeconds: number) {
	if (typeof document === "undefined") return;

	const encoded = encodeURIComponent(value);
	document.cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getBrowserAuthSession(): BrowserAuthSession | null {
	const role = parseUserRole(getCookieValue(AUTH_COOKIE_NAMES.role));
	const accessToken = getCookieValue(AUTH_COOKIE_NAMES.accessToken);
	if (!role || !accessToken) return null;

	const accountId = getCookieValue(AUTH_COOKIE_NAMES.accountId);
	const auditorCode = role === "auditor" ? getCookieValue(AUTH_COOKIE_NAMES.auditorCode) || null : null;
	const userName = getCookieValue(AUTH_COOKIE_NAMES.userName);
	const userEmail = getCookieValue(AUTH_COOKIE_NAMES.userEmail);

	return { role, accessToken, accountId, auditorCode, userName, userEmail };
}

export function setBrowserAuthSession(input: {
	role: UserRole;
	accessToken: string;
	accountId?: string | null;
	auditorCode?: string | null;
	userName?: string | null;
	userEmail?: string | null;
}) {
	// 8 hours
	const maxAgeSeconds = 60 * 60 * 8;

	setCookieValue(AUTH_COOKIE_NAMES.role, input.role, maxAgeSeconds);
	setCookieValue(AUTH_COOKIE_NAMES.accessToken, input.accessToken, maxAgeSeconds);
	if (input.accountId && input.accountId.trim().length > 0) {
		setCookieValue(AUTH_COOKIE_NAMES.accountId, input.accountId, maxAgeSeconds);
	} else {
		clearCookie(AUTH_COOKIE_NAMES.accountId);
	}

	if (input.role === "auditor") {
		if (input.auditorCode && input.auditorCode.trim().length > 0) {
			setCookieValue(AUTH_COOKIE_NAMES.auditorCode, input.auditorCode, maxAgeSeconds);
		} else {
			clearCookie(AUTH_COOKIE_NAMES.auditorCode);
		}
	} else {
		clearCookie(AUTH_COOKIE_NAMES.auditorCode);
	}

	if (input.userName && input.userName.trim().length > 0) {
		setCookieValue(AUTH_COOKIE_NAMES.userName, input.userName, maxAgeSeconds);
	} else {
		clearCookie(AUTH_COOKIE_NAMES.userName);
	}

	if (input.userEmail && input.userEmail.trim().length > 0) {
		setCookieValue(AUTH_COOKIE_NAMES.userEmail, input.userEmail, maxAgeSeconds);
	} else {
		clearCookie(AUTH_COOKIE_NAMES.userEmail);
	}
}

export function clearBrowserAuthSession() {
	clearCookie(AUTH_COOKIE_NAMES.role);
	clearCookie(AUTH_COOKIE_NAMES.accessToken);
	clearCookie(AUTH_COOKIE_NAMES.accountId);
	clearCookie(AUTH_COOKIE_NAMES.auditorCode);
	clearCookie(AUTH_COOKIE_NAMES.userName);
	clearCookie(AUTH_COOKIE_NAMES.userEmail);
}

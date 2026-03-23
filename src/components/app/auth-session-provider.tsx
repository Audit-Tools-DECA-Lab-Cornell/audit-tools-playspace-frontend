"use client";

import * as React from "react";

import { getBrowserAuthSession, setBrowserAuthSession } from "@/lib/auth/browser-session";
import type { AuthSession } from "@/lib/auth/session";

const AuthSessionContext = React.createContext<AuthSession | null>(null);

export interface AuthSessionProviderProps {
	initialSession: AuthSession | null;
	children: React.ReactNode;
}

function areSessionsEqual(left: AuthSession | null, right: AuthSession | null): boolean {
	if (left === right) {
		return true;
	}

	if (left === null || right === null) {
		return false;
	}

	return (
		left.role === right.role &&
		left.accessToken === right.accessToken &&
		left.accountId === right.accountId &&
		left.auditorCode === right.auditorCode
	);
}

/**
 * Hydrate a shared auth session context for client dashboard screens.
 */
export function AuthSessionProvider({ initialSession, children }: Readonly<AuthSessionProviderProps>) {
	const [session, setSession] = React.useState<AuthSession | null>(initialSession);

	React.useEffect(() => {
		const browserSession = getBrowserAuthSession();

		// Keep the browser cookies aligned with the server-rendered session so client API calls
		// immediately reuse the same role context during mock-mode navigation.
		if (initialSession !== null) {
			if (!areSessionsEqual(browserSession, initialSession)) {
				setBrowserAuthSession({
					role: initialSession.role,
					accessToken: initialSession.accessToken,
					accountId: initialSession.accountId,
					auditorCode: initialSession.auditorCode
				});
			}
			setSession(initialSession);
			return;
		}

		if (browserSession !== null) {
			setSession(browserSession);
		}
	}, [initialSession]);

	return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
}

/**
 * Read the current auth session from the nearest protected-layout provider.
 */
export function useAuthSession(): AuthSession | null {
	return React.useContext(AuthSessionContext);
}

/**
 * Typed helpers for the Playspace auth endpoints on the backend.
 */

export interface AuthUser {
	id: string;
	email: string;
	name: string | null;
	account_id: string | null;
	organization: string | null;
	account_type: "ADMIN" | "MANAGER" | "AUDITOR";
	email_verified: boolean;
	approved: boolean;
	profile_completed: boolean;
	next_step: "VERIFY_EMAIL" | "WAITING_APPROVAL" | "COMPLETE_PROFILE" | "DASHBOARD";
	dashboard_path: string;
}

export interface AuthResponse {
	access_token: string;
	token_type: string;
	expires_at: string;
	user: AuthUser;
}

function getApiBaseUrl(): string {
	const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (envBaseUrl && envBaseUrl.trim().length > 0) return envBaseUrl;
	return "http://127.0.0.1:8000";
}

function getErrorDetail(payload: unknown): string {
	if (typeof payload === "object" && payload !== null && "detail" in payload) {
		const detail = (payload as { detail: unknown }).detail;
		if (typeof detail === "string" && detail.trim().length > 0) return detail;
	}
	return "";
}

export async function loginWithCredentials(email: string, password: string): Promise<AuthResponse> {
	const response = await fetch(`${getApiBaseUrl()}/playspace/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password })
	});

	const payload: unknown = await response.json().catch(() => null);

	if (!response.ok) {
		const detail = getErrorDetail(payload);
		throw new Error(detail || "Invalid email or password.");
	}

	return payload as AuthResponse;
}

export async function signupWithCredentials(input: {
	email: string;
	password: string;
	name?: string;
	account_type?: "ADMIN" | "MANAGER" | "AUDITOR";
}): Promise<AuthResponse> {
	const response = await fetch(`${getApiBaseUrl()}/playspace/auth/signup`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input)
	});

	const payload: unknown = await response.json().catch(() => null);

	if (!response.ok) {
		const detail = getErrorDetail(payload);
		throw new Error(detail || "Signup failed.");
	}

	return payload as AuthResponse;
}

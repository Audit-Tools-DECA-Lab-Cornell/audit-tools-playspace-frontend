import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { AUTH_COOKIE_NAMES } from "@/lib/auth/role";

export interface ApiClientOptions {
	baseURL?: string;
}

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

function clearCookie(name: string) {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function getDefaultBaseUrl(): string {
	const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (envBaseUrl && envBaseUrl.trim().length > 0) return envBaseUrl;

	// Local FastAPI default (macOS).
	return "http://127.0.0.1:8000";
}

function attachAuthToken(config: InternalAxiosRequestConfig) {
	const accessToken = getCookieValue(AUTH_COOKIE_NAMES.accessToken);
	const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);

	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}
	const role = getCookieValue(AUTH_COOKIE_NAMES.role);
	if (role) {
		headers.set("x-demo-role", role);
	}
	const accountId = getCookieValue(AUTH_COOKIE_NAMES.accountId);
	if (accountId) {
		headers.set("x-demo-account-id", accountId);
	}
	const auditorCode = getCookieValue(AUTH_COOKIE_NAMES.auditorCode);
	if (auditorCode) {
		headers.set("x-demo-auditor-code", auditorCode);
	}
	config.headers = headers;
	return config;
}

function handleUnauthorized(error: AxiosError) {
	if (globalThis.window === undefined) return;
	if (error.response?.status !== 401) return;

	clearCookie(AUTH_COOKIE_NAMES.role);
	clearCookie(AUTH_COOKIE_NAMES.accessToken);
	clearCookie(AUTH_COOKIE_NAMES.accountId);
	clearCookie(AUTH_COOKIE_NAMES.auditorCode);

	globalThis.window.location.assign("/login");
}

export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
	const api = axios.create({
		baseURL: options.baseURL ?? getDefaultBaseUrl(),
		withCredentials: true,
		headers: {
			"Content-Type": "application/json"
		}
	});

	api.interceptors.request.use(attachAuthToken);
	api.interceptors.response.use(
		response => response,
		(error: AxiosError) => {
			handleUnauthorized(error);
			return Promise.reject(error);
		}
	);

	return api;
}

/**
 * Default API client for browser usage (React Query, forms, etc.).
 */
export const api = createApiClient();

import { expect, type APIRequestContext } from "@playwright/test";
import { e2eUsers, type E2ERole } from "../fixtures/users";

export function getApiBaseUrl(): string {
	return process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

export async function loginViaApi(request: APIRequestContext, role: E2ERole): Promise<string> {
	const credentials = e2eUsers[role];
	const response = await request.post(`${getApiBaseUrl()}/playspace/auth/login`, {
		data: {
			email: credentials.email,
			password: credentials.password
		}
	});
	expect(response.ok(), await response.text()).toBeTruthy();
	const payload = (await response.json()) as { access_token?: string };
	expect(payload.access_token).toBeTruthy();
	return payload.access_token ?? "";
}

export function bearerHeaders(token: string): Record<string, string> {
	return { Authorization: `bearer ${token}` };
}

export async function expectOk(response: { ok(): boolean; text(): Promise<string> }): Promise<void> {
	expect(response.ok(), await response.text()).toBeTruthy();
}

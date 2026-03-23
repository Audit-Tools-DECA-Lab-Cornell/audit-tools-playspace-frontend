import { redirect } from "next/navigation";

import { isMockAuthMode } from "@/lib/auth/auth-mode";
import { parseUserRole } from "@/lib/auth/role";

import { LoginForm } from "./login-form";

type LoginSearchParams = {
	next?: string | string[];
	mockRole?: string | string[];
};

export default async function LoginPage({ searchParams }: Readonly<{ searchParams?: Promise<LoginSearchParams> }>) {
	const resolved = (await searchParams) ?? {};
	const nextParamValue = resolved.next;
	const nextParam = Array.isArray(nextParamValue) ? (nextParamValue[0] ?? null) : (nextParamValue ?? null);
	const mockRoleValue = resolved.mockRole;
	const mockRoleParam = Array.isArray(mockRoleValue) ? (mockRoleValue[0] ?? null) : (mockRoleValue ?? null);
	const mockRole = parseUserRole(mockRoleParam);

	if (isMockAuthMode() && mockRole) {
		const mockLoginParams = new URLSearchParams({
			role: mockRole
		});
		if (nextParam) {
			mockLoginParams.set("next", nextParam);
		}

		redirect(`/api/mock-login?${mockLoginParams.toString()}`);
	}

	return <LoginForm nextParam={nextParam} isMockMode={isMockAuthMode()} />;
}

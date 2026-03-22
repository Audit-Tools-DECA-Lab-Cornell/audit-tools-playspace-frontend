import { LoginForm } from "./login-form";

type LoginSearchParams = {
	next?: string | string[];
};

export default async function LoginPage({ searchParams }: Readonly<{ searchParams?: Promise<LoginSearchParams> }>) {
	const resolved = (await searchParams) ?? {};
	const nextParamValue = resolved.next;
	const nextParam = Array.isArray(nextParamValue) ? (nextParamValue[0] ?? null) : (nextParamValue ?? null);

	return <LoginForm nextParam={nextParam} />;
}

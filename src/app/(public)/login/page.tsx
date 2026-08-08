import { LoginForm } from "./login-form";

type LoginSearchParams = {
	next?: string | string[];
	account_deleted?: string | string[];
};

/**
 * Read a single query value whether Next.js handed us a string or a string[].
 */
function readSingleSearchParam(value: string | string[] | undefined): string | null {
	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value ?? null;
}

export default async function LoginPage({ searchParams }: Readonly<{ searchParams?: Promise<LoginSearchParams> }>) {
	const resolved = (await searchParams) ?? {};
	const nextParam = readSingleSearchParam(resolved.next);
	const accountDeleted = readSingleSearchParam(resolved.account_deleted) === "1";

	return <LoginForm nextParam={nextParam} accountDeleted={accountDeleted} />;
}

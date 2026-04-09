import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { AuthSessionProvider } from "@/components/app/auth-session-provider";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const session = await getServerAuthSession();
	if (!session) redirect("/login");

	return (
		<AuthSessionProvider initialSession={session}>
			<AppShell
				role={session.role}
				auditorCode={session.auditorCode}
				userName={session.userName}
				userEmail={session.userEmail}>
				{children}
			</AppShell>
		</AuthSessionProvider>
	);
}

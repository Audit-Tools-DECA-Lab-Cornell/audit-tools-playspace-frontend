import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function HomePage() {
	const session = await getServerAuthSession();

	if (!session) {
		redirect("/login");
	}
	redirect(session.role === "manager" ? "/manager/dashboard" : "/auditor/dashboard");
}

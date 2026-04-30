import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function HomePage() {
	const session = await getServerAuthSession();

	if (!session) {
		redirect("/login");
	}
	if (session.role === "admin") {
		redirect("/admin/dashboard");
	}
	if (session.role === "manager") {
		redirect("/manager/dashboard");
	}
	redirect(session.nextStep === "DASHBOARD" ? "/auditor/dashboard" : "/auditor/onboarding");
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
	const t = await getTranslations("notFound");

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-card-foreground">
				<div className="space-y-1">
					<h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
					<p className="text-sm text-muted-foreground">
						{t("description")}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild>
						<Link href="/login">{t("actions.login")}</Link>
					</Button>
					<Button asChild variant="secondary">
						<Link href="/">{t("actions.home")}</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

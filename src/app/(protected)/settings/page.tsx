"use client";

import { useRouter } from "next/navigation";

import { clearBrowserAuthSession, getBrowserAuthSession } from "@/lib/auth/browser-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
	const router = useRouter();
	const session = getBrowserAuthSession();

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">Profile and account management.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Session</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm">
						<p>
							<span className="text-muted-foreground">Role:</span>{" "}
							<span className="font-medium">{session?.role ?? "unknown"}</span>
						</p>
						{session?.role === "auditor" ? (
							<p>
								<span className="text-muted-foreground">Auditor code:</span>{" "}
								<span className="font-mono font-medium">{session.auditorCode ?? "—"}</span>
							</p>
						) : null}
					</div>

					<Button
						type="button"
						variant="secondary"
						onClick={() => {
							clearBrowserAuthSession();
							router.push("/login");
						}}>
						Sign out
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSystemPage() {
	const systemQuery = useQuery({
		queryKey: ["playspace", "admin", "system"],
		queryFn: () => playspaceApi.admin.system()
	});

	if (systemQuery.isLoading) {
		return <div className="h-40 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (systemQuery.isError || !systemQuery.data) {
		return (
			<EmptyState
				title="System metadata unavailable"
				description="Refresh this page to retry. If the issue continues, return to the administrator dashboard and reopen system metadata."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const system = systemQuery.data;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="System metadata"
				description="Runtime metadata and instrument versioning for the audit platform."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "System" }]}
				actions={
					<Button asChild variant="outline">
						<Link href="/admin/dashboard">Back to dashboard</Link>
					</Button>
				}
			/>
			<Card>
				<CardHeader>
					<CardTitle>Instrument</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
					<div className="space-y-1">
						<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Key</p>
						<p className="font-mono text-sm text-foreground uppercase tracking-[0.12em]">
							{system.instrument_key}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Name</p>
						<p className="text-sm font-medium text-foreground">{system.instrument_name}</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
							Version
						</p>
						<p className="font-mono text-sm text-foreground">{system.instrument_version}</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
							Generated
						</p>
						<p className="text-sm text-foreground tabular-nums">
							{formatDateTimeLabel(system.generated_at)}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

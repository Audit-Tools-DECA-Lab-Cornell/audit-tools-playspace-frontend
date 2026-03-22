"use client";

import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { BASE_PLAYSPACE_INSTRUMENT } from "@/lib/instrument";
import { BackButton } from "@/components/dashboard/back-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
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
	const totalSectionCount = BASE_PLAYSPACE_INSTRUMENT.sections.length;
	const totalPreAuditQuestionCount = BASE_PLAYSPACE_INSTRUMENT.pre_audit_questions.length;
	const totalSectionQuestionCount = BASE_PLAYSPACE_INSTRUMENT.sections.reduce((questionTotal, section) => {
		return questionTotal + section.questions.length;
	}, 0);
	const totalQuestionCount = totalPreAuditQuestionCount + totalSectionQuestionCount;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Administrator Workspace"
				title="System metadata"
				description="Runtime metadata and instrument versioning for the audit platform."
				breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "System" }]}
				actions={<BackButton href="/admin/dashboard" label="Back to dashboard" />}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Instrument Version"
					value={system.instrument_version}
					valueClassName="font-sans text-xl leading-snug md:text-2xl"
					helper="Current version served to audit sessions."
				/>
				<StatCard
					title="Audit Sections"
					value={String(totalSectionCount)}
					helper="Structured domains in the core instrument."
					tone="violet"
				/>
				<StatCard
					title="Question Count"
					value={String(totalQuestionCount)}
					helper={`${totalPreAuditQuestionCount} pre-audit prompts and ${totalSectionQuestionCount} section questions.`}
					tone="warning"
				/>
				<StatCard
					title="Execution Modes"
					value={String(BASE_PLAYSPACE_INSTRUMENT.execution_modes.length)}
					helper="Supported combinations of onsite and survey workflows."
					tone="success"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<Card>
					<CardHeader>
						<CardTitle>Instrument metadata</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-5 pb-5 sm:grid-cols-2">
						<div className="space-y-1">
							<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">Key</p>
							<p className="font-mono text-sm text-foreground">{system.instrument_key}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">Name</p>
							<p className="text-sm font-medium text-foreground">{system.instrument_name}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">Current sheet</p>
							<p className="text-sm text-foreground">{BASE_PLAYSPACE_INSTRUMENT.current_sheet}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">Generated</p>
							<p className="text-sm text-foreground tabular-nums">
								{formatDateTimeLabel(system.generated_at)}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Execution coverage</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pb-5">
						<p className="text-sm text-muted-foreground">
							The platform currently supports distinct onsite, survey, and combined audit paths. These
							modes control which sections unlock during execution.
						</p>
						<div className="flex flex-wrap gap-2">
							{BASE_PLAYSPACE_INSTRUMENT.execution_modes.map(mode => (
								<Badge key={mode.key} variant="outline">
									{mode.key}
								</Badge>
							))}
						</div>
						<div className="space-y-3">
							{BASE_PLAYSPACE_INSTRUMENT.execution_modes.map(mode => (
								<div key={mode.key} className="rounded-card border border-border/70 bg-card/60 p-4">
									<p className="font-medium text-foreground">{mode.label}</p>
									<p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

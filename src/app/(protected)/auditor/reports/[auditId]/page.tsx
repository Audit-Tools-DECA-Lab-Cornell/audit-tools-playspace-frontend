"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { playspaceApi } from "@/lib/api/playspace";
import { BASE_PLAYSPACE_INSTRUMENT } from "@/lib/instrument";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sectionTitleByKey = Object.fromEntries(
	BASE_PLAYSPACE_INSTRUMENT.sections.map(section => [section.section_key, section.title])
);

function formatStringArray(values: string[]): string {
	if (values.length === 0) return "Not provided";
	return values.join(", ");
}

export default function AuditorReportDetailPage() {
	const params = useParams<{ auditId: string }>();
	const auditId = params.auditId;

	const auditQuery = useQuery({
		queryKey: ["playspace", "auditor", "audit", auditId],
		queryFn: () => playspaceApi.auditor.getAudit(auditId),
		enabled: typeof auditId === "string" && auditId.length > 0
	});

	if (auditQuery.isLoading || !auditId) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (auditQuery.isError || !auditQuery.data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Unable to load audit detail</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Try refreshing the page or return to reports and re-open the audit.
					</p>
					<Button asChild>
						<Link href="/auditor/reports">Back to reports</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const audit = auditQuery.data;
	const sectionRows = Object.values(audit.sections);
	const canResumeAudit = audit.status !== "SUBMITTED";

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Auditor Report Detail"
				title={audit.place_name}
				description={`${audit.audit_code} · ${audit.status.toLowerCase().replaceAll("_", " ")}`}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						{canResumeAudit ? (
							<Button asChild>
								<Link href={`/auditor/execute/${encodeURIComponent(audit.place_id)}`}>
									Resume audit
								</Link>
							</Button>
						) : null}
						<Button asChild variant="secondary">
							<Link href="/auditor/reports">Back to reports</Link>
						</Button>
					</div>
				}
			/>
			{canResumeAudit ? (
				<Card>
					<CardHeader>
						<CardTitle>Audit still in progress</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Use the execution workspace to finish required questions before this session can be
							submitted.
						</p>
						<Button asChild variant="outline">
							<Link href={`/auditor/execute/${encodeURIComponent(audit.place_id)}`}>
								Continue in execution workspace
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : null}
			<div className="grid gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Session metadata</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>Started: {formatDateTimeLabel(audit.started_at)}</p>
						<p>Submitted: {formatDateTimeLabel(audit.submitted_at)}</p>
						<p>Execution mode: {audit.meta.execution_mode ?? "Not selected"}</p>
						<p>Ready to submit: {audit.progress.ready_to_submit ? "Yes" : "No"}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Scores</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							Summary:{" "}
							{formatScoreLabel(
								audit.scores.overall
									? audit.scores.overall.play_value_total + audit.scores.overall.usability_total
									: null
							)}
						</p>
						<p>
							Play value:{" "}
							{audit.scores.overall ? String(audit.scores.overall.play_value_total) : "Pending"}
						</p>
						<p>
							Usability: {audit.scores.overall ? String(audit.scores.overall.usability_total) : "Pending"}
						</p>
						<p>
							Sociability:{" "}
							{audit.scores.overall ? String(audit.scores.overall.sociability_total) : "Pending"}
						</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Pre-audit answers</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
					<p>Season: {audit.pre_audit.season ?? "Not provided"}</p>
					<p>User count: {audit.pre_audit.user_count ?? "Not provided"}</p>
					<p>Place size: {audit.pre_audit.place_size ?? "Not provided"}</p>
					<p>Weather: {formatStringArray(audit.pre_audit.weather_conditions)}</p>
					<p>Users present: {formatStringArray(audit.pre_audit.users_present)}</p>
					<p>Age groups: {formatStringArray(audit.pre_audit.age_groups)}</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Section notes</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{sectionRows.length === 0 ? (
						<p className="text-sm text-muted-foreground">No section data available yet.</p>
					) : null}
					{sectionRows.map(section => (
						<div key={section.section_key} className="rounded-field border border-border p-3">
							<p className="font-medium text-foreground">
								{sectionTitleByKey[section.section_key] ?? section.section_key}
							</p>
							<p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
								{section.section_key}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">{section.note ?? "No note captured."}</p>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

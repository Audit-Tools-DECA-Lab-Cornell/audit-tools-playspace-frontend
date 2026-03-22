"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { BASE_PLAYSPACE_INSTRUMENT } from "@/lib/instrument";
import { BackButton } from "@/components/dashboard/back-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatAuditCodeReference, formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sectionTitleByKey = Object.fromEntries(
	BASE_PLAYSPACE_INSTRUMENT.sections.map(section => [section.section_key, section.title])
);
const preAuditQuestionByKey = Object.fromEntries(
	BASE_PLAYSPACE_INSTRUMENT.pre_audit_questions.map(question => [question.key, question])
);
const executionModeSummaryByKey = {
	both: "Onsite audit and survey",
	survey: "Survey only",
	audit: "Onsite audit only"
} as const;

/**
 * Fall back to a readable label when no instrument option exists.
 */
function humanizeToken(value: string): string {
	return value
		.replaceAll("_", " ")
		.replaceAll("-", " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, character => character.toUpperCase());
}

/**
 * Resolve a stored option key into its display label from the instrument definition.
 */
function formatPreAuditValue(questionKey: string, value: string | null): string {
	if (!value) {
		return "Not provided";
	}

	const question = preAuditQuestionByKey[questionKey];
	const matchingOption = question?.options.find(option => option.key === value);
	return matchingOption?.label ?? humanizeToken(value);
}

/**
 * Resolve a stored multi-select answer array into readable labels.
 */
function formatPreAuditValueList(questionKey: string, values: string[]): string {
	if (values.length === 0) {
		return "Not provided";
	}

	return values.map(value => formatPreAuditValue(questionKey, value)).join(", ");
}

export default function AuditorReportDetailPage() {
	const params = useParams<{ auditId: string }>();
	const auditId = params.auditId;

	const auditQuery = useQuery({
		queryKey: ["playspace", "auditor", "audit", auditId],
		queryFn: () => playspaceApi.auditor.getAudit(auditId),
		enabled: typeof auditId === "string" && auditId.length > 0
	});
	const audit = auditQuery.data ?? null;
	const sectionRows = React.useMemo(() => {
		return audit ? Object.values(audit.sections) : [];
	}, [audit]);
	const canResumeAudit = audit ? audit.status !== "SUBMITTED" : false;
	const notedSectionCount = sectionRows.filter(section => {
		return typeof section.note === "string" && section.note.trim().length > 0;
	}).length;
	const emptySectionCount = sectionRows.length - notedSectionCount;
	const [showEmptySections, setShowEmptySections] = React.useState(false);
	const [showSectionCodes, setShowSectionCodes] = React.useState(false);

	React.useEffect(() => {
		if (notedSectionCount === 0) {
			setShowEmptySections(true);
		}
	}, [notedSectionCount]);

	const orderedSectionRows = React.useMemo(() => {
		const sectionsWithNotes: typeof sectionRows = [];
		const sectionsWithoutNotes: typeof sectionRows = [];

		for (const section of sectionRows) {
			if (typeof section.note === "string" && section.note.trim().length > 0) {
				sectionsWithNotes.push(section);
				continue;
			}

			sectionsWithoutNotes.push(section);
		}

		return showEmptySections ? [...sectionsWithNotes, ...sectionsWithoutNotes] : sectionsWithNotes;
	}, [sectionRows, showEmptySections]);

	if (auditQuery.isLoading || !auditId) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (auditQuery.isError || !audit) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Unable to load audit detail</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Try refreshing the page or return to reports and re-open the audit.
					</p>
					<BackButton href="/auditor/reports" label="Back to reports" />
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Auditor Report Detail"
				title={audit.place_name}
				description={`Audit ${formatAuditCodeReference(audit.audit_code)} · ${humanizeToken(audit.status).toLowerCase()}`}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						{canResumeAudit ? (
							<Button asChild variant="outline">
								<Link href={`/auditor/execute/${encodeURIComponent(audit.place_id)}`}>
									Resume audit
								</Link>
							</Button>
						) : null}
						<BackButton href="/auditor/reports" label="Back to reports" />
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
						<p>
							Execution mode:{" "}
							{audit.meta.execution_mode
								? executionModeSummaryByKey[audit.meta.execution_mode]
								: "Not selected"}
						</p>
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
					<p>Season: {formatPreAuditValue("season", audit.pre_audit.season)}</p>
					<p>User count: {formatPreAuditValue("user_count", audit.pre_audit.user_count)}</p>
					<p>Place size: {formatPreAuditValue("place_size", audit.pre_audit.place_size)}</p>
					<p>Weather: {formatPreAuditValueList("weather_conditions", audit.pre_audit.weather_conditions)}</p>
					<p>Users present: {formatPreAuditValueList("users_present", audit.pre_audit.users_present)}</p>
					<p>Age groups: {formatPreAuditValueList("age_groups", audit.pre_audit.age_groups)}</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Section notes</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{sectionRows.length === 0 ? (
						<p className="text-sm text-muted-foreground">No section data available yet.</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted-foreground">
									{notedSectionCount} of {sectionRows.length} sections include notes.
								</p>
								<div className="flex flex-wrap items-center gap-2">
									{emptySectionCount > 0 ? (
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => {
												setShowEmptySections(currentValue => !currentValue);
											}}>
											{showEmptySections
												? `Hide empty sections (${emptySectionCount})`
												: `Show empty sections (${emptySectionCount})`}
										</Button>
									) : null}
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => {
											setShowSectionCodes(currentValue => !currentValue);
										}}>
										{showSectionCodes ? "Hide section codes" : "Show section codes"}
									</Button>
								</div>
							</div>
							{orderedSectionRows.length === 0 ? (
								<div className="rounded-card border border-dashed border-border p-4">
									<p className="font-medium text-foreground">No captured notes yet</p>
									<p className="mt-2 text-sm text-muted-foreground">
										Empty sections are currently hidden. Show them if you want to review the full
										instrument structure.
									</p>
								</div>
							) : (
								<div className="grid gap-3 md:grid-cols-2">
									{orderedSectionRows.map(section => {
										const hasNote =
											typeof section.note === "string" && section.note.trim().length > 0;

										return (
											<div
												key={section.section_key}
												className="rounded-card border border-border/70 bg-card/60 p-4">
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div className="space-y-1">
														<p className="font-medium text-foreground">
															{sectionTitleByKey[section.section_key] ??
																section.section_key}
														</p>
														{showSectionCodes ? (
															<code className="inline-flex rounded-md bg-muted/65 px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground/80">
																{section.section_key}
															</code>
														) : null}
													</div>
													<Badge
														variant={hasNote ? "secondary" : "outline"}
														className="font-medium">
														{hasNote ? "Captured note" : "Empty"}
													</Badge>
												</div>
												<p className="mt-3 text-sm text-muted-foreground">
													{hasNote ? section.note : "No note captured."}
												</p>
											</div>
										);
									})}
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

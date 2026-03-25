"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { useLocalizedInstrument } from "@/lib/instrument-translations";
import { BackButton } from "@/components/dashboard/back-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatAuditCodeReference, formatDateTimeLabel, formatScoreLabel } from "@/components/dashboard/utils";
import type { PreAuditQuestion } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
/**
 * Fall back to a readable label when no instrument option exists.
 */
function humanizeToken(value: string): string {
	return value
		.replaceAll("_", " ")
		.replaceAll("-", " ")
		.replaceAll(/\s+/g, " ")
		.trim()
		.replaceAll(/\b\w/g, character => character.toUpperCase());
}

/**
 * Resolve a stored option key into its display label from the instrument definition.
 */
function formatPreAuditValue(
	preAuditQuestionByKey: Readonly<Record<string, PreAuditQuestion>>,
	questionKey: string,
	value: string | null,
	notProvidedLabel: string
): string {
	if (!value) {
		return notProvidedLabel;
	}

	const question = preAuditQuestionByKey[questionKey];
	const matchingOption = question?.options.find(option => option.key === value);
	return matchingOption?.label ?? humanizeToken(value);
}

/**
 * Resolve a stored multi-select answer array into readable labels.
 */
function formatPreAuditValueList(
	preAuditQuestionByKey: Readonly<Record<string, PreAuditQuestion>>,
	questionKey: string,
	values: string[],
	notProvidedLabel: string
): string {
	if (values.length === 0) {
		return notProvidedLabel;
	}

	return values
		.map(value => formatPreAuditValue(preAuditQuestionByKey, questionKey, value, notProvidedLabel))
		.join(", ");
}

export default function AuditorReportDetailPage() {
	const t = useTranslations("auditor.reportDetail");
	const formatT = useTranslations("common.format");
	const params = useParams<{ auditId: string }>();
	const auditId = params.auditId;

	const auditQuery = useQuery({
		queryKey: ["playspace", "auditor", "audit", auditId],
		queryFn: () => playspaceApi.auditor.getAudit(auditId),
		enabled: typeof auditId === "string" && auditId.length > 0
	});
	const audit = auditQuery.data ?? null;
	const instrument = useLocalizedInstrument(audit?.instrument ?? null);
	const sectionTitleByKey = React.useMemo(() => {
		return Object.fromEntries(instrument.sections.map(section => [section.section_key, section.title])) as Readonly<
			Record<string, string>
		>;
	}, [instrument]);
	const preAuditQuestionByKey = React.useMemo(() => {
		return Object.fromEntries(instrument.pre_audit_questions.map(question => [question.key, question])) as Readonly<
			Record<string, PreAuditQuestion>
		>;
	}, [instrument]);
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
					<CardTitle>{t("error.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("error.description")}</p>
					<BackButton href="/auditor/reports" label={t("actions.backToReports")} />
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={audit.place_name}
				description={t("header.description", {
					auditCode: formatAuditCodeReference(audit.audit_code),
					status: t(`status.${audit.status.toLowerCase()}`)
				})}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						{canResumeAudit ? (
							<Button asChild>
								<Link
									href={`/auditor/execute/${encodeURIComponent(audit.place_id)}?projectId=${encodeURIComponent(audit.project_id)}`}>
									{t("actions.resumeAudit")}
								</Link>
							</Button>
						) : null}
						<BackButton href="/auditor/reports" label={t("actions.backToReports")} />
					</div>
				}
			/>
			{canResumeAudit ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("inProgressCard.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">{t("inProgressCard.description")}</p>
						<Button asChild>
							<Link
								href={`/auditor/execute/${encodeURIComponent(audit.place_id)}?projectId=${encodeURIComponent(audit.project_id)}`}>
								{t("inProgressCard.continue")}
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : null}
			<div className="grid gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t("metadata.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>{`Project ${audit.project_name}`}</p>
						<p>{t("metadata.started", { value: formatDateTimeLabel(audit.started_at, formatT) })}</p>
						<p>{t("metadata.submitted", { value: formatDateTimeLabel(audit.submitted_at, formatT) })}</p>
						<p>
							{t("metadata.executionMode", {
								value: audit.meta.execution_mode
									? t(`executionMode.${audit.meta.execution_mode}`)
									: t("metadata.notSelected")
							})}
						</p>
						<p>
							{t("metadata.readyToSubmit", {
								value: audit.progress.ready_to_submit ? t("metadata.yes") : t("metadata.no")
							})}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>{t("scores.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							{t("scores.summary", {
								value: formatScoreLabel(
									audit.scores.overall
										? audit.scores.overall.play_value_total + audit.scores.overall.usability_total
										: null,
									formatT
								)
							})}
						</p>
						<p>
							{t("scores.playValue", {
								value: audit.scores.overall
									? String(audit.scores.overall.play_value_total)
									: formatT("pending")
							})}
						</p>
						<p>
							{t("scores.usability", {
								value: audit.scores.overall
									? String(audit.scores.overall.usability_total)
									: formatT("pending")
							})}
						</p>
						<p>
							{t("scores.sociability", {
								value: audit.scores.overall
									? String(audit.scores.overall.sociability_total)
									: formatT("pending")
							})}
						</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{t("preAudit.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
					<p>
						{t("preAudit.season", {
							value: formatPreAuditValue(
								preAuditQuestionByKey,
								"season",
								audit.pre_audit.season,
								t("preAudit.notProvided")
							)
						})}
					</p>
					<p>
						{t("preAudit.userCount", {
							value: formatPreAuditValue(
								preAuditQuestionByKey,
								"user_count",
								audit.pre_audit.user_count,
								t("preAudit.notProvided")
							)
						})}
					</p>
					<p>
						{t("preAudit.placeSize", {
							value: formatPreAuditValue(
								preAuditQuestionByKey,
								"place_size",
								audit.pre_audit.place_size,
								t("preAudit.notProvided")
							)
						})}
					</p>
					<p>
						{t("preAudit.weather", {
							value: formatPreAuditValueList(
								preAuditQuestionByKey,
								"weather_conditions",
								audit.pre_audit.weather_conditions,
								t("preAudit.notProvided")
							)
						})}
					</p>
					<p>
						{t("preAudit.usersPresent", {
							value: formatPreAuditValueList(
								preAuditQuestionByKey,
								"users_present",
								audit.pre_audit.users_present,
								t("preAudit.notProvided")
							)
						})}
					</p>
					<p>
						{t("preAudit.ageGroups", {
							value: formatPreAuditValueList(
								preAuditQuestionByKey,
								"age_groups",
								audit.pre_audit.age_groups,
								t("preAudit.notProvided")
							)
						})}
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>{t("sectionNotes.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{sectionRows.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("sectionNotes.empty")}</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted-foreground">
									{t("sectionNotes.summary", {
										notedCount: notedSectionCount,
										totalCount: sectionRows.length
									})}
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
												? t("sectionNotes.hideEmptySections", { count: emptySectionCount })
												: t("sectionNotes.showEmptySections", { count: emptySectionCount })}
										</Button>
									) : null}
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => {
											setShowSectionCodes(currentValue => !currentValue);
										}}>
										{showSectionCodes
											? t("sectionNotes.hideSectionCodes")
											: t("sectionNotes.showSectionCodes")}
									</Button>
								</div>
							</div>
							{orderedSectionRows.length === 0 ? (
								<div className="rounded-card border border-dashed border-border p-4">
									<p className="font-medium text-foreground">
										{t("sectionNotes.noCapturedNotesTitle")}
									</p>
									<p className="mt-2 text-sm text-muted-foreground">
										{t("sectionNotes.noCapturedNotesDescription")}
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
													{hasNote ? (
														<Badge variant="secondary" className="font-medium">
															{t("sectionNotes.capturedNote")}
														</Badge>
													) : null}
												</div>
												<p className="mt-3 text-sm text-muted-foreground">
													{hasNote ? (
														section.note
													) : (
														<>
															<span aria-hidden="true">-</span>
															<span className="sr-only">
																{t("sectionNotes.noNoteCaptured")}
															</span>
														</>
													)}
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

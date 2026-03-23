"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AuditDraftPatch, type AuditSession } from "@/lib/api/playspace";
import { useLocalizedInstrument } from "@/lib/instrument-translations";
import {
	buildNextQuestionAnswers,
	getInstrumentSectionLocalProgress,
	getPreAuditValues,
	getVisibleSections,
	isRequiredPreAuditComplete
} from "@/lib/audit/selectors";
import { BackButton } from "@/components/dashboard/back-button";
import { formatAuditCodeReference } from "@/components/dashboard/utils";
import type {
	AssignmentRole,
	ExecutionMode,
	InstrumentQuestion,
	InstrumentSection,
	PlayspaceInstrument,
	PreAuditQuestion
} from "@/types/audit";
import { AuditQuestionCard } from "@/components/audit/question-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AuditExecuteFormProps {
	placeId: string;
}

type ExecutionModeSelection = ExecutionMode | "";

interface SectionDraftState {
	readonly note: string;
	readonly responses: Record<string, Record<string, string>>;
}

interface SectionProgressRow {
	readonly section: InstrumentSection;
	readonly progress: {
		readonly visibleQuestionCount: number;
		readonly answeredQuestionCount: number;
		readonly isComplete: boolean;
	};
}

type ExecuteTranslator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Format a save timestamp for status messaging.
 */
function formatTime(date: Date): string {
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Convert a nullable string-or-array value into one nullable string.
 */
function readSingleValue(value: string | string[] | undefined): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Convert a nullable string-or-array value into a clean string array.
 */
function readMultiValue(value: string | string[] | undefined): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Clone nested section response maps from one audit session.
 */
function createSectionDrafts(
	auditSession: AuditSession,
	instrument: PlayspaceInstrument
): Record<string, SectionDraftState> {
	const drafts: Record<string, SectionDraftState> = {};

	for (const section of instrument.sections) {
		const storedSection = auditSession.sections[section.section_key];
		const responses = Object.fromEntries(
			Object.entries(storedSection?.responses ?? {}).map(([questionKey, questionAnswers]) => [
				questionKey,
				{ ...questionAnswers }
			])
		);

		drafts[section.section_key] = {
			note: storedSection?.note ?? "",
			responses
		};
	}

	return drafts;
}

/**
 * Format assignment roles with localized labels.
 */
function formatAssignmentRoleLabel(role: AssignmentRole, t: ExecuteTranslator): string {
	return t(`roles.${role}`);
}

/**
 * Build one backend-compatible patch payload from local form state.
 */
function buildDraftPatchFromState(input: {
	selectedMode: ExecutionModeSelection;
	preAuditValues: Record<string, string | string[]>;
	sectionDrafts: Record<string, SectionDraftState>;
}): AuditDraftPatch {
	return {
		meta: input.selectedMode ? { execution_mode: input.selectedMode } : null,
		pre_audit: {
			season: readSingleValue(input.preAuditValues.season),
			weather_conditions: readMultiValue(input.preAuditValues.weather_conditions),
			users_present: readMultiValue(input.preAuditValues.users_present),
			user_count: readSingleValue(input.preAuditValues.user_count),
			age_groups: readMultiValue(input.preAuditValues.age_groups),
			place_size: readSingleValue(input.preAuditValues.place_size)
		},
		sections: Object.fromEntries(
			Object.entries(input.sectionDrafts).map(([sectionKey, draft]) => [
				sectionKey,
				{
					responses: draft.responses,
					note: draft.note.trim().length > 0 ? draft.note : null
				}
			])
		)
	};
}

/**
 * Build the smallest patch needed to move the last-saved draft state to the current local state.
 */
function buildIncrementalDraftPatch(previous: AuditDraftPatch, current: AuditDraftPatch): AuditDraftPatch {
	const changedSections = Object.fromEntries(
		Object.entries(current.sections).filter(([sectionKey, sectionPatch]) => {
			return JSON.stringify(sectionPatch) !== JSON.stringify(previous.sections[sectionKey]);
		})
	);
	const metaChanged = JSON.stringify(current.meta ?? null) !== JSON.stringify(previous.meta ?? null);
	const preAuditChanged = JSON.stringify(current.pre_audit ?? null) !== JSON.stringify(previous.pre_audit ?? null);

	return {
		meta: metaChanged ? (current.meta ?? null) : undefined,
		pre_audit: preAuditChanged ? (current.pre_audit ?? null) : undefined,
		sections: changedSections
	};
}

/**
 * Check whether an incremental draft patch contains any actual work for the backend.
 */
function isEmptyIncrementalPatch(patch: AuditDraftPatch): boolean {
	return patch.meta === undefined && patch.pre_audit === undefined && Object.keys(patch.sections).length === 0;
}

/**
 * Format audit timestamps and computed auto fields for display.
 */
function formatAutoValue(questionKey: string, auditSession: AuditSession, t: ExecuteTranslator): string {
	const startedAt = new Date(auditSession.started_at);
	const submittedAt = auditSession.submitted_at ? new Date(auditSession.submitted_at) : null;

	if (questionKey === "audit_date") {
		return startedAt.toLocaleDateString();
	}

	if (questionKey === "started_at") {
		return startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	if (questionKey === "submitted_at") {
		return submittedAt
			? submittedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
			: t("preAudit.auto.generatedOnSubmit");
	}

	if (questionKey === "total_minutes") {
		return auditSession.total_minutes === null
			? t("preAudit.auto.calculatedOnSubmit")
			: t("preAudit.auto.minutes", { count: auditSession.total_minutes });
	}

	return "";
}

/**
 * Pick the first incomplete section, or the first visible section when all are complete.
 */
function getInitialActiveSectionKey(sectionRows: readonly SectionProgressRow[]): string | null {
	const firstIncomplete = sectionRows.find(sectionRow => !sectionRow.progress.isComplete);
	return firstIncomplete?.section.section_key ?? sectionRows[0]?.section.section_key ?? null;
}

export function AuditExecuteForm({ placeId }: Readonly<AuditExecuteFormProps>) {
	const t = useTranslations("auditor.execute");
	const instrument = useLocalizedInstrument();
	const [selectedMode, setSelectedMode] = React.useState<ExecutionModeSelection>("");
	const [activeSectionKey, setActiveSectionKey] = React.useState<string | null>(null);
	const [session, setSession] = React.useState<AuditSession | null>(null);
	const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
	const [saveError, setSaveError] = React.useState<string | null>(null);
	const [preAuditValues, setPreAuditValues] = React.useState<Record<string, string | string[]>>({});
	const [sectionDrafts, setSectionDrafts] = React.useState<Record<string, SectionDraftState>>({});
	const initializedAuditIdRef = React.useRef<string | null>(null);
	const lastQueuedJsonRef = React.useRef<string | null>(null);
	const lastSavedJsonRef = React.useRef<string | null>(null);
	const lastSavedPatchRef = React.useRef<AuditDraftPatch | null>(null);

	const createOrResumeQuery = useQuery({
		queryKey: ["playspace", "auditor", "execute", placeId],
		queryFn: () => playspaceApi.auditor.createOrResumeAudit(placeId)
	});

	React.useEffect(() => {
		if (!createOrResumeQuery.data) {
			return;
		}

		const incomingSession = createOrResumeQuery.data;
		if (initializedAuditIdRef.current === incomingSession.audit_id) {
			return;
		}

		const nextSelectedMode: ExecutionModeSelection =
			incomingSession.selected_execution_mode ??
			incomingSession.meta.execution_mode ??
			(incomingSession.allowed_execution_modes.length === 1 ? incomingSession.allowed_execution_modes[0] : "");
		const nextPreAuditValues = getPreAuditValues(incomingSession);
		const nextSectionDrafts = createSectionDrafts(incomingSession, instrument);

		initializedAuditIdRef.current = incomingSession.audit_id;
		const initialPatch = buildDraftPatchFromState({
			selectedMode: nextSelectedMode,
			preAuditValues: nextPreAuditValues,
			sectionDrafts: nextSectionDrafts
		});
		const initialPatchJson = JSON.stringify(initialPatch);
		lastQueuedJsonRef.current = initialPatchJson;
		lastSavedJsonRef.current = initialPatchJson;
		lastSavedPatchRef.current = initialPatch;
		setSession(incomingSession);
		setSelectedMode(nextSelectedMode);
		setPreAuditValues(nextPreAuditValues);
		setSectionDrafts(nextSectionDrafts);
		setSaveError(null);
	}, [createOrResumeQuery.data, instrument]);

	const patchDraft = useMutation({
		mutationFn: async (input: { auditId: string; patch: AuditDraftPatch; fullPatch: AuditDraftPatch }) =>
			playspaceApi.auditor.patchAuditDraft(input.auditId, input.patch),
		onSuccess: (saveResult, variables) => {
			const syncedPatchJson = JSON.stringify(variables.fullPatch);
			lastQueuedJsonRef.current = syncedPatchJson;
			lastSavedJsonRef.current = syncedPatchJson;
			lastSavedPatchRef.current = variables.fullPatch;
			setLastSavedAt(new Date(saveResult.saved_at));
			setSaveError(null);
		},
		onError: error => {
			lastQueuedJsonRef.current = lastSavedJsonRef.current;
			setSaveError(error instanceof Error ? error.message : t("errors.autoSaveFailed"));
		}
	});

	const submitAudit = useMutation({
		mutationFn: async (auditId: string) => playspaceApi.auditor.submitAudit(auditId),
		onSuccess: updatedSession => {
			setSession(updatedSession);
			setLastSavedAt(new Date());
			setSaveError(null);
		},
		onError: error => {
			setSaveError(error instanceof Error ? error.message : t("errors.submitFailed"));
		}
	});

	const buildDraftPatch = React.useCallback((): AuditDraftPatch => {
		return buildDraftPatchFromState({
			selectedMode,
			preAuditValues,
			sectionDrafts
		});
	}, [preAuditValues, sectionDrafts, selectedMode]);

	React.useEffect(() => {
		if (!session || session.status === "SUBMITTED") {
			return;
		}

		const patch = buildDraftPatch();
		const serializedFullPatch = JSON.stringify(patch);
		if (serializedFullPatch === lastQueuedJsonRef.current) {
			return;
		}

		const lastSavedPatch = lastSavedPatchRef.current;
		if (!lastSavedPatch) {
			return;
		}

		const incrementalPatch = buildIncrementalDraftPatch(lastSavedPatch, patch);
		if (isEmptyIncrementalPatch(incrementalPatch)) {
			lastQueuedJsonRef.current = serializedFullPatch;
			return;
		}

		lastQueuedJsonRef.current = serializedFullPatch;
		setSaveError(null);

		const timeoutHandle = globalThis.setTimeout(() => {
			patchDraft.mutate({
				auditId: session.audit_id,
				patch: incrementalPatch,
				fullPatch: patch
			});
		}, 900);

		return () => {
			globalThis.clearTimeout(timeoutHandle);
		};
	}, [buildDraftPatch, patchDraft, session]);

	const executionMode = selectedMode === "" ? null : selectedMode;
	const visibleSections = React.useMemo(() => {
		return getVisibleSections(instrument, executionMode);
	}, [executionMode, instrument]);

	const sectionRows = React.useMemo<SectionProgressRow[]>(() => {
		return visibleSections.map(section => ({
			section,
			progress: getInstrumentSectionLocalProgress(section, sectionDrafts[section.section_key]?.responses ?? {})
		}));
	}, [sectionDrafts, visibleSections]);
	const orderedSectionRows = React.useMemo<SectionProgressRow[]>(() => {
		const incompleteSections: SectionProgressRow[] = [];
		const completedSections: SectionProgressRow[] = [];

		for (const sectionRow of sectionRows) {
			if (sectionRow.progress.isComplete) {
				completedSections.push(sectionRow);
				continue;
			}

			incompleteSections.push(sectionRow);
		}

		return [...incompleteSections, ...completedSections];
	}, [sectionRows]);

	React.useEffect(() => {
		if (orderedSectionRows.length === 0) {
			setActiveSectionKey(null);
			return;
		}

		const currentSectionStillVisible = orderedSectionRows.some(
			sectionRow => sectionRow.section.section_key === activeSectionKey
		);
		if (currentSectionStillVisible) {
			return;
		}

		setActiveSectionKey(getInitialActiveSectionKey(orderedSectionRows));
	}, [activeSectionKey, orderedSectionRows]);

	const activeSectionIndex = orderedSectionRows.findIndex(
		sectionRow => sectionRow.section.section_key === activeSectionKey
	);
	const activeSection = activeSectionIndex >= 0 ? orderedSectionRows[activeSectionIndex] : null;
	const previousSection = activeSectionIndex > 0 ? orderedSectionRows[activeSectionIndex - 1] : null;
	const nextSection =
		activeSectionIndex >= 0 && activeSectionIndex < orderedSectionRows.length - 1
			? orderedSectionRows[activeSectionIndex + 1]
			: null;

	const requiredPreAuditComplete = isRequiredPreAuditComplete(instrument.pre_audit_questions, preAuditValues);
	const answeredVisibleQuestions = sectionRows.reduce((totalAnswered, sectionRow) => {
		return totalAnswered + sectionRow.progress.answeredQuestionCount;
	}, 0);
	const totalVisibleQuestions = sectionRows.reduce((totalQuestions, sectionRow) => {
		return totalQuestions + sectionRow.progress.visibleQuestionCount;
	}, 0);
	const readyToSubmit =
		executionMode !== null &&
		requiredPreAuditComplete &&
		sectionRows.every(sectionRow => sectionRow.progress.isComplete);
	const isReadOnly = session?.status === "SUBMITTED";
	const incompleteSectionCount = sectionRows.filter(sectionRow => !sectionRow.progress.isComplete).length;
	const submissionBlockers = [
		executionMode === null ? t("submission.blockers.chooseExecutionMode") : null,
		!requiredPreAuditComplete ? t("submission.blockers.completePreAudit") : null,
		incompleteSectionCount > 0
			? t("submission.blockers.finishRemainingSections", { count: incompleteSectionCount })
			: null
	].filter((value): value is string => value !== null);

	function handleSaveNow() {
		if (!session || isReadOnly) {
			return;
		}

		const fullPatch = buildDraftPatch();
		const lastSavedPatch = lastSavedPatchRef.current;
		if (!lastSavedPatch) {
			return;
		}

		const incrementalPatch = buildIncrementalDraftPatch(lastSavedPatch, fullPatch);
		if (isEmptyIncrementalPatch(incrementalPatch)) {
			return;
		}

		lastQueuedJsonRef.current = JSON.stringify(fullPatch);
		patchDraft.mutate({
			auditId: session.audit_id,
			patch: incrementalPatch,
			fullPatch
		});
	}

	function handlePreAuditSingleSelect(questionKey: string, optionKey: string) {
		if (isReadOnly) {
			return;
		}

		setPreAuditValues(currentValues => ({
			...currentValues,
			[questionKey]: optionKey
		}));
	}

	function handlePreAuditToggleSelect(questionKey: string, optionKey: string) {
		if (isReadOnly) {
			return;
		}

		setPreAuditValues(currentValues => {
			const currentValue = currentValues[questionKey];
			const currentItems = Array.isArray(currentValue) ? currentValue : [];
			const nextItems = currentItems.includes(optionKey)
				? currentItems.filter(value => value !== optionKey)
				: [...currentItems, optionKey];

			return {
				...currentValues,
				[questionKey]: nextItems
			};
		});
	}

	function handleQuestionAnswer(
		sectionKey: string,
		question: InstrumentQuestion,
		questionKey: string,
		scaleKey: string,
		optionKey: string
	) {
		if (isReadOnly) {
			return;
		}

		setSectionDrafts(currentDrafts => {
			const currentSectionDraft = currentDrafts[sectionKey] ?? { note: "", responses: {} };
			const currentAnswers = currentSectionDraft.responses[questionKey] ?? {};
			const nextAnswers = buildNextQuestionAnswers(currentAnswers, question, scaleKey, optionKey);

			return {
				...currentDrafts,
				[sectionKey]: {
					...currentSectionDraft,
					responses: {
						...currentSectionDraft.responses,
						[questionKey]: nextAnswers
					}
				}
			};
		});
	}

	function handleSectionNoteChange(sectionKey: string, nextNote: string) {
		if (isReadOnly) {
			return;
		}

		setSectionDrafts(currentDrafts => {
			const currentSectionDraft = currentDrafts[sectionKey] ?? { note: "", responses: {} };
			return {
				...currentDrafts,
				[sectionKey]: {
					...currentSectionDraft,
					note: nextNote
				}
			};
		});
	}

	if (createOrResumeQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (createOrResumeQuery.isError) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("error.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("error.description")}</p>
					<BackButton href="/auditor/places" label={t("actions.backToPlaces")} />
				</CardContent>
			</Card>
		);
	}

	if (!session) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">{t("header.title")}</h1>
					<p className="text-sm text-muted-foreground">{t("header.place", { name: session.place_name })}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline" className="font-medium">
						{t(`status.${session.status.toLowerCase()}`)}
					</Badge>
					<Badge variant="secondary">
						{t("header.questionsAnswered", {
							answered: answeredVisibleQuestions,
							total: totalVisibleQuestions
						})}
					</Badge>
					{patchDraft.isPending ? (
						<Badge variant="secondary">{t("header.saving")}</Badge>
					) : lastSavedAt ? (
						<Badge variant="secondary">{t("header.savedAt", { time: formatTime(lastSavedAt) })}</Badge>
					) : (
						<Badge variant="outline">{t("header.noUnsavedChanges")}</Badge>
					)}
					<BackButton href="/auditor/places" label={t("actions.backToPlaces")} />
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("overview.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 lg:grid-cols-2">
					<div className="space-y-2 text-sm text-muted-foreground">
						<p>
							{t("overview.auditCode")}{" "}
							<code
								title={session.audit_code}
								className="rounded-md bg-muted/65 px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground/80">
								{formatAuditCodeReference(session.audit_code)}
							</code>
						</p>
						<p className="tabular-nums">
							{t("overview.started", { value: new Date(session.started_at).toLocaleString() })}
						</p>
						<p>
							{t("overview.assignmentRoles")}{" "}
							{session.assignment_roles.map(role => formatAssignmentRoleLabel(role, t)).join(", ")}
						</p>
					</div>
					<div className="space-y-2 text-sm text-muted-foreground">
						<p>
							{t("overview.preAudit")}{" "}
							<span className={requiredPreAuditComplete ? "text-foreground" : "text-muted-foreground"}>
								{requiredPreAuditComplete ? t("common.complete") : t("common.incomplete")}
							</span>
						</p>
						<p>
							{t("overview.sections")}{" "}
							<span className={readyToSubmit ? "text-foreground" : "text-muted-foreground"}>
								{t("overview.sectionsComplete", {
									completed: sectionRows.filter(sectionRow => sectionRow.progress.isComplete).length,
									total: sectionRows.length
								})}
							</span>
						</p>
						<p>
							{t("overview.readyToSubmit")}{" "}
							<span className={readyToSubmit ? "text-foreground" : "text-muted-foreground"}>
								{readyToSubmit ? t("common.yes") : t("common.notYet")}
							</span>
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("submission.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						{readyToSubmit ? t("submission.readyDescription") : t("submission.incompleteDescription")}
					</p>
					{submissionBlockers.length > 0 ? (
						<ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
							{submissionBlockers.map(blocker => (
								<li key={blocker}>{blocker}</li>
							))}
						</ul>
					) : null}
					<Badge variant={readyToSubmit ? "secondary" : "outline"}>
						{readyToSubmit
							? t("submission.readyBadge")
							: t("submission.remainingBadge", { count: submissionBlockers.length })}
					</Badge>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("executionMode.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 lg:grid-cols-3">
					{instrument.execution_modes
						.filter(mode => session.allowed_execution_modes.includes(mode.key as ExecutionMode))
						.map(mode => {
							const isSelected = selectedMode === mode.key;

							return (
								<button
									key={mode.key}
									type="button"
									disabled={isReadOnly}
									onClick={() => {
										setSelectedMode(mode.key as ExecutionMode);
									}}
									className={cn(
										"rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
										isSelected
											? "border-primary bg-primary/10"
											: "border-border bg-card hover:bg-secondary/50",
										isReadOnly && "cursor-not-allowed opacity-70"
									)}>
									<p className="text-xs font-semibold tracking-[0.08em] text-foreground/70">
										{mode.key}
									</p>
									<p className="mt-2 text-sm font-medium text-foreground">{mode.label}</p>
									<p className="mt-2 text-sm text-muted-foreground">
										{mode.description ?? t("executionMode.noDescription")}
									</p>
								</button>
							);
						})}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("preAudit.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 lg:grid-cols-2">
					{instrument.pre_audit_questions.map(question => {
						if (question.input_type === "auto_timestamp") {
							return (
								<AutoFieldCard
									key={question.key}
									question={question}
									value={formatAutoValue(question.key, session, t)}
								/>
							);
						}

						const questionValue = preAuditValues[question.key];
						return (
							<ChoiceFieldCard
								key={question.key}
								question={question}
								value={questionValue}
								disabled={isReadOnly}
								onSingleSelect={optionKey => {
									handlePreAuditSingleSelect(question.key, optionKey);
								}}
								onToggleSelect={optionKey => {
									handlePreAuditToggleSelect(question.key, optionKey);
								}}
							/>
						);
					})}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("sections.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{executionMode === null ? (
						<p className="text-sm text-muted-foreground">{t("sections.chooseMode")}</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted-foreground">
									{incompleteSectionCount > 0
										? t("sections.incompleteSummary", { count: incompleteSectionCount })
										: t("sections.completeSummary")}
								</p>
								<Badge variant={readyToSubmit ? "secondary" : "outline"}>
									{readyToSubmit
										? t("submission.readyBadge")
										: t("sections.remainingBadge", { count: incompleteSectionCount })}
								</Badge>
							</div>
							<div className="grid gap-3 lg:grid-cols-2">
								{orderedSectionRows.map(sectionRow => {
									const remainingQuestionCount =
										sectionRow.progress.visibleQuestionCount -
										sectionRow.progress.answeredQuestionCount;
									const isActive = sectionRow.section.section_key === activeSectionKey;

									return (
										<button
											key={sectionRow.section.section_key}
											type="button"
											onClick={() => {
												setActiveSectionKey(sectionRow.section.section_key);
											}}
											className={cn(
												"rounded-card border p-4 text-left transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
												isActive
													? "border-primary bg-primary/10"
													: sectionRow.progress.isComplete
														? "border-border/70 bg-muted/35 opacity-90 hover:bg-muted/50"
														: "border-border bg-card hover:bg-secondary/50"
											)}>
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<p className="font-medium text-foreground">
														{sectionRow.section.title}
													</p>
													<p className="text-sm text-muted-foreground">
														{t("sections.answered", {
															answered: sectionRow.progress.answeredQuestionCount,
															total: sectionRow.progress.visibleQuestionCount
														})}
													</p>
													<p className="text-xs text-muted-foreground">
														{sectionRow.progress.isComplete
															? t("sections.allRequiredComplete")
															: t("sections.questionsRemaining", {
																	count: remainingQuestionCount
																})}
													</p>
												</div>
												<Badge
													variant={sectionRow.progress.isComplete ? "secondary" : "outline"}>
													{sectionRow.progress.isComplete ? (
														<span className="inline-flex items-center gap-1.5">
															<CheckCircle2Icon className="size-3.5" aria-hidden="true" />
															<span>{t("common.complete")}</span>
														</span>
													) : (
														t("sections.remainingShort", { count: remainingQuestionCount })
													)}
												</Badge>
											</div>
										</button>
									);
								})}
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{activeSection ? (
				<Card>
					<CardHeader>
						<CardTitle>{activeSection.section.title}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							{activeSection.section.description ?? activeSection.section.instruction}
						</p>

						<div className="space-y-4">
							{activeSection.section.questions.map(question => (
								<AuditQuestionCard
									key={question.question_key}
									question={question}
									selectedAnswers={
										sectionDrafts[activeSection.section.section_key]?.responses[
											question.question_key
										] ?? {}
									}
									disabled={isReadOnly}
									onSelectAnswer={(questionKey, scaleKey, optionKey) => {
										handleQuestionAnswer(
											activeSection.section.section_key,
											question,
											questionKey,
											scaleKey,
											optionKey
										);
									}}
								/>
							))}
						</div>

						<div className="space-y-2">
							<Label htmlFor={`section-note-${activeSection.section.section_key}`}>
								{t("activeSection.notesLabel")}
							</Label>
							<p className="text-sm text-muted-foreground">
								{activeSection.section.notes_prompt ?? t("activeSection.notesFallback")}
							</p>
							<Textarea
								id={`section-note-${activeSection.section.section_key}`}
								rows={5}
								disabled={isReadOnly}
								value={sectionDrafts[activeSection.section.section_key]?.note ?? ""}
								onChange={event => {
									handleSectionNoteChange(activeSection.section.section_key, event.target.value);
								}}
								placeholder={t("activeSection.notesPlaceholder")}
							/>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									disabled={previousSection === null}
									onClick={() => {
										if (previousSection) {
											setActiveSectionKey(previousSection.section.section_key);
										}
									}}>
									{t("activeSection.previousSection")}
								</Button>
								<Button
									type="button"
									variant="outline"
									disabled={nextSection === null}
									onClick={() => {
										if (nextSection) {
											setActiveSectionKey(nextSection.section.section_key);
										}
									}}>
									{t("activeSection.nextSection")}
								</Button>
							</div>
							<Badge variant={activeSection.progress.isComplete ? "secondary" : "outline"}>
								{t("sections.answered", {
									answered: activeSection.progress.answeredQuestionCount,
									total: activeSection.progress.visibleQuestionCount
								})}
							</Badge>
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="flex flex-wrap items-center justify-end gap-2">
				{saveError ? <Badge variant="destructive">{saveError}</Badge> : null}
				<Button
					type="button"
					variant="outline"
					onClick={handleSaveNow}
					disabled={patchDraft.isPending || isReadOnly}>
					{t("actions.saveNow")}
				</Button>
				<Button
					type="button"
					disabled={!readyToSubmit || submitAudit.isPending || isReadOnly}
					onClick={() => {
						submitAudit.mutate(session.audit_id);
					}}>
					{submitAudit.isPending ? t("actions.submitting") : t("actions.submitAudit")}
				</Button>
			</div>

			{isReadOnly ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("submittedCard.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">{t("submittedCard.description")}</p>
						<Button asChild variant="outline">
							<Link href={`/auditor/reports/${encodeURIComponent(session.audit_id)}`}>
								{t("submittedCard.openReport")}
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

interface FieldCardProps {
	readonly title: string;
	readonly description: string | null | undefined;
	readonly children: React.ReactNode;
}

/**
 * Shared framed field shell used by pre-audit cards.
 */
function FieldCard({ title, description, children }: Readonly<FieldCardProps>) {
	return (
		<div className="field-card">
			<div className="field-card-body">
				<div className="space-y-1">
					<h3 className="field-card-title">{title}</h3>
					{description ? <p className="field-card-meta">{description}</p> : null}
				</div>
				{children}
			</div>
		</div>
	);
}

interface AutoFieldCardProps {
	readonly question: PreAuditQuestion;
	readonly value: string;
}

/**
 * Render one read-only pre-audit auto field.
 */
function AutoFieldCard({ question, value }: Readonly<AutoFieldCardProps>) {
	return (
		<FieldCard title={question.label} description={question.description}>
			<p className="text-sm font-semibold text-foreground">{value}</p>
		</FieldCard>
	);
}

interface ChoiceFieldCardProps {
	readonly question: PreAuditQuestion;
	readonly value: string | string[] | undefined;
	readonly disabled: boolean;
	readonly onSingleSelect: (optionKey: string) => void;
	readonly onToggleSelect: (optionKey: string) => void;
}

/**
 * Render one selectable pre-audit field using instrument-defined options.
 */
function ChoiceFieldCard({
	question,
	value,
	disabled,
	onSingleSelect,
	onToggleSelect
}: Readonly<ChoiceFieldCardProps>) {
	const selectedValues = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

	return (
		<FieldCard title={question.label} description={question.description}>
			<div className="grid gap-2 sm:grid-cols-2">
				{question.options.map(option => {
					const isSelected = selectedValues.includes(option.key);

					return (
						<Button
							key={`${question.key}.${option.key}`}
							type="button"
							variant="outline"
							disabled={disabled}
							className={cn(
								"h-auto min-h-12 justify-center whitespace-normal px-4 py-3 text-center",
								isSelected
									? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
									: "bg-background text-foreground hover:bg-secondary"
							)}
							onClick={() => {
								if (question.input_type === "single_select") {
									onSingleSelect(option.key);
									return;
								}

								onToggleSelect(option.key);
							}}>
							{option.label}
						</Button>
					);
				})}
			</div>
		</FieldCard>
	);
}

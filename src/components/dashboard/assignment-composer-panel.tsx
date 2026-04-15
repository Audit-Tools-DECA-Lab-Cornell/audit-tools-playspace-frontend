"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { AuditorSummary, PlaceSummary, ProjectSummary } from "@/lib/api/playspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";

export type AssignmentScope = "project" | "place";

export interface AssignmentFieldErrors {
	auditorId?: string;
	projectId?: string;
	placeId?: string;
}

export type AssignmentSummaryState = "loading" | "error" | "ready";

export interface AssignmentComposerPanelProps {
	readonly assignmentsCount: number;
	readonly assignmentsSummaryState: AssignmentSummaryState;
	readonly fieldErrors: AssignmentFieldErrors;
	readonly formError: string | null;
	readonly isPending: boolean;
	readonly places: readonly PlaceSummary[];
	readonly projects: readonly ProjectSummary[];
	readonly scope: AssignmentScope;
	readonly scopeTriggerRef: React.RefObject<HTMLButtonElement | null>;
	readonly selectedAuditor: AuditorSummary;
	readonly selectedPlaceId: string;
	readonly selectedProjectId: string;
	readonly successMessage: string | null;
	readonly onPlaceChange: (nextValue: string) => void;
	readonly onProjectChange: (nextValue: string) => void;
	readonly onReset: () => void;
	readonly onScopeChange: (nextValue: AssignmentScope) => void;
	readonly onSubmit: () => void;
}

/**
 * Render the inline assignment composer that appears once an auditor is selected.
 */
export function AssignmentComposerPanel({
	assignmentsCount,
	assignmentsSummaryState,
	fieldErrors,
	formError,
	isPending,
	places,
	projects,
	scope,
	scopeTriggerRef,
	selectedAuditor,
	selectedPlaceId,
	selectedProjectId,
	successMessage,
	onPlaceChange,
	onProjectChange,
	onReset,
	onScopeChange,
	onSubmit
}: Readonly<AssignmentComposerPanelProps>) {
	const t = useTranslations("manager.assignments");
	const loadedAssignmentsLabel = React.useMemo(() => {
		if (assignmentsSummaryState === "loading") {
			return t("auditorSummary.loadingAssignments");
		}

		if (assignmentsSummaryState === "error") {
			return t("auditorSummary.assignmentsUnavailable");
		}

		return t("auditorSummary.loadedAssignments", { count: assignmentsCount });
	}, [assignmentsCount, assignmentsSummaryState, t]);

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div className="space-y-1">
					<p className="font-medium text-foreground">{t("composer.title")}</p>
					<p className="text-sm text-muted-foreground">{t("composer.description")}</p>
				</div>
				<div className="rounded-field border border-border/70 bg-muted/35 p-4">
					<div className="space-y-1">
						<p className="font-medium text-foreground">{selectedAuditor.full_name}</p>
						<code className="inline-flex rounded-md bg-background/80 px-2 py-1 font-mono text-[13px] tracking-[0.04em] text-foreground/80">
							{selectedAuditor.auditor_code}
						</code>
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						{selectedAuditor.role ? (
							<Badge variant="secondary" style={{ textTransform: "capitalize" }}>
								{selectedAuditor.role}
							</Badge>
						) : null}
						<Badge variant="outline">{loadedAssignmentsLabel}</Badge>
						<Badge variant="outline">
							{t("auditorSummary.completedAudits", { count: selectedAuditor.completed_audits })}
						</Badge>
					</div>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2">
					<Label htmlFor="inline_scope_select">{t("sheet.scopeLabel")}</Label>
					<Select
						value={scope}
						onValueChange={nextValue => {
							onScopeChange(nextValue as AssignmentScope);
						}}>
						<SelectTrigger
							id="inline_scope_select"
							ref={scopeTriggerRef}
							aria-label={t("sheet.scopeLabel")}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent position="popper">
							<SelectGroup>
								<SelectLabel>{t("sheet.assignmentScope")}</SelectLabel>
								<SelectItem value="project">{t("sheet.project")}</SelectItem>
								<SelectItem value="place">{t("sheet.place")}</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<p className="text-sm text-muted-foreground">
						{scope === "project" ? t("sheet.projectScopeDescription") : t("sheet.placeScopeDescription")}
					</p>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="inline_project_select">{t("sheet.projectLabel")}</Label>
					<Select
						value={selectedProjectId.trim().length > 0 ? selectedProjectId : undefined}
						onValueChange={onProjectChange}>
						<SelectTrigger
							id="inline_project_select"
							aria-label={t("sheet.projectLabel")}
							aria-invalid={Boolean(fieldErrors.projectId)}>
							<SelectValue placeholder={t("sheet.selectProject")} />
						</SelectTrigger>
						<SelectContent position="popper">
							<SelectGroup>
								<SelectLabel>{t("sheet.projects")}</SelectLabel>
								{projects.map(project => (
									<SelectItem key={project.id} value={project.id}>
										{project.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					{fieldErrors.projectId ? (
						<p className="text-sm text-destructive">{fieldErrors.projectId}</p>
					) : (
						<p className="text-sm text-muted-foreground">{t("sheet.projectHelp")}</p>
					)}
				</div>

				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="inline_place_select">{t("sheet.placeLabel")}</Label>
					<Select
						value={selectedPlaceId.trim().length > 0 ? selectedPlaceId : undefined}
						onValueChange={onPlaceChange}
						disabled={scope !== "place" || selectedProjectId.trim().length === 0}>
						<SelectTrigger
							id="inline_place_select"
							aria-label={t("sheet.placeLabel")}
							aria-invalid={Boolean(fieldErrors.placeId)}>
							<SelectValue placeholder={t("sheet.selectPlace")} />
						</SelectTrigger>
						<SelectContent position="popper">
							<SelectGroup>
								<SelectLabel>
									{selectedProjectId.trim().length === 0
										? t("sheet.selectProjectFirst")
										: t("sheet.places")}
								</SelectLabel>
								{places.map(place => (
									<SelectItem key={place.id} value={place.id}>
										{place.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					{fieldErrors.placeId ? (
						<p className="text-sm text-destructive">{fieldErrors.placeId}</p>
					) : (
						<p className="text-sm text-muted-foreground">
							{scope === "place"
								? selectedProjectId.trim().length === 0
									? t("sheet.selectProjectFirstHelp")
									: t("sheet.placeHelp")
								: t("sheet.placeOptionalHelp")}
						</p>
					)}
				</div>
			</div>

			{successMessage ? (
				<p aria-live="polite" className="text-sm text-muted-foreground">
					{successMessage}
				</p>
			) : null}
			{formError ? (
				<p aria-live="polite" className="text-sm text-destructive">
					{formError}
				</p>
			) : null}

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={onReset} disabled={isPending}>
					{t("actions.reset")}
				</Button>
				<Button type="button" disabled={isPending} onClick={onSubmit}>
					{isPending ? t("actions.creating") : t("actions.createAssignment")}
				</Button>
			</div>
		</div>
	);
}

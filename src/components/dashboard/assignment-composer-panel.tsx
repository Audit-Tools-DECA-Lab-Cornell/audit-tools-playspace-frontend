"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { AuditorSummary, PlaceSummary, ProjectSummary } from "@/lib/api/playspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

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
	readonly scopeTriggerRef: React.RefObject<HTMLButtonElement | null>;
	readonly selectedAuditors: readonly AuditorSummary[];
	readonly selectedPlaceIds: readonly string[];
	readonly selectedProjectId: string;
	readonly successMessage: string | null;
	readonly onPlaceToggle: (nextValue: string) => void;
	readonly onPlaceToggleAll: (nextValue: boolean) => void;
	readonly onProjectChange: (nextValue: string) => void;
	readonly onReset: () => void;
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
	scopeTriggerRef,
	selectedAuditors,
	selectedPlaceIds,
	selectedProjectId,
	successMessage,
	onPlaceToggle,
	onPlaceToggleAll,
	onProjectChange,
	onReset,
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

		if (selectedAuditors.length > 1) {
			return t("auditorSummary.multipleSelected");
		}

		return t("auditorSummary.loadedAssignments", { count: assignmentsCount });
	}, [assignmentsCount, assignmentsSummaryState, selectedAuditors.length, t]);

	const allPlacesSelected = places.length > 0 && places.every(place => selectedPlaceIds.includes(place.id));
	const somePlacesSelected = places.some(place => selectedPlaceIds.includes(place.id)) && !allPlacesSelected;

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div className="space-y-1">
					<p className="font-medium text-foreground">{t("composer.title")}</p>
				<p className="text-sm text-muted-foreground">
					{selectedAuditors.length > 1 
						? t("composer.descriptionBulk", { count: selectedAuditors.length })
						: t("composer.description")}
				</p>
				</div>
				<div className="rounded-field border border-border/70 bg-muted/35 p-4">
					<div className="space-y-1">
						{selectedAuditors.length === 1 ? (
							<>
								<p className="font-medium text-foreground">{selectedAuditors[0].full_name}</p>
								<code className="inline-flex rounded-md bg-background/80 px-2 py-1 font-mono text-[13px] tracking-[0.04em] text-foreground/80">
									{selectedAuditors[0].auditor_code}
								</code>
							</>
						) : (
							<p className="font-medium text-foreground">
							{t("composer.auditorsSelectedCount", { count: selectedAuditors.length })}
						</p>
						)}
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						{selectedAuditors.length === 1 && selectedAuditors[0].role ? (
							<Badge variant="secondary" style={{ textTransform: "capitalize" }}>
								{selectedAuditors[0].role}
							</Badge>
						) : null}
						<Badge variant="outline">{loadedAssignmentsLabel}</Badge>
						{selectedAuditors.length === 1 ? (
							<Badge variant="outline">
								{t("auditorSummary.completedAudits", { count: selectedAuditors[0].completed_audits })}
							</Badge>
						) : null}
					</div>
				</div>
			</div>

			<div className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="inline_project_select">{t("sheet.projectLabel")}</Label>
					<Select
						value={selectedProjectId.trim().length > 0 ? selectedProjectId : undefined}
						onValueChange={onProjectChange}>
						<SelectTrigger
							id="inline_project_select"
							ref={scopeTriggerRef}
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

				<div className="grid gap-2">
					<div className="flex items-center justify-between gap-2">
						<Label>{t("sheet.placeLabel")}</Label>
						{places.length > 0 ? (
							<div className="flex items-center gap-2">
								<Checkbox
									id="select_all_places"
									checked={allPlacesSelected ? true : somePlacesSelected ? "indeterminate" : false}
									onCheckedChange={checked => {
										onPlaceToggleAll(checked === true);
									}}
									disabled={isPending || selectedProjectId.trim().length === 0}
								/>
								<Label
									htmlFor="select_all_places"
									className="text-xs font-medium cursor-pointer leading-none">
									{allPlacesSelected ? t("actions.deselectAll") : t("actions.selectAll")}
								</Label>
							</div>
						) : null}
					</div>
					
					<div className={cn(
						"max-h-64 overflow-y-auto rounded-field border border-border bg-card",
						selectedProjectId.trim().length === 0 && "opacity-50 grayscale pointer-events-none"
					)}>
						{selectedProjectId.trim().length === 0 ? (
							<p className="px-4 py-3 text-sm text-muted-foreground">{t("sheet.selectProjectFirst")}</p>
						) : places.length === 0 ? (
							<p className="px-4 py-3 text-sm text-muted-foreground">{t("sheet.noPlacesForProject")}</p>
						) : (
							<div className="grid divide-y divide-border/60">
								{places.map(place => {
									const isSelected = selectedPlaceIds.includes(place.id);
									return (
										<div
											key={place.id}
											className={cn(
												"flex items-center gap-3 px-4 py-2 text-left transition-colors",
												isSelected ? "bg-primary/5" : "hover:bg-muted/40"
											)}>
											<Checkbox
												id={`place_${place.id}`}
												checked={isSelected}
												onCheckedChange={() => {
													onPlaceToggle(place.id);
												}}
												disabled={isPending}
											/>
											<Label
												htmlFor={`place_${place.id}`}
												className="flex-1 cursor-pointer py-1">
												<p className="font-medium text-sm text-foreground">{place.name}</p>
												{place.city || place.place_type ? (
													<p className="text-xs text-muted-foreground">
														{[place.city, place.place_type].filter(Boolean).join(" · ")}
													</p>
												) : null}
											</Label>
										</div>
									);
								})}
							</div>
						)}
					</div>
					
					{fieldErrors.placeId ? (
						<p className="text-sm text-destructive">{fieldErrors.placeId}</p>
					) : (
						<p className="text-sm text-muted-foreground">
							{selectedProjectId.trim().length === 0
								? t("sheet.selectProjectFirstHelp")
								: t("sheet.placeHelp")}
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
				<Button 
					type="button" 
					disabled={isPending || selectedAuditors.length === 0 || selectedProjectId.trim().length === 0 || selectedPlaceIds.length === 0} 
					onClick={onSubmit}>
					{isPending ? t("actions.creating") : t("actions.createAssignment")}
				</Button>
			</div>
		</div>
	);
}

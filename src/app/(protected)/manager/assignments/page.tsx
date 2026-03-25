"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AuditorSummary } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AssignmentScope = "project" | "place";

interface AssignmentFieldErrors {
	auditorId?: string;
	projectId?: string;
	placeId?: string;
}

interface PendingAssignmentDelete {
	readonly id: string;
	readonly scopeLabel: string;
	readonly scopeName: string;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return fallbackMessage;
}

function filterAuditors(auditors: readonly AuditorSummary[], query: string): AuditorSummary[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (normalizedQuery.length === 0) {
		return [...auditors];
	}

	return auditors.filter(auditor => {
		const searchableText = [auditor.auditor_code, auditor.full_name, auditor.email ?? ""].join(" ").toLowerCase();
		return searchableText.includes(normalizedQuery);
	});
}

interface AuditorListPickerProps {
	readonly auditors: readonly AuditorSummary[];
	readonly selectedAuditorId: string;
	readonly searchQuery: string;
	readonly searchLabel: string;
	readonly searchPlaceholder: string;
	readonly searchResultsText: string;
	readonly pickerLabel: string;
	readonly emptyLabel: string;
	readonly helperText: string;
	readonly clearLabel: string;
	readonly onSearchQueryChange: (nextValue: string) => void;
	readonly onSelectAuditor: (nextValue: string) => void;
	readonly onClearSelection: () => void;
	readonly errorText?: string;
}

function AuditorListPicker({
	auditors,
	selectedAuditorId,
	searchQuery,
	searchLabel,
	searchPlaceholder,
	searchResultsText,
	pickerLabel,
	emptyLabel,
	helperText,
	clearLabel,
	onSearchQueryChange,
	onSelectAuditor,
	onClearSelection,
	errorText
}: Readonly<AuditorListPickerProps>) {
	return (
		<>
			<div className="grid gap-2">
				<Label htmlFor={`${pickerLabel}_search`}>{searchLabel}</Label>
				<Input
					id={`${pickerLabel}_search`}
					name={`${pickerLabel}Search`}
					autoComplete="off"
					spellCheck={false}
					value={searchQuery}
					onChange={event => {
						onSearchQueryChange(event.target.value);
					}}
					placeholder={searchPlaceholder}
				/>
				<p className="text-sm text-muted-foreground">{searchResultsText}</p>
			</div>
			<div className="grid gap-2">
				<Label>{pickerLabel}</Label>
				<div className="max-h-64 overflow-y-auto rounded-field border border-border bg-card">
					{auditors.length === 0 ? (
						<p className="px-4 py-3 text-sm text-muted-foreground">{emptyLabel}</p>
					) : (
						<div className="grid divide-y divide-border/60">
							{auditors.map(auditor => {
								const isSelected = auditor.id === selectedAuditorId;
								return (
									<button
										key={auditor.id}
										type="button"
										className={cn(
											"grid gap-1 px-4 py-3 text-left transition-colors",
											isSelected ? "bg-primary/10" : "hover:bg-muted/40"
										)}
										onClick={() => {
											onSelectAuditor(auditor.id);
										}}>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="outline" className="font-mono text-primary">
												{auditor.auditor_code}
											</Badge>
											{auditor.role ? (
												<Badge variant="secondary" style={{ textTransform: "capitalize" }}>
													{auditor.role}
												</Badge>
											) : null}
											{isSelected ? <Badge variant="outline">Selected</Badge> : null}
										</div>
										<p className="font-medium text-foreground">{auditor.full_name}</p>
										<p className="text-sm text-muted-foreground">
											{auditor.email ?? "Email pending"}
										</p>
									</button>
								);
							})}
						</div>
					)}
				</div>
				<div className="flex items-center justify-between gap-2">
					{errorText ? (
						<p className="text-sm text-destructive">{errorText}</p>
					) : (
						<p className="text-sm text-muted-foreground">{helperText}</p>
					)}
					{selectedAuditorId.trim().length > 0 ? (
						<Button type="button" variant="ghost" onClick={onClearSelection}>
							{clearLabel}
						</Button>
					) : null}
				</div>
			</div>
		</>
	);
}

export default function ManagerAssignmentsPage() {
	const t = useTranslations("manager.assignments");
	const formatT = useTranslations("common.format");
	const session = useAuthSession();
	const queryClient = useQueryClient();
	const accountId = session?.role === "manager" ? session.accountId : null;
	const [selectedAuditorId, setSelectedAuditorId] = React.useState("");
	const [scope, setScope] = React.useState<AssignmentScope>("project");
	const [selectedProjectId, setSelectedProjectId] = React.useState("");
	const [selectedPlaceId, setSelectedPlaceId] = React.useState("");
	const [auditorSearchQuery, setAuditorSearchQuery] = React.useState("");
	const [sheetAuditorSearchQuery, setSheetAuditorSearchQuery] = React.useState("");
	const [fieldErrors, setFieldErrors] = React.useState<AssignmentFieldErrors>({});
	const [formError, setFormError] = React.useState<string | null>(null);
	const [listError, setListError] = React.useState<string | null>(null);
	const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
	const [assignmentPendingDelete, setAssignmentPendingDelete] = React.useState<PendingAssignmentDelete | null>(null);

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "auditors", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});
	const projectsQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "projects", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error(t("errors.accountContextUnavailable"));
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});
	const projectPlacesQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "projectPlaces", selectedProjectId],
		queryFn: () => playspaceApi.projects.places(selectedProjectId),
		enabled: selectedProjectId.trim().length > 0
	});
	const assignmentsQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "rows", selectedAuditorId],
		queryFn: () => playspaceApi.assignments.list(selectedAuditorId),
		enabled: selectedAuditorId.trim().length > 0
	});

	const createAssignment = useMutation({
		mutationFn: async () => {
			if (selectedAuditorId.trim().length === 0) {
				throw new Error(t("errors.selectAuditorBeforeCreate"));
			}

			if (scope === "project") {
				return playspaceApi.assignments.create(selectedAuditorId, {
					project_id: selectedProjectId,
					place_id: null
				});
			}

			return playspaceApi.assignments.create(selectedAuditorId, {
				project_id: selectedProjectId,
				place_id: selectedPlaceId
			});
		},
		onSuccess: async () => {
			setFieldErrors({});
			setFormError(null);
			setListError(null);
			setScope("project");
			setSelectedProjectId("");
			setSelectedPlaceId("");
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "assignments", "rows", selectedAuditorId]
			});
			setIsCreateSheetOpen(false);
		},
		onError: error => {
			setFormError(error instanceof Error ? error.message : t("errors.unableToCreateAssignment"));
		}
	});

	const deleteAssignment = useMutation({
		mutationFn: async (assignmentId: string) => {
			if (selectedAuditorId.trim().length === 0) {
				throw new Error(t("errors.selectAuditorBeforeDelete"));
			}
			return playspaceApi.assignments.delete(selectedAuditorId, assignmentId);
		},
		onSuccess: async () => {
			setListError(null);
			setAssignmentPendingDelete(null);
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "assignments", "rows", selectedAuditorId]
			});
		},
		onError: error => {
			setListError(error instanceof Error ? error.message : t("errors.unableToDeleteAssignment"));
		}
	});

	const auditors = React.useMemo(() => auditorsQuery.data ?? [], [auditorsQuery.data]);
	const projects = projectsQuery.data ?? [];
	const places = projectPlacesQuery.data ?? [];
	const assignments = assignmentsQuery.data ?? [];
	const selectedAuditor = auditors.find(auditor => auditor.id === selectedAuditorId) ?? null;
	const filteredAuditors = React.useMemo(
		() => filterAuditors(auditors, auditorSearchQuery),
		[auditorSearchQuery, auditors]
	);
	const sheetFilteredAuditors = React.useMemo(
		() => filterAuditors(auditors, sheetAuditorSearchQuery),
		[auditors, sheetAuditorSearchQuery]
	);

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.description")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.assignments") }
					]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">{t("missingAccount")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (auditorsQuery.isLoading || projectsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow={t("header.eyebrow")}
					title={t("header.title")}
					description={t("header.description")}
					breadcrumbs={[
						{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
						{ label: t("breadcrumbs.assignments") }
					]}
				/>
				<div className="h-36 animate-pulse rounded-card border border-border bg-card" />
				<div className="h-64 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (auditorsQuery.isError || projectsQuery.isError) {
		const error = auditorsQuery.error ?? projectsQuery.error;

		return (
			<EmptyState
				title={t("error.title")}
				description={getErrorMessage(error, t("error.description"))}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.tryAgain")}
					</Button>
				}
			/>
		);
	}

	function clearFieldError(fieldName: keyof AssignmentFieldErrors) {
		setFieldErrors(currentValue => ({
			...currentValue,
			[fieldName]: undefined
		}));
	}

	function handleCreateAssignment() {
		const nextFieldErrors: AssignmentFieldErrors = {};
		if (selectedAuditorId.trim().length === 0) {
			nextFieldErrors.auditorId = t("validation.auditorRequired");
		}

		if (selectedProjectId.trim().length === 0) {
			nextFieldErrors.projectId =
				scope === "place" ? t("validation.projectRequiredForPlace") : t("validation.projectRequired");
		}

		if (scope === "place" && selectedPlaceId.trim().length === 0) {
			nextFieldErrors.placeId = t("validation.placeRequired");
		}

		setFieldErrors(nextFieldErrors);
		setFormError(null);

		if (Object.values(nextFieldErrors).some(value => typeof value === "string")) {
			return;
		}

		createAssignment.mutate();
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/manager/dashboard" },
					{ label: t("breadcrumbs.assignments") }
				]}
				actions={
					<Button
						type="button"
						className="gap-2"
						disabled={auditors.length === 0}
						onClick={() => {
							setIsCreateSheetOpen(true);
						}}>
						<PlusIcon className="size-4" />
						<span>{t("actions.newAssignment")}</span>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>{t("auditorFocus.title")}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
					<div className="space-y-4 rounded-field border border-border bg-card/80 p-4">
						<div className="space-y-1">
							<p className="font-medium text-foreground">{t("auditorFocus.chooseAuditorTitle")}</p>
							<p className="text-sm text-muted-foreground">
								{t("auditorFocus.chooseAuditorDescription")}
							</p>
						</div>
						<AuditorListPicker
							auditors={filteredAuditors}
							selectedAuditorId={selectedAuditorId}
							searchQuery={auditorSearchQuery}
							searchLabel={t("auditorFocus.searchLabel")}
							searchPlaceholder={t("auditorFocus.searchPlaceholder")}
							searchResultsText={t("auditorFocus.searchResults", { count: filteredAuditors.length })}
							pickerLabel={t("auditorFocus.auditorLabel")}
							emptyLabel={t("auditorFocus.noMatchingAuditors")}
							helperText={t("auditorFocus.auditorHelp")}
							clearLabel={t("actions.clear")}
							errorText={fieldErrors.auditorId}
							onSearchQueryChange={setAuditorSearchQuery}
							onSelectAuditor={nextValue => {
								setSelectedAuditorId(nextValue);
								clearFieldError("auditorId");
								setListError(null);
							}}
							onClearSelection={() => {
								setSelectedAuditorId("");
								clearFieldError("auditorId");
								setListError(null);
							}}
						/>
						<div className="rounded-field border border-border/70 bg-muted/35 p-4">
							<p className="font-medium text-foreground">{t("auditorFocus.reviewHowItWorksTitle")}</p>
							<ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
								<li>{t("auditorFocus.reviewSteps.step1")}</li>
								<li>{t("auditorFocus.reviewSteps.step2")}</li>
								<li>{t("auditorFocus.reviewSteps.step3")}</li>
							</ol>
						</div>
					</div>

					<div className="rounded-field border border-border bg-card p-4">
						{selectedAuditor ? (
							<div className="space-y-3">
								<div className="space-y-1">
									<p className="font-medium text-foreground">{selectedAuditor.full_name}</p>
									<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
										<code className="rounded-md bg-muted/65 px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-foreground/80">
											{selectedAuditor.auditor_code}
										</code>
										{selectedAuditor.email ? <span>{selectedAuditor.email}</span> : null}
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									{selectedAuditor.role ? (
										<Badge variant="secondary" style={{ textTransform: "capitalize" }}>
											{selectedAuditor.role}
										</Badge>
									) : null}
									<Badge variant="outline">
										{t("auditorSummary.loadedAssignments", { count: assignments.length })}
									</Badge>
									<Badge variant="outline">
										{t("auditorSummary.completedAudits", {
											count: selectedAuditor.completed_audits
										})}
									</Badge>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="space-y-1">
									<p className="font-medium text-foreground">{t("preview.title")}</p>
									<p className="text-sm text-muted-foreground">{t("preview.description")}</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-field border border-border/70 bg-muted/35 p-4">
										<p className="font-medium text-foreground">{t("preview.projectScopeTitle")}</p>
										<p className="mt-2 text-sm text-muted-foreground">
											{t("preview.projectScopeDescription")}
										</p>
									</div>
									<div className="rounded-field border border-border/70 bg-muted/35 p-4">
										<p className="font-medium text-foreground">{t("preview.placeScopeTitle")}</p>
										<p className="mt-2 text-sm text-muted-foreground">
											{t("preview.placeScopeDescription")}
										</p>
									</div>
								</div>
								<Button asChild variant="outline">
									<Link href="/manager/auditors">{t("preview.openAuditors")}</Link>
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("coverage.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{listError ? (
						<p aria-live="polite" className="text-sm text-destructive">
							{listError}
						</p>
					) : null}
					{selectedAuditorId.trim().length === 0 ? (
						<div className="grid gap-4 rounded-field border border-dashed border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
							<div className="space-y-2">
								<p className="font-medium text-foreground">{t("coverage.selectAuditorTitle")}</p>
								<p className="text-sm text-muted-foreground">
									{t("coverage.selectAuditorDescription")}
								</p>
							</div>
							<div className="rounded-field border border-border/70 bg-muted/35 p-4">
								<p className="font-medium text-foreground">{t("coverage.whatAppearsTitle")}</p>
								<ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
									<li>{t("coverage.whatAppears.projectAndPlaceCoverage")}</li>
									<li>Project and place scope summaries</li>
									<li>{t("coverage.whatAppears.openAndDeleteActions")}</li>
								</ul>
							</div>
						</div>
					) : assignmentsQuery.isLoading ? (
						<p className="text-sm text-muted-foreground">{t("coverage.loadingAssignments")}</p>
					) : assignmentsQuery.isError ? (
						<div className="rounded-field border border-dashed border-border p-4">
							<p className="font-medium text-foreground">{t("coverage.errorTitle")}</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{getErrorMessage(assignmentsQuery.error, t("coverage.errorDescription"))}
							</p>
						</div>
					) : assignments.length === 0 ? (
						<div className="grid gap-4 rounded-field border border-dashed border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
							<div className="space-y-2">
								<p className="font-medium text-foreground">{t("coverage.emptyTitle")}</p>
								<p className="text-sm text-muted-foreground">
									{selectedAuditor
										? t("coverage.emptyDescriptionWithAuditor", { name: selectedAuditor.full_name })
										: t("coverage.emptyDescription")}
								</p>
							</div>
							<div className="rounded-field border border-border/70 bg-muted/35 p-4">
								<p className="font-medium text-foreground">{t("coverage.recommendedNextStepTitle")}</p>
								<p className="mt-2 text-sm text-muted-foreground">
									{t("coverage.recommendedNextStepDescription")}
								</p>
							</div>
						</div>
					) : (
						assignments.map(assignment => {
							const scopeName = assignment.scope_name;
							const scopeLabel =
								assignment.scope_type === "place"
									? t("assignment.placeScope")
									: t("assignment.projectScope");
							const deleteScopeLabel =
								assignment.scope_type === "place" ? t("assignment.place") : t("assignment.project");
							const scopeHref =
								assignment.place_id !== null
									? `/manager/places/${encodeURIComponent(assignment.place_id)}?projectId=${encodeURIComponent(assignment.project_id)}`
									: assignment.project_id !== null
										? `/manager/projects/${encodeURIComponent(assignment.project_id)}`
										: null;

							return (
								<div
									key={assignment.id}
									className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">{scopeName}</p>
										<p className="text-xs text-muted-foreground">
											{assignment.scope_type === "place"
												? `${assignment.project_name} · ${scopeLabel}`
												: scopeLabel}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("assignment.assignedAt", {
												value: formatDateTimeLabel(assignment.assigned_at, formatT)
											})}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="outline" className="font-medium">
											{assignment.scope_type === "place"
												? "Project + place scope"
												: "Project scope"}
										</Badge>
										{scopeHref ? (
											<Button asChild type="button" variant="outline">
												<Link href={scopeHref}>
													{assignment.scope_type === "place"
														? t("assignment.openPlace")
														: t("assignment.openProject")}
												</Link>
											</Button>
										) : null}
										<Button
											type="button"
											variant="outline"
											disabled={deleteAssignment.isPending}
											onClick={() => {
												setAssignmentPendingDelete({
													id: assignment.id,
													scopeLabel: deleteScopeLabel,
													scopeName
												});
											}}>
											{t("actions.delete")}
										</Button>
									</div>
								</div>
							);
						})
					)}
				</CardContent>
			</Card>
			<Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
				<SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
					<SheetHeader className="border-b border-border/70 px-6 py-5">
						<SheetTitle>{t("sheet.title")}</SheetTitle>
						<SheetDescription>{t("sheet.description")}</SheetDescription>
					</SheetHeader>
					<div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
						<div className="md:col-span-2">
							<AuditorListPicker
								auditors={sheetFilteredAuditors}
								selectedAuditorId={selectedAuditorId}
								searchQuery={sheetAuditorSearchQuery}
								searchLabel={t("sheet.auditorLabel")}
								searchPlaceholder={t("sheet.selectAuditor")}
								searchResultsText={`${sheetFilteredAuditors.length} ${t("sheet.auditors")}`}
								pickerLabel={t("sheet.auditorLabel")}
								emptyLabel={t("auditorFocus.noMatchingAuditors")}
								helperText={t("sheet.auditorHelp")}
								clearLabel={t("actions.clear")}
								errorText={fieldErrors.auditorId}
								onSearchQueryChange={setSheetAuditorSearchQuery}
								onSelectAuditor={nextValue => {
									setSelectedAuditorId(nextValue);
									clearFieldError("auditorId");
									setFormError(null);
								}}
								onClearSelection={() => {
									setSelectedAuditorId("");
									clearFieldError("auditorId");
									setFormError(null);
								}}
							/>
						</div>
						<div className="grid gap-2">
							<Label>{t("sheet.scopeLabel")}</Label>
							<Select
								value={scope}
								onValueChange={nextValue => {
									setScope(nextValue as AssignmentScope);
									setSelectedPlaceId("");
									clearFieldError("projectId");
									clearFieldError("placeId");
									setFormError(null);
								}}>
								<SelectTrigger id="scope_select" aria-label={t("sheet.scopeLabel")}>
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
								{scope === "project"
									? t("sheet.projectScopeDescription")
									: t("sheet.placeScopeDescription")}
							</p>
						</div>
						<div className="grid gap-2">
							<Label>{t("sheet.projectLabel")}</Label>
							<Select
								value={selectedProjectId.trim().length > 0 ? selectedProjectId : undefined}
								onValueChange={nextValue => {
									setSelectedProjectId(nextValue);
									setSelectedPlaceId("");
									clearFieldError("projectId");
									clearFieldError("placeId");
									setFormError(null);
								}}>
								<SelectTrigger
									id="project_select"
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
							<Label>{t("sheet.placeLabel")}</Label>
							<Select
								value={selectedPlaceId.trim().length > 0 ? selectedPlaceId : undefined}
								onValueChange={nextValue => {
									setSelectedPlaceId(nextValue);
									clearFieldError("placeId");
									setFormError(null);
								}}
								disabled={scope !== "place" || selectedProjectId.trim().length === 0}>
								<SelectTrigger
									id="place_select"
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
						{formError ? (
							<p aria-live="polite" className="md:col-span-2 text-sm text-destructive">
								{formError}
							</p>
						) : null}
					</div>
					<SheetFooter className="border-t border-border/70 px-6 py-4">
						<div className="ml-auto flex flex-col-reverse gap-2 sm:flex-row">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateSheetOpen(false)}
								disabled={createAssignment.isPending}>
								{t("actions.cancel")}
							</Button>
							<Button
								type="button"
								disabled={createAssignment.isPending}
								onClick={handleCreateAssignment}>
								{createAssignment.isPending ? t("actions.creating") : t("actions.createAssignment")}
							</Button>
						</div>
					</SheetFooter>
				</SheetContent>
			</Sheet>
			<ConfirmDialog
				open={assignmentPendingDelete !== null}
				onOpenChange={open => {
					if (!open) {
						setAssignmentPendingDelete(null);
					}
				}}
				title={t("confirmDelete.title")}
				description={
					assignmentPendingDelete
						? t("confirmDelete.descriptionWithScope", {
							scopeLabel: assignmentPendingDelete.scopeLabel,
							scopeName: assignmentPendingDelete.scopeName
						})
						: t("confirmDelete.description")
				}
				confirmLabel={t("confirmDelete.confirmLabel")}
				isPending={deleteAssignment.isPending}
				onConfirm={() => {
					if (!assignmentPendingDelete) {
						return;
					}

					deleteAssignment.mutate(assignmentPendingDelete.id);
				}}
			/>
		</div>
	);
}

"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";

import { playspaceApi, type AuditorSummary } from "@/lib/api/playspace";
import {
	AssignmentComposerPanel,
	type AssignmentFieldErrors,
	type AssignmentScope,
	type AssignmentSummaryState
} from "@/components/dashboard/assignment-composer-panel";
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
import { cn } from "@/lib/utils";

interface PendingAssignmentDelete {
	readonly id: string;
	readonly scopeLabel: string;
	readonly scopeName: string;
}

const EMPTY_AUDITORS: readonly AuditorSummary[] = [];

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
	readonly disabled?: boolean;
	readonly emailPendingLabel: string;
	readonly selectedLabel: string;
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
	disabled = false,
	emailPendingLabel,
	selectedLabel,
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
											"grid gap-1 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
											isSelected ? "bg-primary/10" : "hover:bg-muted/40"
										)}
										disabled={disabled}
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
											{isSelected ? <Badge variant="outline">{selectedLabel}</Badge> : null}
										</div>
										<p className="font-medium text-foreground">{auditor.full_name}</p>
										<p className="text-sm text-muted-foreground">
											{auditor.email ?? emailPendingLabel}
										</p>
									</button>
								);
							})}
						</div>
					)}
				</div>
				<div className="flex items-center pt-2 px-2 justify-between gap-2">
					{errorText ? (
						<p className="text-sm text-destructive">{errorText}</p>
					) : (
						<p className="text-sm text-muted-foreground">{helperText}</p>
					)}
					{selectedAuditorId.trim().length > 0 ? (
						<Button type="button" variant="ghost" onClick={onClearSelection} disabled={disabled}>
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
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const accountId = session?.role === "manager" ? session.accountId : null;
	const [selectedAuditorId, setSelectedAuditorId] = React.useState("");
	const [scope, setScope] = React.useState<AssignmentScope>("project");
	const [selectedProjectId, setSelectedProjectId] = React.useState("");
	const [selectedPlaceId, setSelectedPlaceId] = React.useState("");
	const [auditorSearchQuery, setAuditorSearchQuery] = React.useState("");
	const [fieldErrors, setFieldErrors] = React.useState<AssignmentFieldErrors>({});
	const [formError, setFormError] = React.useState<string | null>(null);
	const [createSuccessMessage, setCreateSuccessMessage] = React.useState<string | null>(null);
	const [listError, setListError] = React.useState<string | null>(null);
	const [assignmentPendingDelete, setAssignmentPendingDelete] = React.useState<PendingAssignmentDelete | null>(null);
	const hasInitializedSelectionFromQueryRef = React.useRef(false);
	const scopeTriggerRef = React.useRef<HTMLButtonElement | null>(null);

	const clearFieldError = React.useCallback((fieldName: keyof AssignmentFieldErrors) => {
		setFieldErrors(currentValue => ({
			...currentValue,
			[fieldName]: undefined
		}));
	}, []);

	/**
	 * Reset the inline composer back to its default blank state.
	 */
	const resetComposer = React.useCallback(() => {
		setScope("project");
		setSelectedProjectId("");
		setSelectedPlaceId("");
		setFieldErrors({});
		setFormError(null);
		setCreateSuccessMessage(null);
	}, []);

	/**
	 * Keep the page URL synchronized with the currently selected auditor.
	 */
	const syncAuditorSelectionInUrl = React.useCallback(
		(nextAuditorId: string) => {
			const normalizedAuditorId = nextAuditorId.trim();
			const nextSearchParams = new URLSearchParams(searchParams.toString());

			if (normalizedAuditorId.length > 0) {
				nextSearchParams.set("auditorId", normalizedAuditorId);
			} else {
				nextSearchParams.delete("auditorId");
			}

			const nextQuery = nextSearchParams.toString();
			const nextHref = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
			router.replace(nextHref, { scroll: false });
		},
		[pathname, router, searchParams]
	);

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
		mutationFn: async (input: {
			readonly auditorId: string;
			readonly projectId: string;
			readonly placeId: string | null;
		}) => {
			return playspaceApi.assignments.create(input.auditorId, {
				project_id: input.projectId,
				place_id: input.placeId
			});
		},
		onSuccess: async (_data, variables) => {
			setListError(null);
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "assignments", "rows", variables.auditorId]
			});

			if (selectedAuditorId === variables.auditorId) {
				const createdAuditor = auditors.find(auditor => auditor.id === variables.auditorId) ?? null;
				resetComposer();
				setCreateSuccessMessage(
					createdAuditor
						? t("composer.createSuccessWithAuditor", { name: createdAuditor.full_name })
						: t("composer.createSuccess")
				);
				scopeTriggerRef.current?.focus();
			}
		},
		onError: error => {
			setCreateSuccessMessage(null);
			setFormError(error instanceof Error ? error.message : t("errors.unableToCreateAssignment"));
		}
	});

	const deleteAssignment = useMutation({
		mutationFn: async (input: { readonly assignmentId: string; readonly auditorId: string }) => {
			if (input.auditorId.trim().length === 0) {
				throw new Error(t("errors.selectAuditorBeforeDelete"));
			}
			return playspaceApi.assignments.delete(input.auditorId, input.assignmentId);
		},
		onSuccess: async (_data, variables) => {
			setListError(null);
			setAssignmentPendingDelete(null);
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "assignments", "rows", variables.auditorId]
			});
		},
		onError: error => {
			setListError(error instanceof Error ? error.message : t("errors.unableToDeleteAssignment"));
		}
	});

	const auditors = auditorsQuery.data ?? EMPTY_AUDITORS;
	const projects = projectsQuery.data ?? [];
	const places = projectPlacesQuery.data ?? [];
	const assignments = assignmentsQuery.data ?? [];
	const assignmentsSummaryState: AssignmentSummaryState = assignmentsQuery.isLoading
		? "loading"
		: assignmentsQuery.isError
			? "error"
			: "ready";
	const selectedAuditor = auditors.find(auditor => auditor.id === selectedAuditorId) ?? null;
	const queryAuditorId = searchParams.get("auditorId")?.trim() ?? "";
	const filteredAuditors = filterAuditors(auditors, auditorSearchQuery);

	React.useEffect(() => {
		if (hasInitializedSelectionFromQueryRef.current || auditorsQuery.isLoading) {
			return;
		}

		hasInitializedSelectionFromQueryRef.current = true;

		if (queryAuditorId.length === 0) {
			return;
		}

		const matchingAuditor = auditors.find(auditor => auditor.id === queryAuditorId) ?? null;
		if (matchingAuditor) {
			setSelectedAuditorId(matchingAuditor.id);
			return;
		}

		syncAuditorSelectionInUrl("");
	}, [auditors, auditorsQuery.isLoading, queryAuditorId, syncAuditorSelectionInUrl]);

	React.useEffect(() => {
		if (!hasInitializedSelectionFromQueryRef.current || selectedAuditorId === queryAuditorId) {
			return;
		}

		syncAuditorSelectionInUrl(selectedAuditorId);
	}, [queryAuditorId, selectedAuditorId, syncAuditorSelectionInUrl]);

	const isSelectionLocked = createAssignment.isPending || deleteAssignment.isPending;

	const handleSelectAuditor = React.useCallback(
		(nextValue: string) => {
			if (nextValue === selectedAuditorId) {
				return;
			}

			setSelectedAuditorId(nextValue);
			setAssignmentPendingDelete(null);
			setListError(null);
			resetComposer();
		},
		[resetComposer, selectedAuditorId]
	);

	const handleClearSelection = React.useCallback(() => {
		if (selectedAuditorId.trim().length === 0) {
			return;
		}

		setSelectedAuditorId("");
		setAssignmentPendingDelete(null);
		setListError(null);
		resetComposer();
	}, [resetComposer, selectedAuditorId]);

	const handleScopeChange = React.useCallback(
		(nextValue: AssignmentScope) => {
			setScope(nextValue);
			setSelectedPlaceId("");
			clearFieldError("projectId");
			clearFieldError("placeId");
			setFormError(null);
			setCreateSuccessMessage(null);
		},
		[clearFieldError]
	);

	const handleProjectChange = React.useCallback(
		(nextValue: string) => {
			setSelectedProjectId(nextValue);
			setSelectedPlaceId("");
			clearFieldError("projectId");
			clearFieldError("placeId");
			setFormError(null);
			setCreateSuccessMessage(null);
		},
		[clearFieldError]
	);

	const handlePlaceChange = React.useCallback(
		(nextValue: string) => {
			setSelectedPlaceId(nextValue);
			clearFieldError("placeId");
			setFormError(null);
			setCreateSuccessMessage(null);
		},
		[clearFieldError]
	);

	const handleResetComposer = React.useCallback(() => {
		resetComposer();
		scopeTriggerRef.current?.focus();
	}, [resetComposer]);

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

	function handleCreateAssignment() {
		const nextFieldErrors: AssignmentFieldErrors = {};
		const normalizedAuditorId = selectedAuditorId.trim();

		if (selectedProjectId.trim().length === 0) {
			nextFieldErrors.projectId =
				scope === "place" ? t("validation.projectRequiredForPlace") : t("validation.projectRequired");
		}

		if (scope === "place" && selectedPlaceId.trim().length === 0) {
			nextFieldErrors.placeId = t("validation.placeRequired");
		}

		setFieldErrors(nextFieldErrors);
		setFormError(null);
		setCreateSuccessMessage(null);

		if (normalizedAuditorId.length === 0) {
			setFormError(t("errors.selectAuditorBeforeCreate"));
			return;
		}

		if (Object.values(nextFieldErrors).some(value => typeof value === "string")) {
			return;
		}

		createAssignment.mutate({
			auditorId: normalizedAuditorId,
			projectId: selectedProjectId,
			placeId: scope === "project" ? null : selectedPlaceId
		});
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
							disabled={isSelectionLocked}
							emailPendingLabel={t("auditorFocus.emailPending")}
							selectedLabel={t("auditorFocus.selected")}
							selectedAuditorId={selectedAuditorId}
							searchQuery={auditorSearchQuery}
							searchLabel={t("auditorFocus.searchLabel")}
							searchPlaceholder={t("auditorFocus.searchPlaceholder")}
							searchResultsText={t("auditorFocus.searchResults", { count: filteredAuditors.length })}
							pickerLabel={t("auditorFocus.auditorLabel")}
							emptyLabel={t("auditorFocus.noMatchingAuditors")}
							helperText={t("auditorFocus.auditorHelp")}
							clearLabel={t("actions.clear")}
							onSearchQueryChange={setAuditorSearchQuery}
							onSelectAuditor={handleSelectAuditor}
							onClearSelection={handleClearSelection}
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
							<AssignmentComposerPanel
								assignmentsCount={assignments.length}
								assignmentsSummaryState={assignmentsSummaryState}
								fieldErrors={fieldErrors}
								formError={formError}
								isPending={createAssignment.isPending}
								places={places}
								projects={projects}
								scope={scope}
								scopeTriggerRef={scopeTriggerRef}
								selectedAuditor={selectedAuditor}
								selectedPlaceId={selectedPlaceId}
								selectedProjectId={selectedProjectId}
								successMessage={createSuccessMessage}
								onPlaceChange={handlePlaceChange}
								onProjectChange={handleProjectChange}
								onReset={handleResetComposer}
								onScopeChange={handleScopeChange}
								onSubmit={handleCreateAssignment}
							/>
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
									<li>{t("coverage.whatAppears.scopeSummaries")}</li>
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
												? t("assignment.projectAndPlaceScopeLabel")
												: t("assignment.projectOnlyScopeLabel")}
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
					if (!assignmentPendingDelete || selectedAuditorId.trim().length === 0) {
						return;
					}

					deleteAssignment.mutate({
						assignmentId: assignmentPendingDelete.id,
						auditorId: selectedAuditorId
					});
				}}
			/>
		</div>
	);
}

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
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

type AssignmentScope = "project" | "place";

interface AssignmentFieldErrors {
	auditorId?: string;
	projectId?: string;
	placeId?: string;
	roles?: string;
}

interface AssignmentPlaceOption {
	readonly id: string;
	readonly name: string;
	readonly projectId: string;
	readonly projectName: string;
}

interface PendingAssignmentDelete {
	readonly id: string;
	readonly scopeLabel: string;
	readonly scopeName: string;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return "Unable to load assignments.";
}

function formatRoleLabel(role: "auditor" | "place_admin"): string {
	return role === "place_admin" ? "place admin" : "auditor";
}

export default function ManagerAssignmentsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const session = useAuthSession();
	const queryClient = useQueryClient();
	const accountId = session?.role === "manager" ? session.accountId : null;
	const [selectedAuditorId, setSelectedAuditorId] = React.useState(searchParams.get("auditorId") ?? "");
	const [scope, setScope] = React.useState<AssignmentScope>("project");
	const [selectedProjectId, setSelectedProjectId] = React.useState("");
	const [selectedPlaceId, setSelectedPlaceId] = React.useState("");
	const [auditorSearchQuery, setAuditorSearchQuery] = React.useState("");
	const [allowSurvey, setAllowSurvey] = React.useState(true);
	const [allowAudit, setAllowAudit] = React.useState(true);
	const [fieldErrors, setFieldErrors] = React.useState<AssignmentFieldErrors>({});
	const [formError, setFormError] = React.useState<string | null>(null);
	const [listError, setListError] = React.useState<string | null>(null);
	const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
	const [assignmentPendingDelete, setAssignmentPendingDelete] = React.useState<PendingAssignmentDelete | null>(null);

	React.useEffect(() => {
		const auditorIdFromUrl = searchParams.get("auditorId") ?? "";
		setSelectedAuditorId(currentValue => {
			return currentValue === auditorIdFromUrl ? currentValue : auditorIdFromUrl;
		});
	}, [searchParams]);

	React.useEffect(() => {
		const auditorIdFromUrl = searchParams.get("auditorId") ?? "";
		if (auditorIdFromUrl === selectedAuditorId) {
			return;
		}

		const nextSearchParams = new URLSearchParams(searchParams.toString());
		if (selectedAuditorId.trim().length > 0) {
			nextSearchParams.set("auditorId", selectedAuditorId);
		} else {
			nextSearchParams.delete("auditorId");
		}

		const nextQueryString = nextSearchParams.toString();
		router.replace(nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname, {
			scroll: false
		});
	}, [pathname, router, searchParams, selectedAuditorId]);

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "auditors", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});
	const projectsQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "projects", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});
	const allPlacesQuery = useQuery({
		queryKey: ["playspace", "manager", "assignments", "places", accountId],
		queryFn: async (): Promise<AssignmentPlaceOption[]> => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}

			const projects = await playspaceApi.accounts.projects(accountId);
			const placesByProject = await Promise.all(
				projects.map(async project => {
					const places = await playspaceApi.projects.places(project.id);
					return places.map(place => ({
						id: place.id,
						name: place.name,
						projectId: project.id,
						projectName: project.name
					}));
				})
			);

			return placesByProject.flat();
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
				throw new Error("Select an auditor before creating assignments.");
			}

			const roles: Array<"auditor" | "place_admin"> = [];
			if (allowAudit) {
				roles.push("auditor");
			}
			if (allowSurvey) {
				roles.push("place_admin");
			}

			if (scope === "project") {
				return playspaceApi.assignments.create(selectedAuditorId, {
					project_id: selectedProjectId,
					place_id: null,
					audit_roles: roles
				});
			}

			return playspaceApi.assignments.create(selectedAuditorId, {
				project_id: null,
				place_id: selectedPlaceId,
				audit_roles: roles
			});
		},
		onSuccess: async () => {
			setFieldErrors({});
			setFormError(null);
			setListError(null);
			setScope("project");
			setSelectedProjectId("");
			setSelectedPlaceId("");
			setAllowSurvey(true);
			setAllowAudit(true);
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "assignments", "rows", selectedAuditorId]
			});
			setIsCreateSheetOpen(false);
		},
		onError: error => {
			setFormError(error instanceof Error ? error.message : "Unable to create assignment.");
		}
	});

	const deleteAssignment = useMutation({
		mutationFn: async (assignmentId: string) => {
			if (selectedAuditorId.trim().length === 0) {
				throw new Error("Select an auditor before deleting assignments.");
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
			setListError(error instanceof Error ? error.message : "Unable to delete assignment.");
		}
	});

	const auditors = React.useMemo(() => auditorsQuery.data ?? [], [auditorsQuery.data]);
	const projects = projectsQuery.data ?? [];
	const places = projectPlacesQuery.data ?? [];
	const assignments = assignmentsQuery.data ?? [];
	const selectedAuditor = auditors.find(auditor => auditor.id === selectedAuditorId) ?? null;
	const filteredAuditors = React.useMemo(() => {
		const normalizedQuery = auditorSearchQuery.trim().toLowerCase();
		if (normalizedQuery.length === 0) {
			return auditors;
		}

		return auditors.filter(auditor => {
			const searchableText = [auditor.auditor_code, auditor.full_name, auditor.email ?? ""]
				.join(" ")
				.toLowerCase();
			return searchableText.includes(normalizedQuery);
		});
	}, [auditorSearchQuery, auditors]);

	const projectNameById = React.useMemo(() => {
		const projectRows = projectsQuery.data ?? [];
		return new Map(projectRows.map(project => [project.id, project.name]));
	}, [projectsQuery.data]);

	const placeById = React.useMemo(() => {
		const placeRows = allPlacesQuery.data ?? [];
		return new Map(placeRows.map(place => [place.id, place]));
	}, [allPlacesQuery.data]);

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Assignment management"
					description="Assign auditors by project or place scope and tune execution capabilities."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Assignments" }]}
				/>
				<Card>
					<CardContent className="py-8">
						<p className="text-sm text-muted-foreground">
							Manager account context is missing from the current session.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (auditorsQuery.isLoading || projectsQuery.isLoading || allPlacesQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Assignment management"
					description="Assign auditors by project or place scope and tune execution capabilities."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Assignments" }]}
				/>
				<div className="h-36 animate-pulse rounded-card border border-border bg-card" />
				<div className="h-64 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (auditorsQuery.isError || projectsQuery.isError || allPlacesQuery.isError) {
		const error = auditorsQuery.error ?? projectsQuery.error ?? allPlacesQuery.error;

		return (
			<EmptyState
				title="Assignments unavailable"
				description={getErrorMessage(error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
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
			nextFieldErrors.auditorId = "Select an auditor before creating an assignment.";
		}

		if (selectedProjectId.trim().length === 0) {
			nextFieldErrors.projectId =
				scope === "place"
					? "Select the parent project so you can choose one of its places."
					: "Select the project this assignment should cover.";
		}

		if (scope === "place" && selectedPlaceId.trim().length === 0) {
			nextFieldErrors.placeId = "Select the place this assignment should cover.";
		}

		if (!allowAudit && !allowSurvey) {
			nextFieldErrors.roles = "Select at least one capability for this assignment.";
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
				eyebrow="Manager Workspace"
				title="Assignment management"
				description="Assign auditors by project or place scope and tune execution capabilities."
				breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Assignments" }]}
				actions={
					<Button
						type="button"
						className="gap-2"
						disabled={auditors.length === 0}
						onClick={() => {
							setIsCreateSheetOpen(true);
						}}>
						<PlusIcon className="size-4" />
						<span>New assignment</span>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Auditor focus</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
					<div className="space-y-4 rounded-field border border-border bg-card/80 p-4">
						<div className="space-y-1">
							<p className="font-medium text-foreground">Choose an auditor</p>
							<p className="text-sm text-muted-foreground">
								Filter the roster, then load one auditor&apos;s current project and place access before
								you make changes.
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="assignment_auditor_search">Search auditors</Label>
							<Input
								id="assignment_auditor_search"
								name="assignmentAuditorSearch"
								autoComplete="off"
								spellCheck={false}
								value={auditorSearchQuery}
								onChange={event => {
									setAuditorSearchQuery(event.target.value);
								}}
								placeholder="Search by code, name, or email."
							/>
							<p className="text-sm text-muted-foreground">
								{filteredAuditors.length} auditor{filteredAuditors.length === 1 ? "" : "s"} match the
								current filter.
							</p>
						</div>
						<div className="grid gap-2">
							<Label>Auditor</Label>
							<div className="flex flex-col gap-2 sm:flex-row">
								<div className="min-w-0 flex-1">
									<Select
										value={selectedAuditorId.trim().length > 0 ? selectedAuditorId : undefined}
										onValueChange={nextValue => {
											setSelectedAuditorId(nextValue);
											clearFieldError("auditorId");
											setListError(null);
										}}>
										<SelectTrigger
											id="assignment_auditor_filter"
											aria-label="Auditor"
											aria-invalid={Boolean(fieldErrors.auditorId)}
											disabled={auditors.length === 0 || filteredAuditors.length === 0}>
											<SelectValue
												placeholder={
													filteredAuditors.length === 0
														? "No matching auditors"
														: "Select an auditor"
												}
											/>
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectLabel>Matching auditors</SelectLabel>
												{filteredAuditors.map(auditor => (
													<SelectItem key={auditor.id} value={auditor.id}>
														{`${auditor.auditor_code} · ${auditor.full_name}`}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
								{selectedAuditorId.trim().length > 0 ? (
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											setSelectedAuditorId("");
											clearFieldError("auditorId");
											setListError(null);
										}}>
										Clear
									</Button>
								) : null}
							</div>
							{fieldErrors.auditorId ? (
								<p className="text-sm text-destructive">{fieldErrors.auditorId}</p>
							) : (
								<p className="text-sm text-muted-foreground">
									Choose an auditor to review assignment coverage or remove outdated access.
								</p>
							)}
						</div>
						<div className="rounded-field border border-border/70 bg-muted/35 p-4">
							<p className="font-medium text-foreground">How assignment review works</p>
							<ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
								<li>1. Load one auditor to see current access across projects and places.</li>
								<li>2. Review coverage before adding or removing assignments.</li>
								<li>3. Use New assignment to grant access, then return here to verify it.</li>
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
										<Badge variant="secondary">{selectedAuditor.role}</Badge>
									) : null}
									<Badge variant="outline">
										{`${assignments.length} loaded assignment${assignments.length === 1 ? "" : "s"}`}
									</Badge>
									<Badge variant="outline">{`${selectedAuditor.completed_audits} completed audits`}</Badge>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="space-y-1">
									<p className="font-medium text-foreground">Assignment preview</p>
									<p className="text-sm text-muted-foreground">
										Select an auditor to reveal their current project and place coverage, recent
										audit volume, and the management actions available on this page.
									</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-field border border-border/70 bg-muted/35 p-4">
										<p className="font-medium text-foreground">Project scope</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Grant access across every place in a project when the auditor needs wider
											coverage.
										</p>
									</div>
									<div className="rounded-field border border-border/70 bg-muted/35 p-4">
										<p className="font-medium text-foreground">Place scope</p>
										<p className="mt-2 text-sm text-muted-foreground">
											Grant access to one location when you need tighter field control.
										</p>
									</div>
								</div>
								<Button asChild variant="outline">
									<Link href="/manager/auditors">Open auditors</Link>
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Assignment coverage</CardTitle>
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
								<p className="font-medium text-foreground">Select an auditor to load assignments</p>
								<p className="text-sm text-muted-foreground">
									This panel shows what the selected auditor can currently access, including project
									scope, place scope, granted capabilities, and direct links back to the underlying
									record.
								</p>
							</div>
							<div className="rounded-field border border-border/70 bg-muted/35 p-4">
								<p className="font-medium text-foreground">What appears here</p>
								<ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
									<li>Current project and place coverage</li>
									<li>Capability badges for audit and place-admin access</li>
									<li>Open and delete actions for each assignment</li>
								</ul>
							</div>
						</div>
					) : assignmentsQuery.isLoading ? (
						<p className="text-sm text-muted-foreground">Loading assignments…</p>
					) : assignmentsQuery.isError ? (
						<div className="rounded-field border border-dashed border-border p-4">
							<p className="font-medium text-foreground">Assignments unavailable</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{getErrorMessage(assignmentsQuery.error)}
							</p>
						</div>
					) : assignments.length === 0 ? (
						<div className="grid gap-4 rounded-field border border-dashed border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
							<div className="space-y-2">
								<p className="font-medium text-foreground">No assignments yet</p>
								<p className="text-sm text-muted-foreground">
									{selectedAuditor
										? `Use New assignment to grant ${selectedAuditor.full_name} access to a project or place.`
										: "Use New assignment to grant project or place access."}
								</p>
							</div>
							<div className="rounded-field border border-border/70 bg-muted/35 p-4">
								<p className="font-medium text-foreground">Recommended next step</p>
								<p className="mt-2 text-sm text-muted-foreground">
									Start with project scope when the auditor needs wider coverage, then add place-only
									access when you need tighter control.
								</p>
							</div>
						</div>
					) : (
						assignments.map(assignment => {
							const assignedPlace = assignment.place_id
								? (placeById.get(assignment.place_id) ?? null)
								: null;
							const assignedProjectName =
								assignment.project_id !== null
									? (projectNameById.get(assignment.project_id) ??
										`Project ${assignment.project_id.slice(0, 8)}`)
									: (assignedPlace?.projectName ?? "Project pending");
							const scopeName =
								assignedPlace?.name ??
								(assignment.project_id !== null
									? (projectNameById.get(assignment.project_id) ??
										`Project ${assignment.project_id.slice(0, 8)}`)
									: `Assignment ${assignment.id.slice(0, 8)}`);
							const scopeLabel = assignedPlace ? "Place scope" : "Project scope";
							const deleteScopeLabel = assignedPlace ? "place" : "project";
							const scopeHref =
								assignment.place_id !== null
									? `/manager/places/${encodeURIComponent(assignment.place_id)}`
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
											{assignedPlace ? `${assignedProjectName} · ${scopeLabel}` : scopeLabel}
										</p>
										<p className="text-xs text-muted-foreground">
											Assigned {formatDateTimeLabel(assignment.assigned_at)}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										{assignment.audit_roles.map(role => (
											<Badge
												key={`${assignment.id}_${role}`}
												variant="outline"
												className="font-medium">
												{formatRoleLabel(role)}
											</Badge>
										))}
										{scopeHref ? (
											<Button asChild type="button" variant="outline">
												<Link href={scopeHref}>
													{assignedPlace ? "Open place" : "Open project"}
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
											Delete
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
						<SheetTitle>Create assignment</SheetTitle>
						<SheetDescription>
							Grant project or place access and choose what the auditor can do inside that scope.
						</SheetDescription>
					</SheetHeader>
					<div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
						<div className="grid gap-2">
							<Label>Auditor</Label>
							<Select
								value={selectedAuditorId.trim().length > 0 ? selectedAuditorId : undefined}
								onValueChange={nextValue => {
									setSelectedAuditorId(nextValue);
									clearFieldError("auditorId");
									setFormError(null);
								}}>
								<SelectTrigger
									id="auditor_select"
									aria-label="Auditor"
									aria-invalid={Boolean(fieldErrors.auditorId)}>
									<SelectValue placeholder="Select auditor" />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectGroup>
										<SelectLabel>Auditors</SelectLabel>
										{auditors.map(auditor => (
											<SelectItem key={auditor.id} value={auditor.id}>
												{`${auditor.auditor_code} · ${auditor.full_name}`}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{fieldErrors.auditorId ? (
								<p className="text-sm text-destructive">{fieldErrors.auditorId}</p>
							) : (
								<p className="text-sm text-muted-foreground">Choose who should receive this access.</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label>Scope</Label>
							<Select
								value={scope}
								onValueChange={nextValue => {
									setScope(nextValue as AssignmentScope);
									setSelectedPlaceId("");
									clearFieldError("projectId");
									clearFieldError("placeId");
									setFormError(null);
								}}>
								<SelectTrigger id="scope_select" aria-label="Scope">
									<SelectValue />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectGroup>
										<SelectLabel>Assignment scope</SelectLabel>
										<SelectItem value="project">Project</SelectItem>
										<SelectItem value="place">Place</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							<p className="text-sm text-muted-foreground">
								{scope === "project"
									? "Project scope lets the auditor work across every place in one project."
									: "Place scope grants access to a single location only."}
							</p>
						</div>
						<div className="grid gap-2">
							<Label>Project</Label>
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
									aria-label="Project"
									aria-invalid={Boolean(fieldErrors.projectId)}>
									<SelectValue placeholder="Select project" />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectGroup>
										<SelectLabel>Projects</SelectLabel>
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
								<p className="text-sm text-muted-foreground">
									Choose the project this assignment should unlock.
								</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label>Place</Label>
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
									aria-label="Place"
									aria-invalid={Boolean(fieldErrors.placeId)}>
									<SelectValue placeholder="Select place" />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectGroup>
										<SelectLabel>
											{selectedProjectId.trim().length === 0
												? "Select a project first"
												: "Places"}
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
											? "Select a project first to load its places."
											: "Choose the one place this assignment should cover."
										: "Place selection is only required for place scope."}
								</p>
							)}
						</div>
						<fieldset className="grid gap-2 md:col-span-2">
							<legend className="text-sm font-medium text-foreground">Capabilities</legend>
							<p className="text-sm text-muted-foreground">
								Choose what the auditor can do inside the selected scope.
							</p>
							<div className="flex flex-wrap items-center gap-4">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={allowAudit}
										onChange={event => {
											setAllowAudit(event.target.checked);
											clearFieldError("roles");
										}}
									/>
									Audit capability
								</label>
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={allowSurvey}
										onChange={event => {
											setAllowSurvey(event.target.checked);
											clearFieldError("roles");
										}}
									/>
									Place admin capability
								</label>
							</div>
							{fieldErrors.roles ? <p className="text-sm text-destructive">{fieldErrors.roles}</p> : null}
						</fieldset>
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
								Cancel
							</Button>
							<Button
								type="button"
								disabled={createAssignment.isPending}
								onClick={handleCreateAssignment}>
								{createAssignment.isPending ? "Creating…" : "Create assignment"}
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
				title="Delete assignment"
				description={
					assignmentPendingDelete
						? `Remove ${assignmentPendingDelete.scopeLabel} access for "${assignmentPendingDelete.scopeName}"? The auditor will lose this access until you assign it again.`
						: "Remove this assignment? The auditor will lose this access until you assign it again."
				}
				confirmLabel="Delete assignment"
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

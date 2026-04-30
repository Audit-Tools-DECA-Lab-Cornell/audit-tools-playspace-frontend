"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon, FolderOpenIcon, PencilLineIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { playspaceApi, type AuditorSummary, type ManagerPlaceRow } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { AuditorDialog, type AuditorDialogPayload } from "@/components/dashboard/auditor-dialog";
import { AuditorsTable } from "@/components/dashboard/auditors-table";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterPopover } from "@/components/dashboard/filter-popover";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ManagerAuditorsPage() {
	const session = useAuthSession();
	const queryClient = useQueryClient();
	const accountId = session?.role === "manager" ? session.accountId : null;
	const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
	const [editingAuditorId, setEditingAuditorId] = React.useState<string | null>(null);
	const [auditorPendingDelete, setAuditorPendingDelete] = React.useState<{
		id: string;
		label: string;
	} | null>(null);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "manager", "auditors", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});

	const projectsQuery = useQuery({
		queryKey: ["playspace", "manager", "auditors", "projects", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});

	const placesQuery = useQuery({
		queryKey: ["playspace", "manager", "auditors", "places", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.places(accountId, { page: 1, pageSize: 200 });
		},
		enabled: accountId !== null
	});

	/**
	 * When project or place filters are active, fetch audits for those scopes and
	 * derive the set of auditor codes that have activity there.  Used to
	 * client-side filter the roster below.
	 */
	const hasActiveFilter = selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

	const filteredAuditorsQuery = useQuery({
		queryKey: [
			"playspace",
			"manager",
			"auditors",
			"filter-by-scope",
			accountId,
			selectedProjectIds,
			selectedPlaceIds
		],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			const result = await playspaceApi.accounts.audits(accountId, {
				projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
				placeIds: selectedPlaceIds.length > 0 ? selectedPlaceIds : undefined,
				page: 1,
				pageSize: 200
			});
			return new Set(result.items.map(a => a.auditor_code));
		},
		enabled: accountId !== null && hasActiveFilter
	});

	const createAuditor = useMutation({
		mutationFn: async (payload: AuditorDialogPayload) => playspaceApi.management.auditors.create(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "auditors", accountId]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "auditors"]
			});
			setIsCreateDialogOpen(false);
		}
	});

	const updateAuditor = useMutation({
		mutationFn: async (input: { auditorId: string; payload: AuditorDialogPayload }) =>
			playspaceApi.management.auditors.update(input.auditorId, input.payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "auditors", accountId]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "auditors"]
			});
			setEditingAuditorId(null);
		},
		retry: 0
	});

	const deleteAuditor = useMutation({
		mutationFn: async (auditorProfileId: string) => playspaceApi.management.auditors.delete(auditorProfileId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "manager", "auditors", accountId]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "auditors"]
			});
			setAuditorPendingDelete(null);
		}
	});

	const allAuditors = React.useMemo(() => auditorsQuery.data ?? [], [auditorsQuery.data]);
	const editingAuditor = allAuditors.find(auditor => auditor.id === editingAuditorId) ?? null;

	/** Apply project / place filter client-side using the scoped auditor-code set. */
	const auditors = React.useMemo((): AuditorSummary[] => {
		if (!hasActiveFilter) {
			return allAuditors;
		}
		const allowedCodes = filteredAuditorsQuery.data;
		if (!allowedCodes) {
			return allAuditors;
		}
		return allAuditors.filter(a => allowedCodes.has(a.auditor_code));
	}, [allAuditors, hasActiveFilter, filteredAuditorsQuery.data]);

	const activeAuditors = auditors.filter(auditor => auditor.last_active_at !== null).length;
	const totalAssignments = auditors.reduce((runningTotal, auditor) => runningTotal + auditor.assignments_count, 0);
	const completedAudits = auditors.reduce((runningTotal, auditor) => runningTotal + auditor.completed_audits, 0);

	const projectOptions = React.useMemo(() => {
		return (projectsQuery.data ?? []).map(p => ({ label: p.name, value: p.id }));
	}, [projectsQuery.data]);

	const placeOptions = React.useMemo(() => {
		return (placesQuery.data?.items ?? []).map((p: ManagerPlaceRow) => ({ label: p.name, value: p.id }));
	}, [placesQuery.data]);

	function clearAllFilters(): void {
		setSelectedProjectIds([]);
		setSelectedPlaceIds([]);
	}

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Auditor management"
					description="Create auditors and review their assignment and activity footprint."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Auditors" }]}
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

	if (auditorsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Auditor management"
					description="Create auditors and review their assignment and activity footprint."
					breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Auditors" }]}
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={`auditor-stat-skeleton-${index}`}
							className="h-32 animate-pulse rounded-card border border-border bg-card"
						/>
					))}
				</div>
				<div className="h-[420px] animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (auditorsQuery.isError) {
		return (
			<EmptyState
				title="Auditors unavailable"
				description="Unable to load the auditor roster. Refresh and try again."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Auditor management"
				description="Manage roster identity, workload, and assignment operations from a single workspace."
				breadcrumbs={[{ label: "Dashboard", href: "/manager/dashboard" }, { label: "Auditors" }]}
				actions={
					<div className="flex gap-2">
						<Button type="button" variant="outline" className="gap-2" asChild>
							<Link href="/manager/reports">
								<FileTextIcon className="size-4" />
								<span>View Reports</span>
							</Link>
						</Button>
						<Button type="button" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
							<PlusIcon className="size-4" />
							<span>New auditor</span>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Auditors"
					value={String(auditors.length)}
					helper="Profiles currently linked to this account."
					tone="info"
				/>
				<StatCard
					title="Active Recently"
					value={String(activeAuditors)}
					helper="Auditors with recent visible activity."
					tone="success"
				/>
				<StatCard
					title="Assignments"
					value={String(totalAssignments)}
					helper="Project and place-level assignments across the roster."
					tone="warning"
				/>
				<StatCard
					title="Completed Audits"
					value={String(completedAudits)}
					helper="Submitted audits delivered by this roster."
					tone="violet"
				/>
			</div>
			<AuditorsTable
				auditors={auditors}
				title="Auditor Roster"
				description="Search, sort, and manage the delivery capacity behind your audit programs."
				toolbarExtra={
					<>
						<FilterPopover
							title="Projects"
							options={projectOptions}
							selectedValues={selectedProjectIds}
							onChange={setSelectedProjectIds}
						/>
						<FilterPopover
							title="Places"
							options={placeOptions}
							selectedValues={selectedPlaceIds}
							onChange={setSelectedPlaceIds}
						/>
						{hasActiveFilter && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-1.5"
								onClick={clearAllFilters}>
								<XIcon className="size-3.5" />
								Clear filters
							</Button>
						)}
					</>
				}
				getRowActions={auditor => [
					{
						label: "View auditor",
						href: `/manager/auditors/${encodeURIComponent(auditor.id)}`,
						icon: FolderOpenIcon
					},
					{
						label: "Edit auditor",
						onSelect: () => setEditingAuditorId(auditor.id),
						icon: PencilLineIcon
					},
					{
						label: "Delete auditor",
						onSelect: () =>
							setAuditorPendingDelete({
								id: auditor.id,
								label: `${auditor.auditor_code} · ${auditor.full_name}`
							}),
						icon: Trash2Icon,
						variant: "destructive"
					}
				]}
				emptyMessage="No auditors yet. Create your first auditor profile to begin staffing projects."
			/>
			<AuditorDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				mode="create"
				title="Create auditor"
				description="Add a new auditor profile that can be assigned to projects and places."
				submitLabel="Create auditor"
				isPending={createAuditor.isPending}
				onSubmit={async payload => {
					await createAuditor.mutateAsync(payload);
				}}
			/>
			<AuditorDialog
				open={editingAuditorId !== null}
				onOpenChange={open => {
					if (!open) {
						setEditingAuditorId(null);
					}
				}}
				mode="edit"
				title="Edit auditor"
				description="Update roster identity, profile metadata, and contact details."
				submitLabel="Save changes"
				initialValues={
					editingAuditor
						? {
								email: editingAuditor.email,
								fullName: editingAuditor.full_name,
								auditorCode: editingAuditor.auditor_code,
								role: editingAuditor.role,
								ageRange: editingAuditor.age_range,
								gender: editingAuditor.gender,
								country: editingAuditor.country
							}
						: undefined
				}
				isPending={updateAuditor.isPending}
				onSubmit={async payload => {
					if (!editingAuditorId) {
						throw new Error("Auditor context is unavailable.");
					}

					await updateAuditor.mutateAsync({
						auditorId: editingAuditorId,
						payload
					});
				}}
			/>
			<ConfirmDialog
				open={auditorPendingDelete !== null}
				onOpenChange={open => {
					if (!open) {
						setAuditorPendingDelete(null);
					}
				}}
				title="Delete auditor"
				description={
					auditorPendingDelete
						? `Delete "${auditorPendingDelete.label}"? This action cannot be undone.`
						: "Delete this auditor? This action cannot be undone."
				}
				confirmLabel="Delete auditor"
				isPending={deleteAuditor.isPending}
				onConfirm={() => {
					if (!auditorPendingDelete) {
						return;
					}

					deleteAuditor.mutate(auditorPendingDelete.id);
				}}
			/>
		</div>
	);
}

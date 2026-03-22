"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { use } from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { BackButton } from "@/components/dashboard/back-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlaceSheet, type PlaceSheetPayload } from "@/components/dashboard/place-sheet";
import { PlacesTable } from "@/components/dashboard/places-table";
import { ProjectDialog, type ProjectDialogPayload } from "@/components/dashboard/project-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateLabel, formatProjectDateRange, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ManagerProjectDetailPageProps {
	params: Promise<{
		projectId: string;
	}>;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Could not load the project.";
}

export default function ManagerProjectDetailPage({ params }: Readonly<ManagerProjectDetailPageProps>) {
	const projectParams = use(params);
	const projectId = projectParams.projectId;
	const queryClient = useQueryClient();
	const [isPlaceSheetOpen, setIsPlaceSheetOpen] = React.useState(false);
	const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
	const [placePendingDelete, setPlacePendingDelete] = React.useState<{
		id: string;
		name: string;
	} | null>(null);

	const projectQuery = useQuery({
		queryKey: ["playspace", "project", projectId],
		queryFn: () => playspaceApi.projects.get(projectId)
	});

	const projectStatsQuery = useQuery({
		queryKey: ["playspace", "project", projectId, "stats"],
		queryFn: () => playspaceApi.projects.stats(projectId)
	});

	const projectPlacesQuery = useQuery({
		queryKey: ["playspace", "project", projectId, "places"],
		queryFn: () => playspaceApi.projects.places(projectId)
	});

	const createPlace = useMutation({
		mutationFn: async (payload: PlaceSheetPayload & { project_id: string }) =>
			playspaceApi.management.places.create(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId, "places"]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId, "stats"]
			});
			setIsPlaceSheetOpen(false);
		}
	});

	const updateProject = useMutation({
		mutationFn: async (payload: ProjectDialogPayload) =>
			playspaceApi.management.projects.update(projectId, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId, "stats"]
			});
			setIsProjectDialogOpen(false);
		},
		retry: 0
	});

	const deletePlace = useMutation({
		mutationFn: async (placeId: string) => playspaceApi.management.places.delete(placeId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId, "places"]
			});
			await queryClient.invalidateQueries({
				queryKey: ["playspace", "project", projectId, "stats"]
			});
			setPlacePendingDelete(null);
		}
	});

	if (projectQuery.isLoading || projectStatsQuery.isLoading || projectPlacesQuery.isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-20 animate-pulse rounded-card border border-border bg-card" />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => {
						return (
							<div key={index} className="h-36 animate-pulse rounded-card border border-border bg-card" />
						);
					})}
				</div>
				<div className="h-64 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (projectQuery.isError || projectStatsQuery.isError || projectPlacesQuery.isError) {
		const error = projectQuery.error ?? projectStatsQuery.error ?? projectPlacesQuery.error;

		return (
			<EmptyState
				title="Project unavailable"
				description={getErrorMessage(error)}
				action={<BackButton href="/manager/projects" label="Back to projects" />}
			/>
		);
	}

	if (!projectQuery.data || !projectStatsQuery.data || !projectPlacesQuery.data) {
		return (
			<div className="space-y-6">
				<div className="h-20 animate-pulse rounded-card border border-border bg-card" />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => {
						return (
							<div key={index} className="h-36 animate-pulse rounded-card border border-border bg-card" />
						);
					})}
				</div>
				<div className="h-64 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	const project = projectQuery.data;
	const stats = projectStatsQuery.data;
	const places = projectPlacesQuery.data;
	const placeTypeLabel = project.place_types.length > 0 ? project.place_types : ["Place types pending"];

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Project Workspace"
				title={project.name}
				description={project.overview ?? "Project overview is still being refined."}
				breadcrumbs={[
					{ label: "Dashboard", href: "/manager/dashboard" },
					{ label: "Projects", href: "/manager/projects" },
					{ label: project.name }
				]}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<BackButton href="/manager/projects" label="Back to projects" />
						<Button
							type="button"
							variant="outline"
							className="gap-2"
							onClick={() => setIsProjectDialogOpen(true)}>
							<PencilLineIcon className="size-4" />
							<span>Edit project</span>
						</Button>
						<Button type="button" className="gap-2" onClick={() => setIsPlaceSheetOpen(true)}>
							<PlusIcon className="size-4" />
							<span>New place</span>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Places"
					value={String(stats.places_count)}
					helper={`${stats.places_with_audits} places already have audit activity.`}
				/>
				<StatCard
					title="Audits Completed"
					value={String(stats.audits_completed)}
					helper={`${stats.in_progress_audits} audits still in progress.`}
					tone="success"
				/>
				<StatCard
					title="Auditors Assigned"
					value={String(stats.auditors_count)}
					helper="Unique auditors assigned across project and place scope."
					tone="warning"
				/>
				<StatCard
					title="Overall Mean Score"
					value={formatScoreLabel(stats.average_score)}
					helper="Average across submitted audits only."
					tone="violet"
				/>
			</div>
			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="places">Places</TabsTrigger>
				</TabsList>
				<TabsContent value="overview">
					<div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
						<Card>
							<CardHeader>
								<CardTitle>Project settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="flex flex-wrap gap-2">
									{placeTypeLabel.map(placeType => (
										<Badge key={placeType} variant="outline">
											{placeType}
										</Badge>
									))}
								</div>
								<div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
									<div className="space-y-1">
										<p className="font-medium text-foreground">Timeline</p>
										<p>{formatProjectDateRange(project)}</p>
									</div>
									<div className="space-y-1">
										<p className="font-medium text-foreground">Estimated places</p>
										<p>{project.est_places ?? "Pending"}</p>
									</div>
									<div className="space-y-1">
										<p className="font-medium text-foreground">Estimated auditors</p>
										<p>{project.est_auditors ?? "Pending"}</p>
									</div>
									<div className="space-y-1">
										<p className="font-medium text-foreground">Created</p>
										<p className="tabular-nums">{formatDateLabel(project.created_at)}</p>
									</div>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">Auditor guidance</p>
									<p className="text-sm text-muted-foreground">
										{project.auditor_description ?? "Auditor profile description pending."}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Delivery signals</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="rounded-field border border-border/70 bg-muted/40 p-4">
									<p className="text-sm font-medium text-foreground">Current submitted mean score</p>
									<p className="mt-2 font-mono text-3xl text-foreground">
										{formatScoreLabel(stats.average_score)}
									</p>
								</div>
								<div className="grid gap-3 text-sm text-muted-foreground">
									<p>{stats.places_with_audits} places already have audit activity.</p>
									<p>{stats.in_progress_audits} audits are still in progress.</p>
									<p>{stats.auditors_count} unique auditors are assigned across this project.</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
				<TabsContent value="places">
					<PlacesTable
						places={places}
						title="Project Places"
						description="Manage every audit location in this project from a single operational table."
						getRowActions={place => [
							{
								label: "Open place",
								href: `/manager/places/${encodeURIComponent(place.id)}`
							},
							{
								label: "Delete place",
								onSelect: () =>
									setPlacePendingDelete({
										id: place.id,
										name: place.name
									}),
								icon: Trash2Icon,
								variant: "destructive"
							}
						]}
						emptyMessage="No places yet. Create the first place to start audit operations for this project."
					/>
				</TabsContent>
			</Tabs>
			<ProjectDialog
				open={isProjectDialogOpen}
				onOpenChange={setIsProjectDialogOpen}
				title="Edit project"
				description="Update project planning metadata and auditor guidance."
				submitLabel="Save changes"
				initialValues={{
					name: project.name,
					overview: project.overview,
					placeTypes: project.place_types,
					startDate: project.start_date,
					endDate: project.end_date,
					estimatedPlaces: project.est_places,
					estimatedAuditors: project.est_auditors,
					auditorDescription: project.auditor_description
				}}
				isPending={updateProject.isPending}
				onSubmit={async payload => {
					await updateProject.mutateAsync(payload);
				}}
			/>
			<PlaceSheet
				open={isPlaceSheetOpen}
				onOpenChange={setIsPlaceSheetOpen}
				title="Create place"
				description="Add a new audit location to this project."
				submitLabel="Create place"
				isPending={createPlace.isPending}
				onSubmit={async payload => {
					await createPlace.mutateAsync({
						project_id: projectId,
						...payload
					});
				}}
			/>
			<ConfirmDialog
				open={placePendingDelete !== null}
				onOpenChange={open => {
					if (!open) {
						setPlacePendingDelete(null);
					}
				}}
				title="Delete place"
				description={
					placePendingDelete
						? `Delete "${placePendingDelete.name}"? This action cannot be undone.`
						: "Delete this place? This action cannot be undone."
				}
				confirmLabel="Delete place"
				isPending={deletePlace.isPending}
				onConfirm={() => {
					if (!placePendingDelete) {
						return;
					}

					deletePlace.mutate(placePendingDelete.id);
				}}
			/>
		</div>
	);
}

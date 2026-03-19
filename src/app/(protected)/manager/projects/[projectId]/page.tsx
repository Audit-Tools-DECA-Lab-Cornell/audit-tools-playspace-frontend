"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlacesTable } from "@/components/dashboard/places-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatProjectDateRange, formatScoreLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
				action={
					<Button asChild>
						<Link href="/manager/projects">Back to projects</Link>
					</Button>
				}
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

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Project Overview"
				title={project.name}
				description={project.overview ?? "Project overview is still being refined."}
				actions={
					<Button asChild variant="secondary">
						<Link href="/manager/projects">Back to projects</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Project settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{project.place_types.map(placeType => {
							return (
								<Badge key={placeType} variant="outline">
									{placeType}
								</Badge>
							);
						})}
					</div>
					<div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
						<p>{formatProjectDateRange(project)}</p>
						<p>Estimated places: {project.est_places ?? "Pending"}</p>
						<p>Estimated auditors: {project.est_auditors ?? "Pending"}</p>
					</div>
					<p className="text-sm text-muted-foreground">
						{project.auditor_description ?? "Auditor profile description pending."}
					</p>
				</CardContent>
			</Card>

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

			{places.length > 0 ? (
				<PlacesTable places={places} />
			) : (
				<EmptyState
					title="No places yet"
					description="Places will appear here once the project starts adding locations to audit."
				/>
			)}
		</div>
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { PLAYSPACE_DEMO_ACCOUNT_ID, playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { Button } from "@/components/ui/button";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Could not load projects.";
}

export default function ManagerProjectsPage() {
	const projectsQuery = useQuery({
		queryKey: ["playspace", "account", PLAYSPACE_DEMO_ACCOUNT_ID, "projects"],
		queryFn: () => playspaceApi.accounts.projects(PLAYSPACE_DEMO_ACCOUNT_ID)
	});

	if (projectsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Projects"
					description="Project-level tracking, stats, and place coverage across the account."
				/>
				<div className="h-56 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (projectsQuery.isError) {
		return (
			<EmptyState
				title="Projects unavailable"
				description={getErrorMessage(projectsQuery.error)}
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	if (!projectsQuery.data) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Projects"
					description="Project-level tracking, stats, and place coverage across the account."
				/>
				<div className="h-56 animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (projectsQuery.data.length === 0) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Projects"
					description="Project-level tracking, stats, and place coverage across the account."
				/>
				<EmptyState
					title="No projects yet"
					description="Projects will appear here once the account starts setting up audit work."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Projects"
				description="Project-level tracking, stats, and place coverage across the account."
			/>
			<ProjectsTable projects={projectsQuery.data} title="All projects" />
		</div>
	);
}

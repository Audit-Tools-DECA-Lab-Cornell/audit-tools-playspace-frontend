"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { playspaceApi } from "@/lib/api/playspace";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AUDITOR_PLACES_PAGE_SIZE = 8;

function getStatusBadgeVariant(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | null) {
	if (status === "SUBMITTED") return "default";
	if (status === "IN_PROGRESS" || status === "PAUSED") return "secondary";
	return "outline";
}

function getStatusLabel(status: "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | null): string {
	if (!status) return "not started";
	return status.toLowerCase().replaceAll("_", " ");
}

function formatLocation(city: string | null, province: string | null, country: string | null): string {
	const parts = [city, province, country].filter((part): part is string => Boolean(part && part.trim().length > 0));
	if (parts.length === 0) return "Location pending";
	return parts.join(", ");
}

export default function AuditorPlacesPage() {
	const [currentPage, setCurrentPage] = React.useState(1);
	const placesQuery = useQuery({
		queryKey: ["playspace", "auditor", "assignedPlaces", "placesPage"],
		queryFn: () => playspaceApi.auditor.assignedPlaces()
	});
	const places = placesQuery.data ?? [];
	const pageCount = Math.max(1, Math.ceil(places.length / AUDITOR_PLACES_PAGE_SIZE));
	const paginatedPlaces = places.slice(
		(currentPage - 1) * AUDITOR_PLACES_PAGE_SIZE,
		currentPage * AUDITOR_PLACES_PAGE_SIZE
	);

	React.useEffect(() => {
		if (currentPage > pageCount) {
			setCurrentPage(pageCount);
		}
	}, [currentPage, pageCount]);

	if (placesQuery.isLoading) {
		return <div className="h-64 animate-pulse rounded-card border border-border bg-card" />;
	}

	if (placesQuery.isError || !placesQuery.data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Unable to load places</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Try refreshing the page. If this continues, check your sign-in role and access scope.
					</p>
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Refresh
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Auditor Workspace"
				title="Assigned places"
				description="Review place context, status, and continue execution."
				breadcrumbs={[
					{ label: "Dashboard", href: "/auditor/dashboard" },
					{ label: "Places" }
				]}
			/>
			<Card>
				<CardHeader>
					<CardTitle>Places</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{places.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Assigned places will appear here after a manager grants access. Refresh if you were just
							assigned.
						</p>
					) : null}
					{paginatedPlaces.map(place => {
						const executeHref = `/auditor/execute/${encodeURIComponent(place.place_id)}`;
						const reportHref =
							place.audit_status === "SUBMITTED" && place.audit_id
								? `/auditor/reports/${encodeURIComponent(place.audit_id)}`
								: null;
						const isResumeAction = place.audit_status === "IN_PROGRESS" || place.audit_status === "PAUSED";
						const primaryActionLabel = isResumeAction ? "Resume audit" : "Start audit";
						return (
							<div
								key={place.place_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="min-w-0 space-y-1">
									<p className="font-medium text-foreground">{place.place_name}</p>
									<p className="text-sm text-muted-foreground">{place.project_name}</p>
									<p className="text-xs text-muted-foreground">
										{formatLocation(place.city, place.province, place.country)}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={getStatusBadgeVariant(place.audit_status)} className="font-medium">
										{getStatusLabel(place.audit_status)}
									</Badge>
									<Button asChild size="sm" variant={isResumeAction ? "outline" : "default"}>
										<Link href={executeHref}>{primaryActionLabel}</Link>
									</Button>
									{reportHref ? (
										<Button asChild size="sm" variant="outline">
											<Link href={reportHref}>Open report</Link>
										</Button>
									) : null}
								</div>
							</div>
						);
					})}
					<PaginationControls
						currentPage={currentPage}
						pageCount={pageCount}
						totalItems={places.length}
						pageSize={AUDITOR_PLACES_PAGE_SIZE}
						itemLabel="places"
						onPageChange={setCurrentPage}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

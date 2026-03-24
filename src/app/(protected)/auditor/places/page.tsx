"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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

function formatLocation(
	city: string | null,
	province: string | null,
	country: string | null,
	pendingLabel: string
): string {
	const parts = [city, province, country].filter((part): part is string => Boolean(part && part.trim().length > 0));
	if (parts.length === 0) return pendingLabel;
	return parts.join(", ");
}

export default function AuditorPlacesPage() {
	const t = useTranslations("auditor.places");
	const [currentPage, setCurrentPage] = React.useState(1);
	const placesQuery = useQuery({
		queryKey: ["playspace", "auditor", "assignedPlaces", "placesPage", currentPage],
		queryFn: () =>
			playspaceApi.auditor.assignedPlaces({
				page: currentPage,
				pageSize: AUDITOR_PLACES_PAGE_SIZE,
				sort: "place_name"
			})
	});
	const places = placesQuery.data?.items ?? [];
	const pageCount = placesQuery.data?.total_pages ?? 1;

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
					<CardTitle>{t("error.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("error.description")}</p>
					<Button type="button" onClick={() => globalThis.location.reload()}>
						{t("actions.refresh")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow={t("header.eyebrow")}
				title={t("header.title")}
				description={t("header.description")}
				breadcrumbs={[
					{ label: t("breadcrumbs.dashboard"), href: "/auditor/dashboard" },
					{ label: t("breadcrumbs.places") }
				]}
			/>
			<Card>
				<CardHeader>
					<CardTitle>{t("list.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{places.length === 0 ? <p className="text-sm text-muted-foreground">{t("list.empty")}</p> : null}
					{places.map(place => {
						const executeHref = `/auditor/execute/${encodeURIComponent(place.place_id)}?projectId=${encodeURIComponent(place.project_id)}`;
						const reportHref =
							place.audit_status === "SUBMITTED" && place.audit_id
								? `/auditor/reports/${encodeURIComponent(place.audit_id)}`
								: null;
						const isResumeAction = place.audit_status === "IN_PROGRESS" || place.audit_status === "PAUSED";
						const primaryActionLabel = isResumeAction ? t("list.resumeAudit") : t("list.startAudit");
						return (
							<div
								key={place.place_id}
								className="flex flex-col gap-3 rounded-card border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="min-w-0 space-y-1">
									<p className="font-medium text-foreground">{place.place_name}</p>
									<p className="text-sm text-muted-foreground">{place.project_name}</p>
									<p className="text-xs text-muted-foreground">
										{formatLocation(
											place.city,
											place.province,
											place.country,
											t("list.locationPending")
										)}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant={getStatusBadgeVariant(place.audit_status)}
										className="font-medium text-foreground">
										{place.audit_status
											? t(`status.${place.audit_status.toLowerCase()}`)
											: t("status.not_started")}
									</Badge>
									<Button asChild size="sm">
										<Link href={executeHref}>{primaryActionLabel}</Link>
									</Button>
									{reportHref ? (
										<Button asChild size="sm" variant="outline">
											<Link href={reportHref}>{t("list.openReport")}</Link>
										</Button>
									) : null}
								</div>
							</div>
						);
					})}
					<PaginationControls
						currentPage={currentPage}
						pageCount={pageCount}
						totalItems={placesQuery.data.total_count}
						pageSize={AUDITOR_PLACES_PAGE_SIZE}
						itemLabel={t("pagination.itemLabel")}
						onPageChange={setCurrentPage}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

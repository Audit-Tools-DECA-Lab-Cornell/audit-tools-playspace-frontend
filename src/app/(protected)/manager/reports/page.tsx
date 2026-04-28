"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, FilterIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { playspaceApi, type AuditorSummary } from "@/lib/api/playspace";
import { useAuthSession } from "@/components/app/auth-session-provider";
import { AuditsTable, type AuditActivityRow } from "@/components/dashboard/audits-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface FilterPopoverProps {
	title: string;
	options: Array<{ label: string; value: string }>;
	selectedValues: string[];
	onChange: (values: string[]) => void;
}

function FilterPopover({ title, options, selectedValues, onChange }: FilterPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<FilterIcon className="size-3.5" />
					{title}
					{selectedValues.length > 0 && (
						<Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-mono text-xs">
							{selectedValues.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium">{title}</h4>
						{selectedValues.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-auto p-0 text-xs text-muted-foreground"
								onClick={() => onChange([])}>
								Clear
							</Button>
						)}
					</div>
					<Separator />
					<div className="max-h-60 space-y-2 overflow-y-auto">
						{options.map(option => (
							<div key={option.value} className="flex items-center gap-2">
								<Checkbox
									id={`filter-${title}-${option.value}`}
									checked={selectedValues.includes(option.value)}
									onCheckedChange={checked => {
										if (checked) {
											onChange([...selectedValues, option.value]);
										} else {
											onChange(selectedValues.filter(v => v !== option.value));
										}
									}}
								/>
								<Label
									htmlFor={`filter-${title}-${option.value}`}
									className="text-sm font-normal leading-none">
									{option.label}
								</Label>
							</div>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default function ManagerAuditorsReportsPage() {
	const session = useAuthSession();
	const router = useRouter();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);

	const projectsQuery = useQuery({
		queryKey: ["playspace", "manager", "reports", "projects", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.projects(accountId);
		},
		enabled: accountId !== null
	});

	const auditorsQuery = useQuery({
		queryKey: ["playspace", "manager", "reports", "auditors", accountId],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			return playspaceApi.accounts.auditors(accountId);
		},
		enabled: accountId !== null
	});

	const reportsQuery = useQuery({
		queryKey: ["playspace", "manager", "auditors", "reports", accountId, selectedProjectIds, selectedAuditorIds],
		queryFn: async () => {
			if (!accountId) {
				throw new Error("Manager account context is unavailable.");
			}
			const audits = await playspaceApi.accounts.audits(accountId, {
				statuses: ["SUBMITTED"],
				page: 1,
				pageSize: 100,
				projectIds: selectedProjectIds,
				auditorIds: selectedAuditorIds
			});
			return audits;
		},
		enabled: accountId !== null
	});

	const projectOptions = React.useMemo(() => {
		return (projectsQuery.data ?? []).map(p => ({ label: p.name, value: p.id }));
	}, [projectsQuery.data]);

	const auditorOptions = React.useMemo(() => {
		return (auditorsQuery.data ?? []).map((a: AuditorSummary) => ({
			label: `${a.auditor_code} · ${a.full_name}`,
			value: a.id
		}));
	}, [auditorsQuery.data]);

	if (!accountId) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audit Reports"
					description="View submitted audit reports from your auditors."
					breadcrumbs={[
						{ label: "Dashboard", href: "/manager/dashboard" },
						{ label: "Auditors", href: "/manager/auditors" },
						{ label: "Reports" }
					]}
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

	if (reportsQuery.isLoading) {
		return (
			<div className="space-y-6">
				<DashboardHeader
					eyebrow="Manager Workspace"
					title="Audit Reports"
					description="View submitted audit reports from your auditors."
					breadcrumbs={[
						{ label: "Dashboard", href: "/manager/dashboard" },
						{ label: "Auditors", href: "/manager/auditors" },
						{ label: "Reports" }
					]}
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, idx) => (
						<div
							key={`stat-skeleton-${idx}`}
							className="h-32 animate-pulse rounded-card border border-border bg-card"
						/>
					))}
				</div>
				<div className="h-[420px] animate-pulse rounded-card border border-border bg-card" />
			</div>
		);
	}

	if (reportsQuery.isError) {
		return (
			<EmptyState
				title="Reports unavailable"
				description="Unable to load audit reports. Refresh and try again."
				action={
					<Button type="button" onClick={() => globalThis.location.reload()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const data = reportsQuery.data;
	const rows: AuditActivityRow[] =
		data?.items.map(audit => ({
			id: audit.audit_id,
			auditCode: audit.audit_code,
			status: audit.status,
			auditorCode: audit.auditor_code,
			placeName: audit.place_name,
			placeId: audit.place_id,
			projectName: audit.project_name,
			projectId: audit.project_id,
			accountName: null,
			startedAt: audit.started_at,
			submittedAt: audit.submitted_at,
			score: audit.summary_score,
			scorePair: audit.score_pair
		})) ?? [];

	const totalSubmitted = data?.summary.submitted_audits;
	const averageScore = data?.summary.average_scores;

	return (
		<div className="space-y-6">
			<DashboardHeader
				eyebrow="Manager Workspace"
				title="Audit Reports"
				description="View submitted audit reports from your auditors."
				breadcrumbs={[
					{ label: "Dashboard", href: "/manager/dashboard" },
					{ label: "Auditors", href: "/manager/auditors" },
					{ label: "Reports" }
				]}
			/>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Reports"
					value={String(totalSubmitted)}
					helper="Submitted audits ready for review."
					tone="info"
				/>
				<StatCard
					title="Average Score"
					value={averageScore ? `PV ${averageScore.pv} | U ${averageScore.u}` : "Pending"}
					helper="Mean score across all submitted audits."
					tone="success"
				/>
				<StatCard
					title="Auditors"
					value={String(new Set(data?.items.map(a => a.auditor_code)).size)}
					helper="Unique auditors with submitted reports."
					tone="warning"
				/>
				<StatCard
					title="Places"
					value={String(new Set(data?.items.map(a => a.place_id)).size)}
					helper="Unique places with submitted audits."
					tone="violet"
				/>
			</div>
			<AuditsTable
				rows={rows}
				basePath="/manager/reports"
				title="Submitted Audit Reports"
				description="Browse completed audit reports. Click on a row to view details."
				pageSize={10}
				emptyMessage="No submitted audit reports yet."
				onRowClick={row => {
					router.push(`/manager/reports/${row.id}`);
				}}
				getRowActions={row => [
					{
						label: "View Report",
						onSelect: () => router.push(`/manager/reports/${row.id}`),
						icon: FileTextIcon
					}
				]}
				toolbarExtra={
					<>
						<FilterPopover
							title="Projects"
							options={projectOptions}
							selectedValues={selectedProjectIds}
							onChange={setSelectedProjectIds}
						/>
						<FilterPopover
							title="Auditors"
							options={auditorOptions}
							selectedValues={selectedAuditorIds}
							onChange={setSelectedAuditorIds}
						/>
						{(selectedProjectIds.length > 0 || selectedAuditorIds.length > 0) && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-1.5"
								onClick={() => {
									setSelectedProjectIds([]);
									setSelectedAuditorIds([]);
								}}>
								<XIcon className="size-3.5" />
								Clear filters
							</Button>
						)}
					</>
				}
			/>
		</div>
	);
}

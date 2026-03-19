"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { formatDateTimeLabel } from "@/components/dashboard/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	playspaceApi,
	type AuditorSignupApproval,
	type AuditorSignupRequest,
	type ProjectSummary
} from "@/lib/api/playspace";

type AssignmentScope = "project" | "place";

interface FeedbackMessage {
	tone: "success" | "error";
	text: string;
}

interface NativeSelectFieldProps {
	id: string;
	value: string;
	placeholder: string;
	options: ReadonlyArray<{
		value: string;
		label: string;
	}>;
	disabled?: boolean;
	onChange: (value: string) => void;
}

/**
 * Convert unknown query or mutation errors into readable copy.
 */
function getPanelErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}
	return fallbackMessage;
}

/**
 * Styled native select so the modal can stay dependency-light.
 */
function NativeSelectField({
	id,
	value,
	placeholder,
	options,
	disabled = false,
	onChange
}: Readonly<NativeSelectFieldProps>) {
	return (
		<select
			id={id}
			value={value}
			disabled={disabled}
			onChange={event => {
				onChange(event.target.value);
			}}
			className="flex h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50">
			<option value="">{placeholder}</option>
			{options.map(option => {
				return (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				);
			})}
		</select>
	);
}

/**
 * Shared banner for success and error feedback.
 */
function FeedbackBanner({ message }: Readonly<{ message: FeedbackMessage | null }>) {
	if (!message) {
		return null;
	}

	return (
		<p
			className={
				message.tone === "success"
					? "rounded-field border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
					: "rounded-field border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			}>
			{message.text}
		</p>
	);
}

/**
 * Lightweight loading rows used while notifications are fetched.
 */
function RequestsLoadingState() {
	return (
		<div className="space-y-3">
			{["request-skeleton-1", "request-skeleton-2"].map(skeletonId => {
				return (
					<div
						key={skeletonId}
						className="animate-pulse rounded-field border border-border bg-secondary/50 p-4">
						<div className="h-4 w-40 rounded bg-secondary" />
						<div className="mt-3 h-3 w-56 rounded bg-secondary" />
						<div className="mt-4 h-9 w-full rounded bg-secondary" />
					</div>
				);
			})}
		</div>
	);
}

interface PendingRequestCardProps {
	request: AuditorSignupRequest;
	disableApprove: boolean;
	disableDecline: boolean;
	isDeclining: boolean;
	onApprove: (request: AuditorSignupRequest) => void;
	onDecline: (request: AuditorSignupRequest) => void;
}

/**
 * Single pending request row shown inside the notification queue.
 */
function PendingRequestCard({
	request,
	disableApprove,
	disableDecline,
	isDeclining,
	onApprove,
	onDecline
}: Readonly<PendingRequestCardProps>) {
	return (
		<div className="space-y-4 rounded-field border border-border bg-secondary/30 p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<p className="font-medium text-foreground">{request.full_name}</p>
					<p className="text-sm text-muted-foreground">{request.email}</p>
					<p className="text-sm text-muted-foreground">Manager: {request.manager_email}</p>
					<p className="text-sm text-muted-foreground">
						Requested {formatDateTimeLabel(request.requested_at)}
					</p>
				</div>
				<Badge variant="outline">Pending review</Badge>
			</div>

			{request.note ? (
				<p className="rounded-field bg-background px-3 py-2 text-sm text-muted-foreground">{request.note}</p>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					onClick={() => {
						onApprove(request);
					}}
					disabled={disableApprove}>
					Approve and assign
				</Button>
				<Button
					type="button"
					size="sm"
					variant="destructive"
					onClick={() => {
						onDecline(request);
					}}
					disabled={disableDecline}>
					{isDeclining ? "Declining..." : "Decline"}
				</Button>
			</div>
		</div>
	);
}

/**
 * Pending manager notifications for self-service auditor access requests.
 */
export interface AuditorAccessRequestsPanelProps {
	accountId: string;
	projects: ProjectSummary[];
}

export function AuditorAccessRequestsPanel({ accountId, projects }: Readonly<AuditorAccessRequestsPanelProps>) {
	const queryClient = useQueryClient();
	const [selectedRequest, setSelectedRequest] = React.useState<AuditorSignupRequest | null>(null);
	const [assignmentScope, setAssignmentScope] = React.useState<AssignmentScope>("project");
	const [selectedProjectId, setSelectedProjectId] = React.useState("");
	const [selectedPlaceId, setSelectedPlaceId] = React.useState("");
	const [feedbackMessage, setFeedbackMessage] = React.useState<FeedbackMessage | null>(null);

	const requestsQuery = useQuery({
		queryKey: ["playspace", "account", accountId, "auditorSignupRequests"],
		queryFn: () => playspaceApi.accounts.auditorSignupRequests(accountId)
	});

	const placeOptionsQuery = useQuery({
		queryKey: ["playspace", "project", selectedProjectId, "places"],
		queryFn: () => playspaceApi.projects.places(selectedProjectId),
		enabled: selectedRequest !== null && assignmentScope === "place" && selectedProjectId.trim().length > 0
	});

	const approveMutation = useMutation({
		mutationFn: ({ requestId, projectId, placeId }: { requestId: string; projectId?: string; placeId?: string }) =>
			playspaceApi.accounts.approveAuditorSignupRequest(accountId, requestId, {
				projectId,
				placeId
			})
	});

	const declineMutation = useMutation({
		mutationFn: (requestId: string) => playspaceApi.accounts.declineAuditorSignupRequest(accountId, requestId)
	});

	const projectOptions = React.useMemo(() => {
		return projects.map(project => ({
			value: project.id,
			label: project.name
		}));
	}, [projects]);

	const placeOptions = React.useMemo(() => {
		const places = placeOptionsQuery.data ?? [];
		return places.map(place => ({
			value: place.id,
			label: place.name
		}));
	}, [placeOptionsQuery.data]);

	/**
	 * Keep the dashboard in sync after an approval or decline action.
	 */
	const invalidateDashboardQueries = React.useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["playspace", "account", accountId] }),
			queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "auditors"]
			}),
			queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "projects"]
			}),
			queryClient.invalidateQueries({
				queryKey: ["playspace", "account", accountId, "auditorSignupRequests"]
			})
		]);
	}, [accountId, queryClient]);

	/**
	 * Reset modal state when the manager closes or completes the review flow.
	 */
	const closeDialog = React.useCallback(() => {
		setSelectedRequest(null);
		setAssignmentScope("project");
		setSelectedProjectId("");
		setSelectedPlaceId("");
	}, []);

	/**
	 * Open the approval dialog with a clean assignment state.
	 */
	const openApproveDialog = React.useCallback((request: AuditorSignupRequest) => {
		setSelectedRequest(request);
		setAssignmentScope("project");
		setSelectedProjectId("");
		setSelectedPlaceId("");
		setFeedbackMessage(null);
	}, []);

	/**
	 * Submit the chosen assignment and approve the request.
	 */
	const handleApprove = React.useCallback(async () => {
		if (!selectedRequest) {
			return;
		}

		const approvalPayload =
			assignmentScope === "project"
				? {
						requestId: selectedRequest.id,
						projectId: selectedProjectId
					}
				: {
						requestId: selectedRequest.id,
						placeId: selectedPlaceId
					};

		try {
			const approvalResult: AuditorSignupApproval = await approveMutation.mutateAsync(approvalPayload);
			await invalidateDashboardQueries();

			const assignedLabel =
				approvalResult.approved_auditor.assigned_place_name ??
				approvalResult.approved_auditor.assigned_project_name ??
				"the selected assignment";

			setFeedbackMessage({
				tone: "success",
				text: `Approved ${approvalResult.approved_auditor.full_name}. Share code ${approvalResult.approved_auditor.auditor_code} and let them know they have been assigned to ${assignedLabel}.`
			});
			closeDialog();
		} catch (error) {
			setFeedbackMessage({
				tone: "error",
				text: getPanelErrorMessage(error, "The request could not be approved.")
			});
		}
	}, [
		approveMutation,
		assignmentScope,
		closeDialog,
		invalidateDashboardQueries,
		selectedPlaceId,
		selectedProjectId,
		selectedRequest
	]);

	/**
	 * Decline a pending request and remove it from the queue.
	 */
	const handleDecline = React.useCallback(
		async (request: AuditorSignupRequest) => {
			try {
				await declineMutation.mutateAsync(request.id);
				await invalidateDashboardQueries();
				setFeedbackMessage({
					tone: "success",
					text: `Declined ${request.full_name}'s access request.`
				});
			} catch (error) {
				setFeedbackMessage({
					tone: "error",
					text: getPanelErrorMessage(error, "The request could not be declined.")
				});
			}
		},
		[declineMutation, invalidateDashboardQueries]
	);

	/**
	 * Retry loading the notification queue without returning a promise to the click handler.
	 */
	const handleRetry = React.useCallback((): void => {
		requestsQuery.refetch().catch(() => undefined);
	}, [requestsQuery]);

	/**
	 * Wrap the async decline action for button onClick usage.
	 */
	const handleDeclineClick = React.useCallback(
		(request: AuditorSignupRequest): void => {
			handleDecline(request).catch(() => undefined);
		},
		[handleDecline]
	);

	/**
	 * Wrap the async approve action for button onClick usage.
	 */
	const handleApproveClick = React.useCallback((): void => {
		handleApprove().catch(() => undefined);
	}, [handleApprove]);

	const canApprove =
		assignmentScope === "project" ? selectedProjectId.trim().length > 0 : selectedPlaceId.trim().length > 0;

	return (
		<>
			<Card>
				<CardHeader className="gap-3">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-1">
							<CardTitle>Notifications</CardTitle>
							<CardDescription>
								Review auditor access requests and approve them with a required project or place
								assignment.
							</CardDescription>
						</div>
						<Badge variant="outline">{requestsQuery.data?.length ?? 0} pending</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<FeedbackBanner message={feedbackMessage} />

					{projects.length === 0 ? (
						<p className="rounded-field border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
							Add at least one project before approving access requests. Approval always requires an
							assignment.
						</p>
					) : null}

					{requestsQuery.isLoading ? <RequestsLoadingState /> : null}

					{requestsQuery.isError ? (
						<div className="rounded-field border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
							<p>{getPanelErrorMessage(requestsQuery.error, "Notifications could not be loaded.")}</p>
							<Button type="button" size="sm" variant="outline" className="mt-3" onClick={handleRetry}>
								Try again
							</Button>
						</div>
					) : null}

					{!requestsQuery.isLoading && !requestsQuery.isError && (requestsQuery.data?.length ?? 0) === 0 ? (
						<p className="text-sm text-muted-foreground">No pending auditor access requests right now.</p>
					) : null}

					{!requestsQuery.isLoading && !requestsQuery.isError
						? requestsQuery.data?.map(request => {
								const isDecliningCurrentRequest =
									declineMutation.isPending && declineMutation.variables === request.id;

								return (
									<PendingRequestCard
										key={request.id}
										request={request}
										disableApprove={
											projects.length === 0 ||
											approveMutation.isPending ||
											declineMutation.isPending
										}
										disableDecline={approveMutation.isPending || declineMutation.isPending}
										isDeclining={isDecliningCurrentRequest}
										onApprove={openApproveDialog}
										onDecline={handleDeclineClick}
									/>
								);
							})
						: null}
				</CardContent>
			</Card>

			<Dialog
				open={selectedRequest !== null}
				onOpenChange={open => {
					if (!open) {
						closeDialog();
					}
				}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve auditor request</DialogTitle>
						<DialogDescription>
							Approval is only available after you assign the auditor to a project or a place.
						</DialogDescription>
					</DialogHeader>

					{selectedRequest ? (
						<div className="space-y-5">
							<div className="rounded-field border border-border bg-secondary/30 p-4">
								<p className="font-medium text-foreground">{selectedRequest.full_name}</p>
								<p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
								<p className="mt-2 text-sm text-muted-foreground">
									Requested {formatDateTimeLabel(selectedRequest.requested_at)}
								</p>
								{selectedRequest.note ? (
									<p className="mt-3 text-sm text-muted-foreground">{selectedRequest.note}</p>
								) : null}
							</div>

							<div className="space-y-3">
								<Label>Assignment type</Label>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant={assignmentScope === "project" ? "default" : "outline"}
										onClick={() => {
											setAssignmentScope("project");
											setSelectedProjectId("");
											setSelectedPlaceId("");
										}}>
										Assign to project
									</Button>
									<Button
										type="button"
										variant={assignmentScope === "place" ? "default" : "outline"}
										onClick={() => {
											setAssignmentScope("place");
											setSelectedProjectId("");
											setSelectedPlaceId("");
										}}>
										Assign to place
									</Button>
								</div>
							</div>

							{assignmentScope === "project" ? (
								<div className="space-y-2">
									<Label htmlFor="approve_request_project">Project</Label>
									<NativeSelectField
										id="approve_request_project"
										value={selectedProjectId}
										placeholder="Select a project"
										options={projectOptions}
										onChange={value => {
											setSelectedProjectId(value);
										}}
									/>
								</div>
							) : (
								<div className="grid gap-4">
									<div className="space-y-2">
										<Label htmlFor="approve_request_place_project">Project</Label>
										<NativeSelectField
											id="approve_request_place_project"
											value={selectedProjectId}
											placeholder="Choose the project that contains the place"
											options={projectOptions}
											onChange={value => {
												setSelectedProjectId(value);
												setSelectedPlaceId("");
											}}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="approve_request_place">Place</Label>
										<NativeSelectField
											id="approve_request_place"
											value={selectedPlaceId}
											placeholder={
												selectedProjectId ? "Select a place" : "Choose a project first"
											}
											options={placeOptions}
											disabled={selectedProjectId.length === 0 || placeOptionsQuery.isLoading}
											onChange={value => {
												setSelectedPlaceId(value);
											}}
										/>
										{placeOptionsQuery.isLoading && selectedProjectId ? (
											<p className="text-sm text-muted-foreground">Loading places...</p>
										) : null}
										{placeOptionsQuery.isError ? (
											<p className="text-sm text-destructive">
												{getPanelErrorMessage(
													placeOptionsQuery.error,
													"Places could not be loaded for the selected project."
												)}
											</p>
										) : null}
									</div>
								</div>
							)}
						</div>
					) : null}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeDialog}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleApproveClick}
							disabled={!canApprove || approveMutation.isPending || placeOptionsQuery.isLoading}>
							{approveMutation.isPending ? "Approving..." : "Approve request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

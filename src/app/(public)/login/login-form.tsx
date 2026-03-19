"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { playspaceApi, type CreateAuditorSignupRequestInput } from "@/lib/api/playspace";
import { setBrowserAuthSession } from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";

const managerLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(8)
});

type ManagerLoginValues = z.infer<typeof managerLoginSchema>;

const auditorLoginSchema = z.object({
	auditorCode: z
		.string()
		.trim()
		.regex(/^[A-Za-z0-9-]+$/, {
			message: "Auditor code can only include letters, numbers, and hyphens."
		})
});

type AuditorLoginValues = z.infer<typeof auditorLoginSchema>;

const auditorAccessRequestSchema = z.object({
	managerEmail: z.email(),
	fullName: z.string().trim().min(1, "Full name is required.").max(200),
	email: z.email(),
	note: z.string().trim().max(1000, "Notes can be up to 1000 characters.")
});

type AuditorAccessRequestValues = z.infer<typeof auditorAccessRequestSchema>;

interface StatusMessage {
	tone: "success" | "error";
	text: string;
}

/**
 * Keep redirects constrained to internal app routes.
 */
function isSafeInternalPath(value: string): boolean {
	return value.startsWith("/") && !value.startsWith("//");
}

/**
 * Resolve the default dashboard for a signed-in role.
 */
function getDefaultDashboard(role: UserRole): string {
	return role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
}

/**
 * Restrict role-based redirects to the pages that role can actually visit.
 */
function isAllowedNextPath(role: UserRole, nextPath: string): boolean {
	if (!isSafeInternalPath(nextPath)) return false;
	if (nextPath.startsWith("/settings")) return true;
	if (role === "manager") return nextPath.startsWith("/manager");
	return nextPath.startsWith("/auditor");
}

/**
 * Pick a safe post-login route, falling back to the appropriate dashboard.
 */
function getRedirectAfterLogin(role: UserRole, nextParam: string | null): string {
	if (nextParam && isAllowedNextPath(role, nextParam)) return nextParam;
	return getDefaultDashboard(role);
}

/**
 * Create a local demo token for the current cookie-based scaffold.
 */
function createDemoAccessToken(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `demo_${Date.now()}`;
}

/**
 * Convert unknown submission errors into readable UI copy.
 */
function getSubmissionErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}
	return fallbackMessage;
}

/**
 * Reusable banner for success and error form states.
 */
function StatusBanner({ message }: Readonly<{ message: StatusMessage | null }>) {
	if (!message) {
		return null;
	}

	const className =
		message.tone === "success"
			? "rounded-field border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
			: "rounded-field border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive";

	return <p className={className}>{message.text}</p>;
}

export interface LoginFormProps {
	nextParam: string | null;
}

export function LoginForm({ nextParam }: Readonly<LoginFormProps>) {
	const router = useRouter();
	const [managerValues, setManagerValues] = React.useState<ManagerLoginValues>({
		email: "",
		password: ""
	});
	const [managerErrors, setManagerErrors] = React.useState<Partial<Record<keyof ManagerLoginValues, string>>>({});
	const [auditorValues, setAuditorValues] = React.useState<AuditorLoginValues>({
		auditorCode: ""
	});
	const [auditorErrors, setAuditorErrors] = React.useState<Partial<Record<keyof AuditorLoginValues, string>>>({});
	const [accessRequestValues, setAccessRequestValues] = React.useState<AuditorAccessRequestValues>({
		managerEmail: "",
		fullName: "",
		email: "",
		note: ""
	});
	const [accessRequestErrors, setAccessRequestErrors] = React.useState<
		Partial<Record<keyof AuditorAccessRequestValues, string>>
	>({});
	const [accessRequestMessage, setAccessRequestMessage] = React.useState<StatusMessage | null>(null);

	const auditorLoginMutation = useMutation({
		mutationFn: (auditorCode: string) => playspaceApi.auth.loginWithAuditorCode(auditorCode)
	});

	const auditorAccessRequestMutation = useMutation({
		mutationFn: (input: CreateAuditorSignupRequestInput) => playspaceApi.auth.requestAuditorAccess(input)
	});

	const handleManagerSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
		event.preventDefault();

		const parsedValues = managerLoginSchema.safeParse(managerValues);
		if (!parsedValues.success) {
			const nextErrors: Partial<Record<keyof ManagerLoginValues, string>> = {};
			const emailIssue = parsedValues.error.issues.find(issue => issue.path[0] === "email");
			const passwordIssue = parsedValues.error.issues.find(issue => issue.path[0] === "password");

			if (emailIssue?.message) {
				nextErrors.email = emailIssue.message;
			}
			if (passwordIssue?.message) {
				nextErrors.password = passwordIssue.message;
			}

			setManagerErrors(nextErrors);
			return;
		}

		setManagerErrors({});
		setBrowserAuthSession({
			role: "manager",
			accessToken: createDemoAccessToken(),
			managerEmail: parsedValues.data.email
		});

		const redirectPath = getRedirectAfterLogin("manager", nextParam);
		router.push(redirectPath);
	};

	const handleAuditorSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
		event.preventDefault();

		void (async () => {
			const parsedValues = auditorLoginSchema.safeParse(auditorValues);
			if (!parsedValues.success) {
				const auditorCodeIssue = parsedValues.error.issues.find(issue => issue.path[0] === "auditorCode");
				setAuditorErrors({
					auditorCode: auditorCodeIssue?.message ?? "Auditor code is invalid."
				});
				return;
			}

			setAuditorErrors({});

			try {
				const validatedSession = await auditorLoginMutation.mutateAsync(parsedValues.data.auditorCode);
				setBrowserAuthSession({
					role: "auditor",
					accessToken: createDemoAccessToken(),
					auditorCode: validatedSession.auditor_code
				});

				const redirectPath = getRedirectAfterLogin("auditor", nextParam);
				router.push(redirectPath);
			} catch (error) {
				setAuditorErrors({
					auditorCode: getSubmissionErrorMessage(error, "That auditor code could not be verified.")
				});
			}
		})();
	};

	const handleAuditorAccessRequestSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
		event.preventDefault();

		void (async () => {
			const parsedValues = auditorAccessRequestSchema.safeParse(accessRequestValues);
			if (!parsedValues.success) {
				const nextErrors: Partial<Record<keyof AuditorAccessRequestValues, string>> = {};
				const managerEmailIssue = parsedValues.error.issues.find(issue => issue.path[0] === "managerEmail");
				const fullNameIssue = parsedValues.error.issues.find(issue => issue.path[0] === "fullName");
				const emailIssue = parsedValues.error.issues.find(issue => issue.path[0] === "email");
				const noteIssue = parsedValues.error.issues.find(issue => issue.path[0] === "note");

				if (managerEmailIssue?.message) {
					nextErrors.managerEmail = managerEmailIssue.message;
				}
				if (fullNameIssue?.message) {
					nextErrors.fullName = fullNameIssue.message;
				}
				if (emailIssue?.message) {
					nextErrors.email = emailIssue.message;
				}
				if (noteIssue?.message) {
					nextErrors.note = noteIssue.message;
				}

				setAccessRequestErrors(nextErrors);
				setAccessRequestMessage(null);
				return;
			}

			setAccessRequestErrors({});
			setAccessRequestMessage(null);

			try {
				const requestResult = await auditorAccessRequestMutation.mutateAsync({
					managerEmail: parsedValues.data.managerEmail,
					fullName: parsedValues.data.fullName,
					email: parsedValues.data.email,
					note: parsedValues.data.note
				});

				setAccessRequestValues({
					managerEmail: "",
					fullName: "",
					email: "",
					note: ""
				});
				setAccessRequestMessage({
					tone: "success",
					text: `Request sent to ${requestResult.manager_email} for ${requestResult.full_name}. If approved, the manager can assign the work and share an auditor code.`
				});
			} catch (error) {
				setAccessRequestMessage({
					tone: "error",
					text: getSubmissionErrorMessage(error, "Your access request could not be sent. Please try again.")
				});
			}
		})();
	};

	return (
		<div className="min-h-dvh bg-background">
			<div className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-10">
				<div className="grid w-full gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Manager sign in</CardTitle>
							<CardDescription>
								Full-access dashboard: projects, places, auditors, and combined scores.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="grid gap-4" onSubmit={handleManagerSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="manager_email">Email</Label>
									<Input
										id="manager_email"
										type="email"
										autoComplete="email"
										placeholder="manager@company.com"
										value={managerValues.email}
										onChange={event => {
											const nextEmail = event.target.value;
											setManagerValues(currentValues => ({
												...currentValues,
												email: nextEmail
											}));
											setManagerErrors(currentErrors => ({
												...currentErrors,
												email: undefined
											}));
										}}
									/>
									{managerErrors.email ? (
										<p className="text-sm text-destructive">{managerErrors.email}</p>
									) : null}
								</div>

								<div className="grid gap-2">
									<Label htmlFor="manager_password">Password</Label>
									<Input
										id="manager_password"
										type="password"
										autoComplete="current-password"
										value={managerValues.password}
										onChange={event => {
											const nextPassword = event.target.value;
											setManagerValues(currentValues => ({
												...currentValues,
												password: nextPassword
											}));
											setManagerErrors(currentErrors => ({
												...currentErrors,
												password: undefined
											}));
										}}
									/>
									{managerErrors.password ? (
										<p className="text-sm text-destructive">{managerErrors.password}</p>
									) : null}
								</div>

								<Button type="submit">Sign in</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Auditor access</CardTitle>
							<CardDescription>
								Sign in with your approved auditor code, or request access for manager review.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<form className="grid gap-4" onSubmit={handleAuditorSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="auditor_code">Auditor code</Label>
									<Input
										id="auditor_code"
										autoComplete="off"
										placeholder="AUD0001"
										value={auditorValues.auditorCode}
										onChange={event => {
											const nextAuditorCode = event.target.value;
											setAuditorValues({ auditorCode: nextAuditorCode });
											setAuditorErrors({ auditorCode: undefined });
										}}
									/>
									{auditorErrors.auditorCode ? (
										<p className="text-sm text-destructive">{auditorErrors.auditorCode}</p>
									) : null}
								</div>

								<Button type="submit" disabled={auditorLoginMutation.isPending}>
									{auditorLoginMutation.isPending ? "Checking code..." : "Continue"}
								</Button>
							</form>

							<Separator />

							<div className="space-y-4">
								<div className="space-y-1">
									<h3 className="text-base font-medium text-foreground">Need a code?</h3>
									<p className="text-sm text-muted-foreground">
										Send a request to a manager by email. If they approve it, they will assign you
										to a project or place and share your auditor code.
									</p>
								</div>

								<StatusBanner message={accessRequestMessage} />

								<form className="grid gap-4" onSubmit={handleAuditorAccessRequestSubmit}>
									<div className="grid gap-2">
										<Label htmlFor="auditor_request_manager_email">Manager email</Label>
										<Input
											id="auditor_request_manager_email"
											type="email"
											autoComplete="email"
											placeholder="manager@example.com"
											value={accessRequestValues.managerEmail}
											onChange={event => {
												const managerEmail = event.target.value;
												setAccessRequestValues(currentValues => ({
													...currentValues,
													managerEmail
												}));
												setAccessRequestErrors(currentErrors => ({
													...currentErrors,
													managerEmail: undefined
												}));
											}}
										/>
										{accessRequestErrors.managerEmail ? (
											<p className="text-sm text-destructive">
												{accessRequestErrors.managerEmail}
											</p>
										) : null}
									</div>

									<div className="grid gap-2">
										<Label htmlFor="auditor_request_full_name">Full name</Label>
										<Input
											id="auditor_request_full_name"
											autoComplete="name"
											placeholder="Jordan Lee"
											value={accessRequestValues.fullName}
											onChange={event => {
												const fullName = event.target.value;
												setAccessRequestValues(currentValues => ({
													...currentValues,
													fullName
												}));
												setAccessRequestErrors(currentErrors => ({
													...currentErrors,
													fullName: undefined
												}));
											}}
										/>
										{accessRequestErrors.fullName ? (
											<p className="text-sm text-destructive">{accessRequestErrors.fullName}</p>
										) : null}
									</div>

									<div className="grid gap-2">
										<Label htmlFor="auditor_request_email">Email</Label>
										<Input
											id="auditor_request_email"
											type="email"
											autoComplete="email"
											placeholder="jordan@example.com"
											value={accessRequestValues.email}
											onChange={event => {
												const email = event.target.value;
												setAccessRequestValues(currentValues => ({
													...currentValues,
													email
												}));
												setAccessRequestErrors(currentErrors => ({
													...currentErrors,
													email: undefined
												}));
											}}
										/>
										{accessRequestErrors.email ? (
											<p className="text-sm text-destructive">{accessRequestErrors.email}</p>
										) : null}
									</div>

									<div className="grid gap-2">
										<Label htmlFor="auditor_request_note">Why are you requesting access?</Label>
										<Textarea
											id="auditor_request_note"
											placeholder="Share the project, location, or availability that the manager should know."
											value={accessRequestValues.note}
											onChange={event => {
												const note = event.target.value;
												setAccessRequestValues(currentValues => ({
													...currentValues,
													note
												}));
												setAccessRequestErrors(currentErrors => ({
													...currentErrors,
													note: undefined
												}));
											}}
										/>
										{accessRequestErrors.note ? (
											<p className="text-sm text-destructive">{accessRequestErrors.note}</p>
										) : null}
									</div>

									<Button
										type="submit"
										variant="outline"
										disabled={auditorAccessRequestMutation.isPending}>
										{auditorAccessRequestMutation.isPending
											? "Sending request..."
											: "Request access"}
									</Button>
								</form>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { z } from "zod";

import { setBrowserAuthSession } from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const managerLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(8)
});

type ManagerLoginValues = z.infer<typeof managerLoginSchema>;

const auditorLoginSchema = z.object({
	auditorCode: z.string().regex(/^[A-Za-z0-9]+$/, {
		message: "Auditor code must be alphanumeric."
	})
});

type AuditorLoginValues = z.infer<typeof auditorLoginSchema>;

function isSafeInternalPath(value: string): boolean {
	return value.startsWith("/") && !value.startsWith("//");
}

function getDefaultDashboard(role: UserRole): string {
	return role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
}

function isAllowedNextPath(role: UserRole, nextPath: string): boolean {
	if (!isSafeInternalPath(nextPath)) return false;
	if (nextPath.startsWith("/settings")) return true;
	if (role === "manager") return nextPath.startsWith("/manager");
	return nextPath.startsWith("/auditor");
}

function getRedirectAfterLogin(role: UserRole, nextParam: string | null): string {
	if (nextParam && isAllowedNextPath(role, nextParam)) return nextParam;
	return getDefaultDashboard(role);
}

function createDemoAccessToken(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `demo_${Date.now()}`;
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

	const handleManagerSubmit: React.FormEventHandler<HTMLFormElement> = event => {
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
			accessToken: createDemoAccessToken()
		});

		const redirectPath = getRedirectAfterLogin("manager", nextParam);
		router.push(redirectPath);
	};

	const handleAuditorSubmit: React.FormEventHandler<HTMLFormElement> = event => {
		event.preventDefault();

		const parsedValues = auditorLoginSchema.safeParse(auditorValues);
		if (!parsedValues.success) {
			const auditorCodeIssue = parsedValues.error.issues.find(issue => issue.path[0] === "auditorCode");
			setAuditorErrors({
				auditorCode: auditorCodeIssue?.message ?? "Auditor code is invalid."
			});
			return;
		}

		setAuditorErrors({});
		setBrowserAuthSession({
			role: "auditor",
			accessToken: createDemoAccessToken(),
			auditorCode: parsedValues.data.auditorCode
		});

		const redirectPath = getRedirectAfterLogin("auditor", nextParam);
		router.push(redirectPath);
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
										<p className="text-sm text-destructive">
											{managerErrors.email}
										</p>
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
										<p className="text-sm text-destructive">
											{managerErrors.password}
										</p>
									) : null}
								</div>

								<Button type="submit">Sign in</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Auditor sign in</CardTitle>
							<CardDescription>
								Limited access: execute assigned audits using your auditor code.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="grid gap-4" onSubmit={handleAuditorSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="auditor_code">Auditor code</Label>
									<Input
										id="auditor_code"
										autoComplete="off"
										placeholder="A1B2C3"
										value={auditorValues.auditorCode}
										onChange={event => {
											const nextAuditorCode = event.target.value;
											setAuditorValues({ auditorCode: nextAuditorCode });
											setAuditorErrors({ auditorCode: undefined });
										}}
									/>
									{auditorErrors.auditorCode ? (
										<p className="text-sm text-destructive">
											{auditorErrors.auditorCode}
										</p>
									) : null}
								</div>

								<Button type="submit">Continue</Button>
							</form>

							<Separator className="my-6" />

							<p className="text-sm text-muted-foreground">
								Auditors are identified strictly by code. No real names are displayed in the UI.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

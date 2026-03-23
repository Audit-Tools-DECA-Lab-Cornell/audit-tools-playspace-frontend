"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { z } from "zod";

import { buildMockAuthSession, resolvePostLoginPath } from "@/lib/auth/auth-mode";
import { setBrowserAuthSession } from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";
import { resolveManagerAccountId } from "@/lib/auth/demo-identities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const adminLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(8)
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

const managerLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(8)
});

type ManagerLoginValues = z.infer<typeof managerLoginSchema>;

interface AuditorLoginValues {
	auditorCode: string;
}

export interface LoginFormProps {
	nextParam: string | null;
	isMockMode: boolean;
}

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0];

function getMockLoginHref(role: UserRole, nextParam: string | null): string {
	const searchParams = new URLSearchParams({
		role
	});

	if (nextParam) {
		searchParams.set("next", nextParam);
	}

	return `/api/mock-login?${searchParams.toString()}`;
}

export function LoginForm({ nextParam, isMockMode }: Readonly<LoginFormProps>) {
	const router = useRouter();
	const t = useTranslations("login");
	const [adminValues, setAdminValues] = React.useState<AdminLoginValues>({
		email: "",
		password: ""
	});
	const [adminErrors, setAdminErrors] = React.useState<Partial<Record<keyof AdminLoginValues, string>>>({});
	const [managerValues, setManagerValues] = React.useState<ManagerLoginValues>({
		email: "",
		password: ""
	});
	const [managerErrors, setManagerErrors] = React.useState<Partial<Record<keyof ManagerLoginValues, string>>>({});
	const [auditorValues, setAuditorValues] = React.useState<AuditorLoginValues>({
		auditorCode: ""
	});
	const [auditorErrors, setAuditorErrors] = React.useState<Partial<Record<keyof AuditorLoginValues, string>>>({});

	const auditorLoginSchema = React.useMemo(() => {
		return z.object({
			auditorCode: z.string().regex(/^[a-zA-Z0-9-_]+$/, {
				message: t("validation.auditorCodeAlphanumeric")
			})
		});
	}, [t]);

	const handleMockLogin = React.useCallback(
		(role: UserRole) => {
			globalThis.window.location.assign(getMockLoginHref(role, nextParam));
		},
		[nextParam]
	);

	const handleAdminSubmit = (event: FormSubmitEvent) => {
		event.preventDefault();

		const parsedValues = adminLoginSchema.safeParse(adminValues);
		if (!parsedValues.success) {
			const nextErrors: Partial<Record<keyof AdminLoginValues, string>> = {};
			const emailIssue = parsedValues.error.issues.find(issue => issue.path[0] === "email");
			const passwordIssue = parsedValues.error.issues.find(issue => issue.path[0] === "password");

			if (emailIssue?.message) {
				nextErrors.email = emailIssue.message;
			}
			if (passwordIssue?.message) {
				nextErrors.password = passwordIssue.message;
			}
			setAdminErrors(nextErrors);
			return;
		}

		setAdminErrors({});
		setBrowserAuthSession(buildMockAuthSession("admin"));

		const redirectPath = resolvePostLoginPath("admin", nextParam);
		router.push(redirectPath);
	};

	const handleManagerSubmit = (event: FormSubmitEvent) => {
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
		setBrowserAuthSession(
			buildMockAuthSession("manager", {
				accountId: resolveManagerAccountId(parsedValues.data.email)
			})
		);

		const redirectPath = resolvePostLoginPath("manager", nextParam);
		router.push(redirectPath);
	};

	const handleAuditorSubmit = (event: FormSubmitEvent) => {
		event.preventDefault();

		const parsedValues = auditorLoginSchema.safeParse(auditorValues);
		if (!parsedValues.success) {
			const auditorCodeIssue = parsedValues.error.issues.find(issue => issue.path[0] === "auditorCode");
			setAuditorErrors({
				auditorCode: auditorCodeIssue?.message ?? t("validation.auditorCodeInvalid")
			});
			return;
		}

		setAuditorErrors({});
		setBrowserAuthSession(
			buildMockAuthSession("auditor", {
				auditorCode: parsedValues.data.auditorCode
			})
		);

		const redirectPath = resolvePostLoginPath("auditor", nextParam);
		router.push(redirectPath);
	};

	return (
		<div className="min-h-dvh bg-background">
			<div className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-10">
				<div className="w-full space-y-6">
					{isMockMode ? (
						<Card>
							<CardHeader>
								<CardTitle>Mock Sign In</CardTitle>
								<CardDescription>Fast role-based access for local quality testing.</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-3">
								<Button type="button" onClick={() => handleMockLogin("admin")}>
									Continue as Admin
								</Button>
								<Button type="button" variant="secondary" onClick={() => handleMockLogin("manager")}>
									Continue as Manager
								</Button>
								<Button type="button" variant="outline" onClick={() => handleMockLogin("auditor")}>
									Continue as Auditor
								</Button>
							</CardContent>
						</Card>
					) : null}

					<div className="grid w-full gap-6 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>{t("admin.title")}</CardTitle>
							<CardDescription>{t("admin.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="grid gap-4" onSubmit={handleAdminSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="admin_email">{t("fields.email")}</Label>
									<Input
										id="admin_email"
										type="email"
										autoComplete="email"
										placeholder={t("admin.emailPlaceholder")}
										value={adminValues.email}
										onChange={event => {
											const nextEmail = event.target.value;
											setAdminValues(currentValues => ({
												...currentValues,
												email: nextEmail
											}));
											setAdminErrors(currentErrors => ({
												...currentErrors,
												email: undefined
											}));
										}}
									/>
									{adminErrors.email ? (
										<p className="text-sm text-destructive">{adminErrors.email}</p>
									) : null}
								</div>

								<div className="grid gap-2">
									<Label htmlFor="admin_password">{t("fields.password")}</Label>
									<Input
										id="admin_password"
										type="password"
										autoComplete="current-password"
										value={adminValues.password}
										onChange={event => {
											const nextPassword = event.target.value;
											setAdminValues(currentValues => ({
												...currentValues,
												password: nextPassword
											}));
											setAdminErrors(currentErrors => ({
												...currentErrors,
												password: undefined
											}));
										}}
									/>
									{adminErrors.password ? (
										<p className="text-sm text-destructive">{adminErrors.password}</p>
									) : null}
								</div>

								<Button type="submit">{t("actions.signIn")}</Button>
								<p className="text-xs text-muted-foreground">
									{t("admin.demoLabel")}{" "}
									<span className="font-mono">playspace.admin@example.org</span>
								</p>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("manager.title")}</CardTitle>
							<CardDescription>{t("manager.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="grid gap-4" onSubmit={handleManagerSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="manager_email">{t("fields.email")}</Label>
									<Input
										id="manager_email"
										type="email"
										autoComplete="email"
										placeholder={t("manager.emailPlaceholder")}
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
									<Label htmlFor="manager_password">{t("fields.password")}</Label>
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

								<Button type="submit">{t("actions.signIn")}</Button>
								<p className="text-xs text-muted-foreground">
									{t("manager.demoLabel")} <span className="font-mono">manager@example.org</span>{" "}
									{t("manager.demoOr")}{" "}
									<span className="font-mono">canterbury.manager@example.org</span>
								</p>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("auditor.title")}</CardTitle>
							<CardDescription>{t("auditor.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="grid gap-4" onSubmit={handleAuditorSubmit}>
								<div className="grid gap-2">
									<Label htmlFor="auditor_code">{t("fields.auditorCode")}</Label>
									<Input
										id="auditor_code"
										autoComplete="off"
										placeholder={t("auditor.codePlaceholder")}
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

								<Button type="submit">{t("actions.continue")}</Button>
							</form>

							<Separator className="my-6" />

							<p className="text-sm text-muted-foreground">{t("auditor.note")}</p>
							<p className="text-xs text-muted-foreground">
								{t("auditor.demoLabel")} <span className="font-mono">AKL-01</span>,{" "}
								<span className="font-mono">AKL-02</span>, or <span className="font-mono">CHC-01</span>
							</p>
						</CardContent>
					</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

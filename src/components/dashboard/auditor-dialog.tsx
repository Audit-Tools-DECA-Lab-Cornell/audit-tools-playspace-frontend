"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { CheckCircle2Icon, ClipboardCopyIcon, LockIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toNullableString } from "./form-utils";
import { getValidationMessage, getZodFieldErrors } from "./tanstack-form-utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const auditorDialogSchema = z.object({
	email: z
		.string()
		.trim()
		.refine(value => EMAIL_PATTERN.test(value), "Enter a valid email address."),
	fullName: z.string().trim().min(1, "Full name is required."),
	role: z.string(),
	ageRange: z.string(),
	gender: z.string(),
	country: z.string()
});

type AuditorDialogFormValues = z.infer<typeof auditorDialogSchema>;

export interface AuditorDialogInitialValues {
	email?: string | null;
	fullName?: string | null;
	/** Existing auditor code displayed read-only in edit mode. */
	auditorCode?: string | null;
	role?: string | null;
	ageRange?: string | null;
	gender?: string | null;
	country?: string | null;
}

export interface AuditorDialogPayload {
	email: string;
	full_name: string;
	role: string | null;
	age_range: string | null;
	gender: string | null;
	country: string | null;
}

/**
 * Returned by the create-mode `onSubmit` handler after a successful invite.
 * When present, the dialog transitions to a confirmation panel instead of closing.
 */
export interface AuditorCreatedSummary {
	/** The auto-generated auditor code assigned by the backend. */
	auditorCode: string;
	/** The email address the invitation was sent to. */
	email: string;
}

export interface AuditorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Controls whether the auditor code badge is shown (edit) or hidden (create). */
	mode: "create" | "edit";
	title: string;
	description: string;
	submitLabel: string;
	initialValues?: AuditorDialogInitialValues;
	isPending?: boolean;
	/**
	 * Called when the form is submitted.
	 * - **Create mode**: return an `AuditorCreatedSummary` to display the confirmation panel.
	 * - **Edit mode**: return `undefined` (or `void`) to close the dialog normally.
	 */
	onSubmit: (payload: AuditorDialogPayload) => Promise<AuditorCreatedSummary | undefined>;
}

/**
 * Convert schema issues into TanStack Form field error strings.
 */
function validateAuditorValues(
	values: AuditorDialogFormValues
): Partial<Record<keyof AuditorDialogFormValues, string>> | undefined {
	const parsedValues = auditorDialogSchema.safeParse(values);
	if (parsedValues.success) {
		return undefined;
	}

	return getZodFieldErrors<keyof AuditorDialogFormValues>(parsedValues.error.issues);
}

function getDefaultValues(initialValues?: AuditorDialogInitialValues): AuditorDialogFormValues {
	return {
		email: initialValues?.email ?? "",
		fullName: initialValues?.fullName ?? "",
		role: initialValues?.role ?? "",
		ageRange: initialValues?.ageRange ?? "",
		gender: initialValues?.gender ?? "",
		country: initialValues?.country ?? ""
	};
}

/**
 * Shared auditor create/edit dialog with privacy-safe field labels.
 *
 * - **Create mode**: auditor code is auto-generated from the organisation name and
 *   existing codes. The field is hidden from the user.
 * - **Edit mode**: auditor code is displayed as a read-only badge. It cannot be changed.
 */
export function AuditorDialog({
	open,
	onOpenChange,
	mode,
	title,
	description,
	submitLabel,
	initialValues,
	isPending = false,
	onSubmit
}: Readonly<AuditorDialogProps>) {
	const [submitError, setSubmitError] = React.useState<string | null>(null);
	const [createdSummary, setCreatedSummary] = React.useState<AuditorCreatedSummary | null>(null);
	const [codeCopied, setCodeCopied] = React.useState(false);
	const isCreateMode = mode === "create";
	const initialEmail = initialValues?.email ?? "";
	const initialFullName = initialValues?.fullName ?? "";
	const initialAuditorCode = initialValues?.auditorCode ?? "";
	const initialRole = initialValues?.role ?? "";
	const initialAgeRange = initialValues?.ageRange ?? "";
	const initialGender = initialValues?.gender ?? "";
	const initialCountry = initialValues?.country ?? "";
	const defaultValues = React.useMemo(
		() =>
			getDefaultValues({
				email: initialEmail,
				fullName: initialFullName,
				role: initialRole,
				ageRange: initialAgeRange,
				gender: initialGender,
				country: initialCountry
			}),
		[initialAgeRange, initialCountry, initialEmail, initialFullName, initialGender, initialRole]
	);
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => validateAuditorValues(value)
		},
		onSubmit: async ({ value }) => {
			try {
				setSubmitError(null);
				const summary = await onSubmit({
					email: value.email.trim(),
					full_name: value.fullName.trim(),
					role: toNullableString(value.role),
					age_range: toNullableString(value.ageRange),
					gender: toNullableString(value.gender),
					country: toNullableString(value.country)
				});
				if (summary !== undefined) {
					setCreatedSummary(summary);
				} else {
					onOpenChange(false);
				}
			} catch (error) {
				setSubmitError(error instanceof Error ? error.message : "Unable to save auditor profile.");
			}
		}
	});

	React.useEffect(() => {
		if (!open) {
			return;
		}

		form.reset(defaultValues);
		setSubmitError(null);
		setCreatedSummary(null);
		setCodeCopied(false);
	}, [defaultValues, form, open]);

	/** Copy auditor code to clipboard and briefly flash a "Copied" label. */
	function handleCopyCode(code: string) {
		void navigator.clipboard.writeText(code).then(() => {
			setCodeCopied(true);
			setTimeout(() => setCodeCopied(false), 2000);
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto [scrollbar-gutter:stable] sm:max-w-2xl">
				{createdSummary !== null ? (
					<AuditorCreatedConfirmation
						summary={createdSummary}
						codeCopied={codeCopied}
						onCopyCode={handleCopyCode}
						onDone={() => onOpenChange(false)}
					/>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription>{description}</DialogDescription>
						</DialogHeader>
						<form
							className="space-y-5"
							onSubmit={async event => {
								event.preventDefault();
								event.stopPropagation();
								await form.handleSubmit();
							}}>
							<p className="text-xs text-muted-foreground">
								Fields marked with{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>{" "}
								are required.
							</p>
							<div className="grid gap-6 md:grid-cols-2 items-start">
								<form.Field name="email">
									{field => {
										const validationMessage = getValidationMessage(field.state.meta.errors);

										return (
											<div className="grid gap-2 items-start">
												<Label htmlFor={field.name}>
													Email{" "}
													<span className="text-destructive" aria-hidden="true">
														*
													</span>
												</Label>
												<Input
													id={field.name}
													name="auditorEmail"
													type="email"
													autoComplete="email"
													spellCheck={false}
													placeholder="jane@organization.com"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={event => field.handleChange(event.target.value)}
													aria-invalid={Boolean(validationMessage)}
													aria-required="true"
												/>
												<p className="min-h-5 text-sm text-destructive" aria-live="polite">
													{validationMessage}
												</p>
											</div>
										);
									}}
								</form.Field>
								{!isCreateMode && (
									<div className="grid gap-2 items-start">
										<Label>Auditor code</Label>
										<div
											className="flex h-9 select-all items-center gap-2 rounded-md border border-input bg-muted px-3 font-mono text-sm tracking-wider text-muted-foreground"
											aria-label={`Auditor code: ${initialAuditorCode} (read-only)`}
											aria-readonly="true"
											tabIndex={-1}>
											<LockIcon className="size-3.5 shrink-0 opacity-50" aria-hidden="true" />
											{initialAuditorCode}
										</div>
										<p className="text-xs text-muted-foreground">
											Assigned automatically and cannot be changed.
										</p>
									</div>
								)}
								<form.Field name="fullName">
									{field => {
										const validationMessage = getValidationMessage(field.state.meta.errors);

										return (
											<div className="grid gap-2 items-start md:col-span-2">
												<Label htmlFor={field.name}>
													Full name{" "}
													<span className="text-destructive" aria-hidden="true">
														*
													</span>
												</Label>
												<Input
													id={field.name}
													name="auditorFullName"
													autoComplete="name"
													placeholder="Jane Smith"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={event => field.handleChange(event.target.value)}
													aria-invalid={Boolean(validationMessage)}
													aria-required="true"
												/>
												<p className="min-h-5 text-sm text-destructive" aria-live="polite">
													{validationMessage}
												</p>
											</div>
										);
									}}
								</form.Field>
								<form.Field name="role">
									{field => (
										<div className="grid gap-2 items-start">
											<Label htmlFor={field.name}>
												Role/Profession{" "}
												<span className="text-xs font-normal text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id={field.name}
												placeholder="e.g. Field Researcher"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={event => field.handleChange(event.target.value)}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="country">
									{field => (
										<div className="grid gap-2 items-start">
											<Label htmlFor={field.name}>
												Country{" "}
												<span className="text-xs font-normal text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id={field.name}
												placeholder="e.g. Canada"
												autoComplete="country-name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={event => field.handleChange(event.target.value)}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="ageRange">
									{field => (
										<div className="grid gap-2 items-start">
											<Label htmlFor={field.name}>
												Age range{" "}
												<span className="text-xs font-normal text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id={field.name}
												placeholder="e.g. 25–34"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={event => field.handleChange(event.target.value)}
											/>
											<p className="text-xs text-muted-foreground">
												Used for demographic reporting only.
											</p>
										</div>
									)}
								</form.Field>
								<form.Field name="gender">
									{field => (
										<div className="grid gap-2 items-start">
											<Label htmlFor={field.name}>
												Gender{" "}
												<span className="text-xs font-normal text-muted-foreground">
													(optional)
												</span>
											</Label>
											<Input
												id={field.name}
												placeholder="e.g. Female, Male, Non-binary"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={event => field.handleChange(event.target.value)}
											/>
											<p className="text-xs text-muted-foreground">
												Used for demographic reporting only.
											</p>
										</div>
									)}
								</form.Field>
							</div>
							{submitError ? (
								<p aria-live="polite" className="text-sm text-destructive">
									{submitError}
								</p>
							) : null}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									disabled={isPending}
									onClick={() => onOpenChange(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={isPending}>
									{submitLabel}
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// Confirmation panel
// ---------------------------------------------------------------------------

interface AuditorCreatedConfirmationProps {
	summary: AuditorCreatedSummary;
	codeCopied: boolean;
	onCopyCode: (code: string) => void;
	onDone: () => void;
}

/**
 * Shown inside the dialog after a new auditor is successfully invited.
 * Displays the assigned auditor code and the email the invitation was sent to.
 */
function AuditorCreatedConfirmation({
	summary,
	codeCopied,
	onCopyCode,
	onDone
}: Readonly<AuditorCreatedConfirmationProps>) {
	return (
		<div className="flex flex-col gap-6 py-2" role="status" aria-live="polite">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
					<CheckCircle2Icon className="size-7" aria-hidden="true" />
				</span>
				<div>
					<DialogTitle className="text-lg font-semibold">Auditor invited</DialogTitle>
					<DialogDescription className="mt-1 text-sm text-muted-foreground">
						The account is ready. Share the details below so the auditor can sign in.
					</DialogDescription>
				</div>
			</div>

			{/* Detail rows */}
			<div className="rounded-lg border border-border bg-muted/40 divide-y divide-border">
				{/* Email row */}
				<div className="flex items-start gap-3 px-4 py-3">
					<MailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					<div className="min-w-0 flex-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
							Invitation sent to
						</p>
						<p className="truncate text-sm font-medium">{summary.email}</p>
					</div>
					<span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
						Awaiting sign-up
					</span>
				</div>

				{/* Auditor code row */}
				<div className="flex items-center gap-3 px-4 py-3">
					<LockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					<div className="min-w-0 flex-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
							Auditor code
						</p>
						<p className="font-mono text-sm font-medium tracking-wider">{summary.auditorCode}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8 shrink-0 gap-1.5 text-xs"
						onClick={() => onCopyCode(summary.auditorCode)}
						aria-label="Copy auditor code">
						<ClipboardCopyIcon className="size-3.5" aria-hidden="true" />
						{codeCopied ? "Copied!" : "Copy"}
					</Button>
				</div>
			</div>

			<p className="text-center text-xs text-muted-foreground">
				An email with a temporary password has been sent. The auditor must complete sign-up before they can
				access the platform.
			</p>

			<DialogFooter>
				<Button type="button" onClick={onDone} className="w-full sm:w-auto">
					Done
				</Button>
			</DialogFooter>
		</div>
	);
}

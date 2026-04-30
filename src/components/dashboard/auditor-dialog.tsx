"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { LockIcon } from "lucide-react";

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
	onSubmit: (payload: AuditorDialogPayload) => Promise<void>;
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
				await onSubmit({
					email: value.email.trim(),
					full_name: value.fullName.trim(),
					role: toNullableString(value.role),
					age_range: toNullableString(value.ageRange),
					gender: toNullableString(value.gender),
					country: toNullableString(value.country)
				});
				onOpenChange(false);
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
	}, [defaultValues, form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto [scrollbar-gutter:stable] sm:max-w-2xl">
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
										<span className="text-xs font-normal text-muted-foreground">(optional)</span>
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
										<span className="text-xs font-normal text-muted-foreground">(optional)</span>
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
										<span className="text-xs font-normal text-muted-foreground">(optional)</span>
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
										<span className="text-xs font-normal text-muted-foreground">(optional)</span>
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
			</DialogContent>
		</Dialog>
	);
}

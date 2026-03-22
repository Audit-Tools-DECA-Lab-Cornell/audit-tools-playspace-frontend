"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

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
	auditorCode: z.string().trim().min(1, "Auditor code is required."),
	role: z.string(),
	ageRange: z.string(),
	gender: z.string(),
	country: z.string()
});

type AuditorDialogFormValues = z.infer<typeof auditorDialogSchema>;

export interface AuditorDialogInitialValues {
	email?: string | null;
	fullName?: string | null;
	auditorCode?: string | null;
	role?: string | null;
	ageRange?: string | null;
	gender?: string | null;
	country?: string | null;
}

export interface AuditorDialogPayload {
	email: string;
	full_name: string;
	auditor_code: string;
	role: string | null;
	age_range: string | null;
	gender: string | null;
	country: string | null;
}

export interface AuditorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
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
		auditorCode: initialValues?.auditorCode ?? "",
		role: initialValues?.role ?? "",
		ageRange: initialValues?.ageRange ?? "",
		gender: initialValues?.gender ?? "",
		country: initialValues?.country ?? ""
	};
}

/**
 * Shared auditor create/edit dialog with privacy-safe field labels.
 */
export function AuditorDialog({
	open,
	onOpenChange,
	title,
	description,
	submitLabel,
	initialValues,
	isPending = false,
	onSubmit
}: Readonly<AuditorDialogProps>) {
	const [submitError, setSubmitError] = React.useState<string | null>(null);
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
				auditorCode: initialAuditorCode,
				role: initialRole,
				ageRange: initialAgeRange,
				gender: initialGender,
				country: initialCountry
			}),
		[initialAgeRange, initialAuditorCode, initialCountry, initialEmail, initialFullName, initialGender, initialRole]
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
					auditor_code: value.auditorCode.trim(),
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
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
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
					<div className="grid gap-4 md:grid-cols-2">
						<form.Field name="email">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name="auditorEmail"
											type="email"
											autoComplete="email"
											spellCheck={false}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={event => field.handleChange(event.target.value)}
											aria-invalid={Boolean(validationMessage)}
										/>
										{validationMessage ? (
											<p className="text-sm text-destructive">{validationMessage}</p>
										) : null}
									</div>
								);
							}}
						</form.Field>
						<form.Field name="auditorCode">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Auditor code</Label>
										<Input
											id={field.name}
											name="auditorCode"
											autoComplete="off"
											spellCheck={false}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={event => field.handleChange(event.target.value)}
											aria-invalid={Boolean(validationMessage)}
										/>
										{validationMessage ? (
											<p className="text-sm text-destructive">{validationMessage}</p>
										) : null}
									</div>
								);
							}}
						</form.Field>
						<form.Field name="fullName">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2 md:col-span-2">
										<Label htmlFor={field.name}>Full name</Label>
										<Input
											id={field.name}
											name="auditorFullName"
											autoComplete="name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={event => field.handleChange(event.target.value)}
											aria-invalid={Boolean(validationMessage)}
										/>
										{validationMessage ? (
											<p className="text-sm text-destructive">{validationMessage}</p>
										) : null}
									</div>
								);
							}}
						</form.Field>
						<form.Field name="role">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Role</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="country">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Country</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="ageRange">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Age range</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="gender">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Gender</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
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

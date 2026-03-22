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
import { Textarea } from "@/components/ui/textarea";

import { getValidationMessage, getZodFieldErrors } from "./tanstack-form-utils";
import { toNullableInteger, toNullableString, toTrimmedList } from "./form-utils";

const WHOLE_NUMBER_PATTERN = /^\d+$/;

/**
 * Safely parse serialized place types back into a string list.
 */
function parsePlaceTypesJson(value: string): string[] {
	try {
		const parsedValue: unknown = JSON.parse(value);
		return Array.isArray(parsedValue) ? parsedValue.filter((item): item is string => typeof item === "string") : [];
	} catch {
		return [];
	}
}

const projectDialogSchema = z
	.object({
		name: z.string().trim().min(1, "Project name is required."),
		overview: z.string(),
		placeTypes: z.string(),
		startDate: z.string(),
		endDate: z.string(),
		estimatedPlaces: z
			.string()
			.refine(
				value => value.trim().length === 0 || WHOLE_NUMBER_PATTERN.test(value),
				"Estimated places must be a whole number."
			),
		estimatedAuditors: z
			.string()
			.refine(
				value => value.trim().length === 0 || WHOLE_NUMBER_PATTERN.test(value),
				"Estimated auditors must be a whole number."
			),
		auditorDescription: z.string()
	})
	.superRefine((values, context) => {
		if (values.startDate && values.endDate && values.startDate > values.endDate) {
			context.addIssue({
				code: "custom",
				path: ["endDate"],
				message: "End date must be on or after the start date."
			});
		}
	});

type ProjectDialogFormValues = z.infer<typeof projectDialogSchema>;

export interface ProjectDialogInitialValues {
	name?: string;
	overview?: string | null;
	placeTypes?: string[];
	startDate?: string | null;
	endDate?: string | null;
	estimatedPlaces?: number | null;
	estimatedAuditors?: number | null;
	auditorDescription?: string | null;
}

export interface ProjectDialogPayload {
	name: string;
	overview: string | null;
	place_types: string[];
	start_date: string | null;
	end_date: string | null;
	est_places: number | null;
	est_auditors: number | null;
	auditor_description: string | null;
}

export interface ProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	submitLabel: string;
	initialValues?: ProjectDialogInitialValues;
	isPending?: boolean;
	onSubmit: (payload: ProjectDialogPayload) => Promise<void>;
}

/**
 * Convert schema issues into TanStack Form field error strings.
 */
function validateProjectValues(
	values: ProjectDialogFormValues
): Partial<Record<keyof ProjectDialogFormValues, string>> | undefined {
	const parsedValues = projectDialogSchema.safeParse(values);
	if (parsedValues.success) {
		return undefined;
	}

	return getZodFieldErrors<keyof ProjectDialogFormValues>(parsedValues.error.issues);
}

function getDefaultValues(initialValues?: ProjectDialogInitialValues): ProjectDialogFormValues {
	return {
		name: initialValues?.name ?? "",
		overview: initialValues?.overview ?? "",
		placeTypes: initialValues?.placeTypes?.join(", ") ?? "",
		startDate: initialValues?.startDate ?? "",
		endDate: initialValues?.endDate ?? "",
		estimatedPlaces:
			initialValues?.estimatedPlaces === null || initialValues?.estimatedPlaces === undefined
				? ""
				: String(initialValues.estimatedPlaces),
		estimatedAuditors:
			initialValues?.estimatedAuditors === null || initialValues?.estimatedAuditors === undefined
				? ""
				: String(initialValues.estimatedAuditors),
		auditorDescription: initialValues?.auditorDescription ?? ""
	};
}

/**
 * Shared project create/edit dialog with zod validation and enterprise field grouping.
 */
export function ProjectDialog({
	open,
	onOpenChange,
	title,
	description,
	submitLabel,
	initialValues,
	isPending = false,
	onSubmit
}: Readonly<ProjectDialogProps>) {
	const [submitError, setSubmitError] = React.useState<string | null>(null);
	const initialName = initialValues?.name ?? "";
	const initialOverview = initialValues?.overview ?? "";
	const initialPlaceTypesJson = JSON.stringify(initialValues?.placeTypes ?? []);
	const initialStartDate = initialValues?.startDate ?? "";
	const initialEndDate = initialValues?.endDate ?? "";
	const initialEstimatedPlaces = initialValues?.estimatedPlaces ?? null;
	const initialEstimatedAuditors = initialValues?.estimatedAuditors ?? null;
	const initialAuditorDescription = initialValues?.auditorDescription ?? "";
	const defaultValues = React.useMemo(
		() =>
			getDefaultValues({
				name: initialName,
				overview: initialOverview,
				placeTypes: parsePlaceTypesJson(initialPlaceTypesJson),
				startDate: initialStartDate,
				endDate: initialEndDate,
				estimatedPlaces: initialEstimatedPlaces,
				estimatedAuditors: initialEstimatedAuditors,
				auditorDescription: initialAuditorDescription
			}),
		[
			initialAuditorDescription,
			initialEndDate,
			initialEstimatedAuditors,
			initialEstimatedPlaces,
			initialName,
			initialOverview,
			initialPlaceTypesJson,
			initialStartDate
		]
	);
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => validateProjectValues(value)
		},
		onSubmit: async ({ value }) => {
			try {
				setSubmitError(null);
				await onSubmit({
					name: value.name.trim(),
					overview: toNullableString(value.overview),
					place_types: toTrimmedList(value.placeTypes),
					start_date: toNullableString(value.startDate),
					end_date: toNullableString(value.endDate),
					est_places: toNullableInteger(value.estimatedPlaces),
					est_auditors: toNullableInteger(value.estimatedAuditors),
					auditor_description: toNullableString(value.auditorDescription)
				});
				onOpenChange(false);
			} catch (error) {
				setSubmitError(error instanceof Error ? error.message : "Unable to save project.");
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
						<form.Field name="name">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2 md:col-span-2">
										<Label htmlFor={field.name}>Project name</Label>
										<Input
											id={field.name}
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
						<form.Field name="overview">
							{field => (
								<div className="grid gap-2 md:col-span-2">
									<Label htmlFor={field.name}>Overview</Label>
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="placeTypes">
							{field => (
								<div className="grid gap-2 md:col-span-2">
									<Label htmlFor={field.name}>Place types</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
										placeholder="Playground, Pocket park, Community green"
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="startDate">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Start date</Label>
									<Input
										id={field.name}
										type="date"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="endDate">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>End date</Label>
										<Input
											id={field.name}
											type="date"
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
						<form.Field name="estimatedPlaces">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Estimated places</Label>
										<Input
											id={field.name}
											inputMode="numeric"
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
						<form.Field name="estimatedAuditors">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Estimated auditors</Label>
										<Input
											id={field.name}
											inputMode="numeric"
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
						<form.Field name="auditorDescription">
							{field => (
								<div className="grid gap-2 md:col-span-2">
									<Label htmlFor={field.name}>Auditor guidance</Label>
									<Textarea
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

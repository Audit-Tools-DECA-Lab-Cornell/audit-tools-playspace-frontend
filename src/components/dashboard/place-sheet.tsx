"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toNullableInteger, toNullableNumber, toNullableString } from "./form-utils";
import { getValidationMessage, getZodFieldErrors } from "./tanstack-form-utils";

const WHOLE_NUMBER_PATTERN = /^\d+$/;

const PLACE_TYPE_OPTIONS = [
	"Playground",
	"Park",
	"Schoolyard",
	"Community Center",
	"Sports Field",
	"Other"
] as const;

const placeSheetSchema = z
	.object({
		name: z.string().trim().min(1, "Place name is required."),
		address: z.string(),
		placeType: z.string(),
		city: z.string(),
		province: z.string(),
		country: z.string(),
		latitude: z
			.string()
			.refine(
				value => value.trim().length === 0 || !Number.isNaN(Number(value)),
				"Latitude must be a valid number."
			),
		longitude: z
			.string()
			.refine(
				value => value.trim().length === 0 || !Number.isNaN(Number(value)),
				"Longitude must be a valid number."
			),
		startDate: z.string(),
		endDate: z.string(),
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

type PlaceSheetFormValues = z.infer<typeof placeSheetSchema>;

export interface PlaceSheetInitialValues {
	name?: string;
	placeType?: string | null;
	city?: string | null;
	province?: string | null;
	country?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	estimatedAuditors?: number | null;
	auditorDescription?: string | null;
}

export interface PlaceSheetPayload {
	name: string;
	place_type: string | null;
	city: string | null;
	province: string | null;
	country: string | null;
	lat: number | null;
	lng: number | null;
	start_date: string | null;
	end_date: string | null;
	est_auditors: number | null;
	auditor_description: string | null;
}

export interface PlaceSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	submitLabel: string;
	initialValues?: PlaceSheetInitialValues;
	isPending?: boolean;
	onSubmit: (payload: PlaceSheetPayload) => Promise<void>;
}

/**
 * Convert schema issues into TanStack Form field error strings.
 */
function validatePlaceValues(
	values: PlaceSheetFormValues
): Partial<Record<keyof PlaceSheetFormValues, string>> | undefined {
	const parsedValues = placeSheetSchema.safeParse(values);
	if (parsedValues.success) {
		return undefined;
	}

	return getZodFieldErrors<keyof PlaceSheetFormValues>(parsedValues.error.issues);
}

function getDefaultValues(initialValues?: PlaceSheetInitialValues): PlaceSheetFormValues {
	return {
		name: initialValues?.name ?? "",
		address: "",
		placeType: initialValues?.placeType ?? "",
		city: initialValues?.city ?? "",
		province: initialValues?.province ?? "",
		country: initialValues?.country ?? "",
		latitude:
			initialValues?.latitude === null || initialValues?.latitude === undefined
				? ""
				: String(initialValues.latitude),
		longitude:
			initialValues?.longitude === null || initialValues?.longitude === undefined
				? ""
				: String(initialValues.longitude),
		startDate: initialValues?.startDate ?? "",
		endDate: initialValues?.endDate ?? "",
		estimatedAuditors:
			initialValues?.estimatedAuditors === null || initialValues?.estimatedAuditors === undefined
				? ""
				: String(initialValues.estimatedAuditors),
		auditorDescription: initialValues?.auditorDescription ?? ""
	};
}

/**
 * Shared place create/edit sheet for the operational workspace.
 */
export function PlaceSheet({
	open,
	onOpenChange,
	title,
	description,
	submitLabel,
	initialValues,
	isPending = false,
	onSubmit
}: Readonly<PlaceSheetProps>) {
	const [submitError, setSubmitError] = React.useState<string | null>(null);
	const [isGeocoding, setIsGeocoding] = React.useState(false);
	const initialName = initialValues?.name ?? "";
	const initialPlaceType = initialValues?.placeType ?? "";
	const initialCity = initialValues?.city ?? "";
	const initialProvince = initialValues?.province ?? "";
	const initialCountry = initialValues?.country ?? "";
	const initialLatitude = initialValues?.latitude ?? null;
	const initialLongitude = initialValues?.longitude ?? null;
	const initialStartDate = initialValues?.startDate ?? "";
	const initialEndDate = initialValues?.endDate ?? "";
	const initialEstimatedAuditors = initialValues?.estimatedAuditors ?? null;
	const initialAuditorDescription = initialValues?.auditorDescription ?? "";
	const defaultValues = React.useMemo(
		() =>
			getDefaultValues({
				name: initialName,
				placeType: initialPlaceType,
				city: initialCity,
				province: initialProvince,
				country: initialCountry,
				latitude: initialLatitude,
				longitude: initialLongitude,
				startDate: initialStartDate,
				endDate: initialEndDate,
				estimatedAuditors: initialEstimatedAuditors,
				auditorDescription: initialAuditorDescription
			}),
		[
			initialAuditorDescription,
			initialCity,
			initialCountry,
			initialEndDate,
			initialEstimatedAuditors,
			initialLatitude,
			initialLongitude,
			initialName,
			initialPlaceType,
			initialProvince,
			initialStartDate
		]
	);
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => validatePlaceValues(value)
		},
		onSubmit: async ({ value }) => {
			try {
				setSubmitError(null);
				await onSubmit({
					name: value.name.trim(),
					place_type: toNullableString(value.placeType),
					city: toNullableString(value.city),
					province: toNullableString(value.province),
					country: toNullableString(value.country),
					lat: toNullableNumber(value.latitude),
					lng: toNullableNumber(value.longitude),
					start_date: toNullableString(value.startDate),
					end_date: toNullableString(value.endDate),
					est_auditors: toNullableInteger(value.estimatedAuditors),
					auditor_description: toNullableString(value.auditorDescription)
				});
				onOpenChange(false);
			} catch (error) {
				setSubmitError(error instanceof Error ? error.message : "Unable to save place.");
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

	const handleGeocode = async () => {
		const address = form.getFieldValue("address");
		if (!address || address.trim().length === 0) {
			return;
		}
		setIsGeocoding(true);
		try {
			const encoded = encodeURIComponent(address.trim());
			const response = await fetch(
				`https://maps.google.com/maps/api/geocode/json?address=${encoded}`
			);
			const data = await response.json();
			if (data.results && data.results.length > 0) {
				const location = data.results[0].geometry.location;
				form.setFieldValue("latitude", String(location.lat));
				form.setFieldValue("longitude", String(location.lng));
				// Also try to fill city, province, country from address components
				const components = data.results[0].address_components;
				let city = "";
				let province = "";
				let country = "";
				for (const comp of components) {
					if (comp.types.includes("locality")) {
						city = comp.long_name;
					}
					if (comp.types.includes("administrative_area_level_1")) {
						province = comp.long_name;
					}
					if (comp.types.includes("country")) {
						country = comp.long_name;
					}
				}
				if (city) form.setFieldValue("city", city);
				if (province) form.setFieldValue("province", province);
				if (country) form.setFieldValue("country", country);
			}
		} catch (error) {
			console.error("Geocoding failed", error);
		} finally {
			setIsGeocoding(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full gap-0 sm:max-w-2xl">
				<SheetHeader className="border-b border-border/70 px-6 py-5">
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription>{description}</SheetDescription>
				</SheetHeader>
				<form
					className="flex min-h-0 flex-1 flex-col"
					onSubmit={async event => {
						event.preventDefault();
						event.stopPropagation();
						await form.handleSubmit();
					}}>
					<div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
						<form.Field name="name">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2 md:col-span-2">
										<Label htmlFor={field.name}>Place name</Label>
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
						<form.Field name="address">
							{field => (
								<div className="grid gap-2 md:col-span-2">
									<Label htmlFor={field.name}>Full address</Label>
									<div className="flex gap-2">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={event => field.handleChange(event.target.value)}
											placeholder="Street, City, Province, Country"
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={handleGeocode}
											disabled={isGeocoding || !field.state.value.trim()}>
											{isGeocoding ? "Looking up..." : "Look up coordinates"}
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										We'll try to fill latitude, longitude, and location fields automatically.
									</p>
								</div>
							)}
						</form.Field>
						<form.Field name="placeType">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Place type</Label>
									<Select
										value={field.state.value}
										onValueChange={value => field.handleChange(value)}>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select a type" />
										</SelectTrigger>
										<SelectContent>
											{PLACE_TYPE_OPTIONS.map(opt => (
												<SelectItem key={opt} value={opt}>
													{opt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
						<form.Field name="city">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>City</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="province">
							{field => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Province or state</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={event => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<form.Field name="latitude">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Latitude</Label>
										<Input
											id={field.name}
											inputMode="decimal"
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
						<form.Field name="longitude">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Longitude</Label>
										<Input
											id={field.name}
											inputMode="decimal"
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
						<form.Field name="estimatedAuditors">
							{field => {
								const validationMessage = getValidationMessage(field.state.meta.errors);

								return (
									<div className="grid gap-2 md:col-span-2">
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
					<SheetFooter className="border-t border-border/70 px-6 py-4">
						{submitError ? (
							<p aria-live="polite" className="mr-auto text-sm text-destructive">
								{submitError}
							</p>
						) : (
							<div className="mr-auto" />
						)}
						<div className="flex flex-col-reverse gap-2 sm:flex-row">
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
						</div>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}

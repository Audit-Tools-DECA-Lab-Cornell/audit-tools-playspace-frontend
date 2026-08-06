"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";
import type { QuestionScale } from "@/types/audit";

export interface ScaleMultiSelectProps {
	readonly scale: QuestionScale;
	readonly selectedOptionKeys: readonly string[];
	readonly onToggleOption: (optionKey: string) => void;
	readonly disabled?: boolean;
	/** `card` is the stacked question layout; `table` is the narrow matrix cell. */
	readonly density?: "card" | "table";
	/** Hide the scale title when the surrounding layout already shows it. */
	readonly showTitle?: boolean;
}

/**
 * Render a scale that accepts any non-empty combination of its options.
 *
 * Every option carries the same weight, so all options share one width, one type scale, and one
 * colour. Nothing in the layout may rank them.
 *
 * The visible control is a native checkbox kept off-screen with a painted box beside it. That keeps
 * one click target, native Tab/Space handling, and native checked semantics without nesting an
 * interactive control inside the label.
 */
export function ScaleMultiSelect({
	scale,
	selectedOptionKeys,
	onToggleOption,
	disabled = false,
	density = "card",
	showTitle = true
}: Readonly<ScaleMultiSelectProps>) {
	const t = useTranslations("auditor.execute.multiSelect");
	const fieldId = useId();
	const hintId = `${fieldId}-hint`;
	const [hasCleared, setHasCleared] = useState(false);

	const selectedCount = selectedOptionKeys.length;
	const isInvalid = hasCleared && selectedCount === 0;
	const isCompact = density === "table";

	return (
		<fieldset className="min-w-0 space-y-2 border-0 p-0">
			<legend className={cn("mb-2 min-w-0 space-y-1 p-0", isCompact ? "text-xs" : "text-sm")}>
				{showTitle ? (
					<span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary">
						{scale.title}
					</span>
				) : null}
				<span className={cn("block leading-5 text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
					{scale.prompt}
				</span>
			</legend>

			<div className="grid gap-2">
				{scale.options.map(option => {
					const isChecked = selectedOptionKeys.includes(option.key);

					return (
						<label
							key={`${scale.key}.${option.key}`}
							className={cn(
								"relative flex min-h-12 w-full min-w-0 cursor-pointer items-start gap-3 rounded-field border bg-background text-left leading-5 transition-colors",
								isCompact ? "px-3 py-2.5 text-xs" : "px-4 py-3 text-sm",
								isChecked
									? "border-primary bg-primary/10 text-primary"
									: "border-action-outline-border text-foreground hover:border-foreground/35 hover:bg-secondary/60",
								isInvalid && !isChecked ? "border-destructive/60" : undefined,
								disabled
									? "cursor-not-allowed opacity-60 hover:border-action-outline-border"
									: undefined,
								"has-[:focus-visible]:z-10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-background"
							)}>
							<input
								type="checkbox"
								className="sr-only"
								checked={isChecked}
								disabled={disabled}
								aria-describedby={hintId}
								aria-invalid={isInvalid || undefined}
								onChange={() => {
									if (isChecked && selectedCount === 1) {
										setHasCleared(true);
									} else {
										setHasCleared(false);
									}
									onToggleOption(option.key);
								}}
							/>
							<span
								aria-hidden="true"
								className={cn(
									"mt-0.5 grid size-5 shrink-0 place-content-center rounded-sm border-2 transition-colors",
									isChecked
										? "border-primary bg-primary text-primary-foreground"
										: "border-action-outline-border bg-background"
								)}>
								{isChecked ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
							</span>
							<span className={cn("min-w-0 flex-1 break-words", isChecked ? "font-semibold" : undefined)}>
								{option.label}
							</span>
						</label>
					);
				})}
			</div>

			<p
				id={hintId}
				className={cn(
					"text-xs leading-5",
					isInvalid ? "font-medium text-destructive" : "text-muted-foreground"
				)}>
				{isInvalid
					? t("required")
					: selectedCount === 0
						? t("hint")
						: t("selectedCount", { count: selectedCount, total: scale.options.length })}
			</p>
		</fieldset>
	);
}

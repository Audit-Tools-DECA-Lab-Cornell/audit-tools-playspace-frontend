"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";

import type { InstrumentQuestion, QuestionScale } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptSegment {
	readonly text: string;
	readonly bold: boolean;
}

export interface AuditQuestionCardProps {
	question: InstrumentQuestion;
	selectedAnswers: Record<string, string>;
	onSelectAnswer: (questionKey: string, scaleKey: string, optionKey: string) => void;
	disabled?: boolean;
}

/**
 * Parse `**bold**` prompt markers into renderable text segments.
 */
function parsePromptSegments(raw: string): PromptSegment[] {
	const segments: PromptSegment[] = [];
	const parts = raw.split("**");

	for (let index = 0; index < parts.length; index += 1) {
		const part = parts[index] ?? "";
		if (part.length === 0) {
			continue;
		}
		segments.push({ text: part, bold: index % 2 === 1 });
	}

	return segments;
}

/**
 * Render one playspace question with vertically stacked scales and gated follow-ups.
 */
export function AuditQuestionCard({
	question,
	selectedAnswers,
	onSelectAnswer,
	disabled = false
}: Readonly<AuditQuestionCardProps>) {
	const t = useTranslations("auditor.execute.questionCard");
	const quantityScale = question.scales[0];
	const selectedQuantityKey = quantityScale && selectedAnswers[quantityScale.key];
	const selectedQuantityOption = quantityScale?.options.find(option => option.key === selectedQuantityKey);
	const showFollowUpScales = selectedQuantityOption?.allows_follow_up_scales === true;
	const promptSegments = parsePromptSegments(question.prompt);

	return (
		<div className="field-card">
			<div className="field-card-body space-y-5">
				<p className="text-base leading-7 text-foreground">
					<span className="block text-sm font-semibold uppercase tracking-[0.16em] text-primary">
						{t("thisPlayspace")}
					</span>
					{promptSegments.map((segment, index) => (
						<Fragment key={`${question.question_key}-segment-${index.toString()}`}>
							<span className={segment.bold ? "font-semibold text-primary" : undefined}>
								{segment.text}
							</span>
						</Fragment>
					))}
				</p>

				{question.scales.map((scale, scaleIndex) => {
					if (scaleIndex > 0 && !showFollowUpScales) {
						return null;
					}

					return (
						<ScaleSelector
							key={`${question.question_key}.${scale.key}`}
							questionKey={question.question_key}
							scale={scale}
							selectedOptionKey={selectedAnswers[scale.key]}
							onSelectAnswer={onSelectAnswer}
							disabled={disabled}
						/>
					);
				})}

				{question.scales.length > 1 && !showFollowUpScales ? (
					<p className="text-xs text-muted-foreground">
						{t("followUpScalesHidden")}
					</p>
				) : null}
			</div>
		</div>
	);
}

interface ScaleSelectorProps {
	readonly questionKey: string;
	readonly scale: QuestionScale;
	readonly selectedOptionKey: string | undefined;
	readonly onSelectAnswer: (questionKey: string, scaleKey: string, optionKey: string) => void;
	readonly disabled: boolean;
}

/**
 * Render one scale selector inside a playspace question card.
 */
function ScaleSelector({
	questionKey,
	scale,
	selectedOptionKey,
	onSelectAnswer,
	disabled
}: Readonly<ScaleSelectorProps>) {
	return (
		<div className="space-y-3 rounded-field border border-border/70 bg-secondary/40 p-4 md:p-5">
			<div className="space-y-1">
				<p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{scale.title}</p>
				<p className="text-sm leading-5 text-muted-foreground">{scale.prompt}</p>
			</div>

			<div className="grid gap-2.5 sm:grid-cols-2">
				{scale.options.map(option => {
					const isSelected = selectedOptionKey === option.key;

					return (
						<Button
							key={`${scale.key}.${option.key}`}
							type="button"
							variant="outline"
							className={cn(
								"h-auto min-h-12 justify-center whitespace-normal rounded-field px-4 py-3 text-center leading-5",
								isSelected
									? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
									: "bg-background text-foreground hover:bg-secondary"
							)}
							disabled={disabled}
							onClick={() => {
								onSelectAnswer(questionKey, scale.key, option.key);
							}}>
							{option.label}
						</Button>
					);
				})}
			</div>
		</div>
	);
}

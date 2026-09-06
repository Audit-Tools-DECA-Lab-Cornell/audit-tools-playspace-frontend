"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConstructSelection, DomainConstructCoverage, ReportResultFilter } from "@/lib/audit/report-filter";
import { isDefaultReportFilter, isSingleConstructSelection } from "@/lib/audit/report-filter";

interface ConstructToggleGroupProps {
	readonly selection: ConstructSelection;
	readonly onChange: (selection: ConstructSelection) => void;
	readonly size?: "sm" | "default";
	readonly groupLabel: string;
	readonly testId?: string;
}

/**
 * Paired Play Value / Usability toggles.
 *
 * Turning off the last enabled construct is ignored, so a reader cannot reach an
 * empty report by clicking.
 */
function ConstructToggleGroup({ selection, onChange, size = "sm", groupLabel, testId }: ConstructToggleGroupProps) {
	const t = useTranslations("shared.reportView");

	return (
		<div role="group" aria-label={groupLabel} data-testid={testId} className="flex flex-wrap gap-2">
			<Button
				type="button"
				size={size}
				variant={selection.playValue ? "default" : "outline"}
				aria-pressed={selection.playValue}
				onClick={() => onChange({ ...selection, playValue: !selection.playValue })}
				disabled={selection.playValue && !selection.usability}>
				{t("metricPlayValue")}
			</Button>
			<Button
				type="button"
				size={size}
				variant={selection.usability ? "default" : "outline"}
				aria-pressed={selection.usability}
				onClick={() => onChange({ ...selection, usability: !selection.usability })}
				disabled={selection.usability && !selection.playValue}>
				{t("metricUsability")}
			</Button>
		</div>
	);
}

interface ReportFilterBannerProps {
	readonly filter: ReportResultFilter;
	readonly onShowFullReport: () => void;
}

/**
 * Persistent notice shown whenever a report opens showing less than the full audit.
 *
 * A stored selection is restored without the reader acting, so the report must
 * say what is missing and offer a one-click way back to everything.
 *
 * @param filter - Active report filter.
 * @param onShowFullReport - Restores both constructs and clears every override.
 */
export function ReportFilterBanner({ filter, onShowFullReport }: ReportFilterBannerProps) {
	const t = useTranslations("shared.reportView");

	if (isDefaultReportFilter(filter)) {
		return null;
	}

	const hasOverrides = Object.keys(filter.domainOverrides).length > 0;
	const overallIsNarrowed = !filter.overall.playValue || !filter.overall.usability;

	// A narrowed report-level selection names the construct; otherwise the only
	// thing that can make a filter non-default is a domain override.
	let message: string;
	if (!filter.overall.playValue) {
		message = t("filterBannerUsabilityOnly");
	} else if (!filter.overall.usability) {
		message = t("filterBannerPlayValueOnly");
	} else {
		message = t("filterBannerCustomized");
	}

	return (
		<div
			role="status"
			data-testid="report-result-filter-banner"
			className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-edge/60 bg-muted/40 px-4 py-3">
			<p className="text-sm font-medium text-foreground">
				{message}
				{overallIsNarrowed && hasOverrides ? (
					<span className="ml-1 font-normal text-muted-foreground">{t("filterBannerAlsoCustomized")}</span>
				) : null}
			</p>
			<Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onShowFullReport}>
				<RotateCcwIcon className="size-3.5" />
				{t("filterShowFullReport")}
			</Button>
		</div>
	);
}

interface ReportFilterControlsProps {
	readonly filter: ReportResultFilter;
	readonly onOverallChange: (selection: ConstructSelection) => void;
	readonly onApplyToAllDomains: () => void;
	readonly onReset: () => void;
}

/**
 * Report-level construct controls.
 *
 * Always rendered: the instrument as a whole carries both constructs, so both
 * toggles can always act here even when an individual domain's cannot.
 */
export function ReportFilterControls({
	filter,
	onOverallChange,
	onApplyToAllDomains,
	onReset
}: ReportFilterControlsProps) {
	const t = useTranslations("shared.reportView");
	const hasOverrides = Object.keys(filter.domainOverrides).length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("filterTitle")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap items-center gap-2">
					<ConstructToggleGroup
						selection={filter.overall}
						onChange={onOverallChange}
						groupLabel={t("filterOverallGroupLabel")}
						testId="report-result-filter-overall"
					/>
					{hasOverrides ? (
						<Button type="button" size="sm" variant="ghost" onClick={onApplyToAllDomains}>
							{t("filterApplyToAllDomains")}
						</Button>
					) : null}
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={isDefaultReportFilter(filter)}
						onClick={onReset}>
						{t("filterResetToFullReport")}
					</Button>
				</div>
				<p className="mt-3 text-sm text-muted-foreground">{t("filterHelp")}</p>
			</CardContent>
		</Card>
	);
}

interface DomainFilterControlsProps {
	readonly domainKey: string;
	readonly domainTitle: string;
	readonly selection: ConstructSelection;
	readonly coverage: DomainConstructCoverage | undefined;
	readonly hasOverride: boolean;
	readonly onChange: (selection: ConstructSelection) => void;
	readonly onUseReportSetting: () => void;
}

/**
 * Per-domain construct controls.
 *
 * A domain whose questions carry only one construct gets a short note instead of
 * a toggle pair, because both settings would render the same rows. A domain
 * whose coverage cannot be determined gets nothing at all.
 *
 * @param selection - Selection in force for this domain.
 * @param coverage - Which constructs this domain's questions actually carry.
 * @param hasOverride - Whether this domain currently overrides the report setting.
 * @param onChange - Sets an override for this domain.
 * @param onUseReportSetting - Clears this domain's override.
 */
export function DomainFilterControls({
	domainKey,
	domainTitle,
	selection,
	coverage,
	hasOverride,
	onChange,
	onUseReportSetting
}: DomainFilterControlsProps) {
	const t = useTranslations("shared.reportView");

	if (coverage === undefined || (!coverage.playValue && !coverage.usability)) {
		return null;
	}

	if (!coverage.playValue || !coverage.usability) {
		const construct = coverage.playValue ? t("metricPlayValue") : t("metricUsability");
		const included = coverage.playValue ? selection.playValue : selection.usability;
		const nextSelection = coverage.playValue
			? { playValue: !included, usability: included ? true : selection.usability }
			: { playValue: included ? true : selection.playValue, usability: !included };
		return (
			<div
				role="group"
				aria-label={t("filterDomainGroupLabel", { domain: domainTitle })}
				data-testid={`report-result-filter-domain-${domainKey}`}
				className="space-y-2">
				<p className="text-xs text-muted-foreground">{t("filterDomainMeasuresOnly", { construct })}</p>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant={included ? "outline" : "default"}
						aria-pressed={included}
						onClick={() => onChange(nextSelection)}>
						{included
							? t("filterExcludeDomainConstruct", { construct })
							: t("filterIncludeDomainConstruct", { construct })}
					</Button>
					{hasOverride ? (
						<Button type="button" size="sm" variant="ghost" onClick={onUseReportSetting}>
							{t("filterUseReportSetting")}
						</Button>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<ConstructToggleGroup
				selection={selection}
				onChange={onChange}
				groupLabel={t("filterDomainGroupLabel", { domain: domainTitle })}
				testId={`report-result-filter-domain-${domainKey}`}
			/>
			{hasOverride ? (
				<Button type="button" size="sm" variant="ghost" onClick={onUseReportSetting}>
					{t("filterUseReportSetting")}
				</Button>
			) : null}
		</div>
	);
}

interface FilteredScopeNoteProps {
	readonly selection: ConstructSelection;
}

/**
 * Scope label for shared-scale totals under a single-construct filter.
 *
 * Provision, Variety, Challenge and Sociability are not construct-scoped, so
 * under a single-construct filter their totals cover only part of the
 * instrument. Saying so stops a partial total reading as the whole one.
 *
 * @param selection - Selection in force for the totals being labelled.
 */
export function FilteredScopeNote({ selection }: FilteredScopeNoteProps) {
	const t = useTranslations("shared.reportView");

	if (!isSingleConstructSelection(selection)) {
		return null;
	}

	return (
		<p className="text-xs text-muted-foreground">
			{t("filterScopeNote", {
				construct: selection.playValue ? t("metricPlayValue") : t("metricUsability")
			})}
		</p>
	);
}

interface DomainEmptyNoticeProps {
	readonly selection: ConstructSelection;
}

/**
 * Copy shown when a filter removes every question in a domain.
 *
 * @param selection - Selection in force for the empty domain.
 */
export function DomainEmptyNotice({ selection }: DomainEmptyNoticeProps) {
	const t = useTranslations("shared.reportView");

	return (
		<p className="text-sm text-muted-foreground">
			{selection.playValue ? t("filterDomainEmptyPlayValue") : t("filterDomainEmptyUsability")}
		</p>
	);
}

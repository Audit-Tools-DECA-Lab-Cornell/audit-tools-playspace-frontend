"use client";

import { FileCheck2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import type { AccountDeletionPreview } from "@/lib/api/playspace";
import { cn } from "@/lib/utils";

export interface AccountDeletionLedgerProps {
	preview: AccountDeletionPreview;
	/** Organisation name shown to managers; auditors fall back to generic wording. */
	organizationName: string | null;
	className?: string;
}

/**
 * Side-by-side summary of what a user keeps and what they lose by deleting
 * their account.
 *
 * Shown both on the settings card and again inside the confirmation dialog, so
 * the reader never has to remember the numbers from the previous screen.
 */
export function AccountDeletionLedger({
	preview,
	organizationName,
	className
}: Readonly<AccountDeletionLedgerProps>) {
	const t = useTranslations("settings.deleteAccount.ledger");
	const groupId = React.useId();
	const keptLabelId = `${groupId}_kept`;
	const removedLabelId = `${groupId}_removed`;

	const removedItems = [
		{ key: "profile", label: t("removedProfile") },
		preview.draft_audits_to_delete > 0
			? { key: "drafts", label: t("removedDrafts", { count: preview.draft_audits_to_delete }) }
			: null,
		preview.active_assignments_to_delete > 0
			? { key: "assignments", label: t("removedAssignments", { count: preview.active_assignments_to_delete }) }
			: null
	].filter((item): item is { key: string; label: string } => item !== null);

	const hasUnfinishedWork = preview.draft_audits_to_delete > 0 || preview.active_assignments_to_delete > 0;

	return (
		<div className={cn("grid gap-3 md:grid-cols-2", className)}>
			<div role="group" aria-labelledby={keptLabelId} className="rounded-card border border-edge/40 bg-secondary/40 p-4">
				<p id={keptLabelId} className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
					{organizationName ? t("keptTitle", { organization: organizationName }) : t("keptTitleGeneric")}
				</p>
				<p className="mt-3 text-sm font-medium text-foreground">
					{t("keptAudits", { count: preview.submitted_audits_preserved })}
				</p>
				<p className="mt-1 text-sm leading-6 text-muted-foreground">{t("keptAuditsHint")}</p>
			</div>

			<div
				role="group"
				aria-labelledby={removedLabelId}
				className="rounded-card border border-destructive/30 bg-destructive/5 p-4">
				<p id={removedLabelId} className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<Trash2 className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
					{t("removedTitle")}
				</p>
				<ul className="mt-3 space-y-1.5">
					{removedItems.map(item => (
						<li key={item.key} className="flex gap-2 text-sm leading-6 text-foreground">
							<span aria-hidden="true" className="text-destructive">
								&bull;
							</span>
							<span>{item.label}</span>
						</li>
					))}
				</ul>
				{hasUnfinishedWork ? null : (
					<p className="mt-2 text-sm leading-6 text-muted-foreground">{t("removedNothingElse")}</p>
				)}
			</div>
		</div>
	);
}

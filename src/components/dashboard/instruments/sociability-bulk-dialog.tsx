import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { InstrumentChange } from "./review-changes-dialog";
import type { SociabilityMultiSelectTarget } from "./sociability-multi-select";
import { formatDiffPath, formatQuestionKeyForDisplay } from "./utils";

/**
 * Preview and confirm the Sociability multi-select bulk action.
 *
 * Nothing is written until the admin confirms: the dialog shows the exact count of items that will
 * change, the items themselves, and the field-level diff the publish review would show.
 */
export function SociabilityBulkDialog({
	open,
	targets,
	changes,
	onConfirm,
	onCancel
}: Readonly<{
	open: boolean;
	targets: readonly SociabilityMultiSelectTarget[];
	changes: readonly InstrumentChange[];
	onConfirm: () => void;
	onCancel: () => void;
}>) {
	const t = useTranslations("admin.instruments.content");

	const pendingTargets = targets.filter(target => !target.alreadyApplied);
	const appliedCount = targets.length - pendingTargets.length;
	const hasWork = pendingTargets.length > 0;

	return (
		<AlertDialog open={open} onOpenChange={open ? undefined : onCancel}>
			<AlertDialogContent className="max-w-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("sociabilityBulk.title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("sociabilityBulk.description")}</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="my-2 space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							{t("sociabilityBulk.affectedCount", { count: pendingTargets.length })}
						</Badge>
						{appliedCount > 0 ? (
							<Badge variant="outline" className="text-xs text-muted-foreground">
								{t("sociabilityBulk.alreadyAppliedCount", { count: appliedCount })}
							</Badge>
						) : null}
						<Badge variant="outline" className="text-xs text-muted-foreground">
							{t("sociabilityBulk.fieldChangeCount", { count: changes.length })}
						</Badge>
					</div>

					{hasWork ? (
						<ScrollArea className="h-[280px] rounded-md border border-edge/40 bg-muted/20 p-4">
							<div className="space-y-4">
								<div className="space-y-2">
									<h4 className="text-sm font-semibold">{t("sociabilityBulk.itemsHeading")}</h4>
									<ul className="space-y-1.5">
										{pendingTargets.map(target => (
											<li
												key={`${target.sectionKey}.${target.questionKey}`}
												className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
												<span className="font-mono font-medium text-foreground">
													{formatQuestionKeyForDisplay(target.questionKey)}
												</span>
												<span className="text-muted-foreground">{target.sectionTitle}</span>
											</li>
										))}
									</ul>
								</div>

								<div className="space-y-2">
									<h4 className="flex items-center gap-2 text-sm font-semibold">
										<AlertCircle className="h-4 w-4 text-status-warning" aria-hidden="true" />
										{t("sociabilityBulk.diffHeading")}
									</h4>
									<div className="space-y-4">
										{changes.map((change, index) => (
											<div key={index} className="space-y-1.5">
												<p className="inline-block rounded bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
													{formatDiffPath(change.path)}
												</p>
												<div className="flex items-center gap-2 text-xs">
													<div className="flex-1 rounded border border-status-error-border bg-status-error-surface/20 p-2 line-through opacity-70">
														{JSON.stringify(change.oldValue)}
													</div>
													<ArrowRight
														className="h-4 w-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<div className="flex-1 rounded border border-status-success-border bg-status-success-surface/20 p-2 font-medium">
														{JSON.stringify(change.newValue)}
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</ScrollArea>
					) : (
						<div className="flex flex-col items-center justify-center rounded-md border border-edge/40 bg-muted/20 py-10 text-center">
							<CheckCircle2 className="mb-2 h-8 w-8 text-status-success opacity-50" aria-hidden="true" />
							<p className="text-sm text-muted-foreground">{t("sociabilityBulk.nothingToDo")}</p>
						</div>
					)}

					<p className="text-xs leading-5 text-muted-foreground">{t("sociabilityBulk.draftOnlyNote")}</p>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={!hasWork}>
						{t("sociabilityBulk.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

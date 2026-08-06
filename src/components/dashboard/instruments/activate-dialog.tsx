import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";

export function ActivateDialog({
	open,
	isPending,
	versionLabel,
	nextPublishedVersion,
	requiresMultiSelectClients = false,
	onConfirm,
	onCancel
}: Readonly<{
	open: boolean;
	isPending: boolean;
	versionLabel: string | null;
	nextPublishedVersion: string | null;
	/** This version has scales that accept multiple answers, which older clients cannot render. */
	requiresMultiSelectClients?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}>) {
	const t = useTranslations("admin.instruments");
	return (
		<Dialog
			open={open}
			onOpenChange={o => {
				if (!o) onCancel();
			}}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("versionHistory.confirmActivateTitle")}</DialogTitle>
					<DialogDescription>
						{versionLabel && nextPublishedVersion
							? t("versionHistory.confirmActivateWithVersion", {
									version: versionLabel,
									nextVersion: nextPublishedVersion
								})
							: t("versionHistory.confirmActivate")}
					</DialogDescription>
				</DialogHeader>
				{requiresMultiSelectClients ? (
					<div
						role="alert"
						className="flex items-start gap-2 rounded-md border border-status-warning-border bg-status-warning-surface/20 px-3 py-2">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" aria-hidden="true" />
						<div className="min-w-0 space-y-1">
							<p className="text-sm font-medium text-foreground">
								{t("versionHistory.multiSelectWarningTitle")}
							</p>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{t("versionHistory.multiSelectWarningBody")}
							</p>
						</div>
					</div>
				) : null}
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						{t("versionHistory.cancel")}
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{t("versionHistory.activate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

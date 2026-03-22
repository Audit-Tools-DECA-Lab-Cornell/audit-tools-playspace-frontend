"use client";

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

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	onConfirm: () => void;
	isPending?: boolean;
	confirmVariant?: "default" | "destructive";
}

/**
 * Shared confirmation dialog for destructive dashboard actions.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	onConfirm,
	isPending = false,
	confirmVariant = "destructive"
}: Readonly<ConfirmDialogProps>) {
	const t = useTranslations("shared.confirmDialog");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						{t("cancel")}
					</Button>
					<Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={isPending}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

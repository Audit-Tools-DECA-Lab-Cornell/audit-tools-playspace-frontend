"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { type ManagerProfile, playspaceApi, PlayspaceApiError } from "@/lib/api/playspace";

export interface PrimaryTransferDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Managers who may take the role: same organisation, not primary, not the reader. */
	successors: readonly ManagerProfile[];
	isLoadingSuccessors: boolean;
	organizationName: string | null;
	/** Called with the new main contact's name once the hand-over succeeds. */
	onTransferred: (successorName: string) => void;
}

/**
 * Hand the main-contact role to another manager in the same organisation.
 *
 * Only managers who already have an active profile on this account can be
 * chosen; people with an invitation that has not been accepted yet do not have
 * a profile and therefore never appear in the list.
 */
export function PrimaryTransferDialog({
	open,
	onOpenChange,
	successors,
	isLoadingSuccessors,
	organizationName,
	onTransferred
}: Readonly<PrimaryTransferDialogProps>) {
	const t = useTranslations("settings.primaryTransfer");
	const queryClient = useQueryClient();

	const [successorId, setSuccessorId] = React.useState<string>("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const selectedSuccessor = successors.find(profile => profile.id === successorId) ?? null;

	const transferMutation = useMutation({
		mutationFn: () => playspaceApi.manager.transferPrimaryRole({ successor_manager_profile_id: successorId }),
		onSuccess: async () => {
			const successorName = selectedSuccessor?.full_name ?? "";
			await queryClient.invalidateQueries({ queryKey: ["playspace", "settings"] });
			await queryClient.invalidateQueries({ queryKey: ["playspace", "account"] });
			onTransferred(successorName);
			resetDialogState();
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const status = error instanceof PlayspaceApiError ? error.status : 0;

			if (status === 409) {
				setErrorMessage(t("errors.emailConflict", { name: selectedSuccessor?.full_name ?? "" }));
				return;
			}

			if (status === 403) {
				setErrorMessage(t("errors.notAllowed"));
				return;
			}

			setErrorMessage(t("errors.generic"));
		}
	});

	const isPending = transferMutation.isPending;

	function resetDialogState() {
		setSuccessorId("");
		setErrorMessage(null);
		transferMutation.reset();
	}

	function handleOpenChange(nextOpen: boolean) {
		if (isPending) {
			return;
		}

		if (!nextOpen) {
			resetDialogState();
		}

		onOpenChange(nextOpen);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(null);

		if (successorId.length === 0) {
			setErrorMessage(t("errors.successorRequired"));
			return;
		}

		transferMutation.mutate();
	}

	const hasSuccessors = successors.length > 0;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{organizationName
							? t("description", { organization: organizationName })
							: t("descriptionGeneric")}
					</DialogDescription>
				</DialogHeader>

				{isLoadingSuccessors ? (
					<p className="text-sm text-muted-foreground">{t("loading")}</p>
				) : hasSuccessors ? (
					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<div className="space-y-2">
							<Label htmlFor="primary_transfer_successor">{t("successorLabel")}</Label>
							<Select
								value={successorId.length > 0 ? successorId : undefined}
								disabled={isPending}
								onValueChange={nextValue => {
									setSuccessorId(nextValue);
									setErrorMessage(null);
								}}>
								<SelectTrigger
									id="primary_transfer_successor"
									aria-required="true"
									aria-invalid={errorMessage !== null}>
									<SelectValue placeholder={t("successorPlaceholder")} />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectGroup>
										<SelectLabel>{t("successorGroupLabel")}</SelectLabel>
										{successors.map(profile => (
											<SelectItem key={profile.id} value={profile.id}>
												{profile.full_name} ({profile.email})
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						{errorMessage ? (
							<p role="alert" aria-live="polite" className="text-sm text-destructive">
								{errorMessage}
							</p>
						) : null}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={isPending}
								onClick={() => handleOpenChange(false)}>
								{t("actions.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={isPending || successorId.length === 0}
								aria-busy={isPending}
								data-testid="primary-transfer-confirm">
								{isPending ? t("actions.transferring") : t("actions.confirm")}
							</Button>
						</DialogFooter>
					</form>
				) : (
					<>
						<div className="rounded-card border border-edge/40 bg-secondary/40 p-4">
							<p className="text-sm font-semibold text-foreground">{t("empty.title")}</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{t("empty.body")}</p>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
								{t("actions.cancel")}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { AccountDeletionLedger } from "@/components/dashboard/account-deletion/account-deletion-ledger";
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
import {
	ACCOUNT_DELETION_CONFIRMATION,
	type AccountDeletionPreview,
	playspaceApi,
	PlayspaceApiError
} from "@/lib/api/playspace";
import { clearBrowserAuthSession } from "@/lib/auth/browser-session";

/** Sign-in screen shows a confirmation when it is opened with this flag. */
const ACCOUNT_DELETED_LOGIN_PATH = "/login?account_deleted=1";

type DeleteStep = "review" | "confirm";

export interface DeleteAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	preview: AccountDeletionPreview;
	organizationName: string | null;
	/** Re-reads the summary after the backend refuses the deletion. */
	onRefreshPreview: () => void;
}

/**
 * Two-step confirmation for deleting the signed-in user's own account.
 *
 * Step one restates what is kept and what is lost. Step two takes the current
 * password plus the literal confirmation word, and is only reachable while the
 * backend still allows the deletion.
 */
export function DeleteAccountDialog({
	open,
	onOpenChange,
	preview,
	organizationName,
	onRefreshPreview
}: Readonly<DeleteAccountDialogProps>) {
	const t = useTranslations("settings.deleteAccount");
	const queryClient = useQueryClient();

	const [requestedStep, setRequestedStep] = React.useState<DeleteStep>("review");
	const [password, setPassword] = React.useState("");
	const [confirmationWord, setConfirmationWord] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	/**
	 * The confirmation step is never reachable while the account cannot be
	 * deleted. If the refreshed summary withdraws permission mid-flow, the reader
	 * drops back to the review step instead of typing into a dead form.
	 */
	const step: DeleteStep = preview.can_delete ? requestedStep : "review";

	const deleteMutation = useMutation({
		mutationFn: () =>
			playspaceApi.accountDeletion.remove({
				current_password: password,
				confirmation: ACCOUNT_DELETION_CONFIRMATION
			}),
		onSuccess: () => {
			/**
			 * Order matters. The session cookies go first so nothing can
			 * re-authenticate, then the cached responses, then a full page load so
			 * no screen can briefly render the deleted account's data.
			 */
			clearBrowserAuthSession();
			queryClient.clear();
			globalThis.window.location.replace(ACCOUNT_DELETED_LOGIN_PATH);
		},
		onError: (error: unknown) => {
			const status = error instanceof PlayspaceApiError ? error.status : 0;

			if (status === 400) {
				setErrorMessage(t("errors.wrongPassword"));
				return;
			}

			if (status === 403) {
				setErrorMessage(t("errors.notAllowed"));
				return;
			}

			if (status === 409) {
				setErrorMessage(t("errors.blockedNow"));
				setRequestedStep("review");
				onRefreshPreview();
				return;
			}

			if (status === 422) {
				setErrorMessage(t("errors.confirmationMismatch", { word: ACCOUNT_DELETION_CONFIRMATION }));
				return;
			}

			setErrorMessage(t("errors.generic"));
		}
	});

	const isPending = deleteMutation.isPending;
	const isConfirmationWordValid = confirmationWord === ACCOUNT_DELETION_CONFIRMATION;
	const canSubmit = preview.can_delete && password.length > 0 && isConfirmationWordValid;

	function resetDialogState() {
		setRequestedStep("review");
		setPassword("");
		setConfirmationWord("");
		setErrorMessage(null);
		deleteMutation.reset();
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

		if (!password.length) {
			setErrorMessage(t("errors.passwordRequired"));
			return;
		}

		if (!isConfirmationWordValid) {
			setErrorMessage(t("errors.confirmationMismatch", { word: ACCOUNT_DELETION_CONFIRMATION }));
			return;
		}

		deleteMutation.mutate();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						{t("dialog.stepLabel", { current: step === "review" ? 1 : 2, total: 2 })}
					</p>
					<DialogTitle>{step === "review" ? t("dialog.reviewTitle") : t("dialog.confirmTitle")}</DialogTitle>
					<DialogDescription>
						{step === "review"
							? t("dialog.reviewDescription")
							: t("dialog.confirmDescription", { word: ACCOUNT_DELETION_CONFIRMATION })}
					</DialogDescription>
				</DialogHeader>

				{step === "review" ? (
					<>
						<AccountDeletionLedger preview={preview} organizationName={organizationName} />
						{errorMessage ? (
							<p role="alert" aria-live="polite" className="text-sm text-destructive">
								{errorMessage}
							</p>
						) : null}
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
								{t("actions.cancel")}
							</Button>
							<Button
								type="button"
								variant="destructive"
								disabled={!preview.can_delete}
								onClick={() => {
									setErrorMessage(null);
									setRequestedStep("confirm");
								}}>
								{t("actions.continue")}
							</Button>
						</DialogFooter>
					</>
				) : (
					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<div className="space-y-2">
							<Label htmlFor="delete_account_password">{t("dialog.passwordLabel")}</Label>
							<Input
								id="delete_account_password"
								name="deleteAccountPassword"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={event => {
									setPassword(event.target.value);
									setErrorMessage(null);
								}}
								disabled={isPending}
								aria-required="true"
								autoFocus
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="delete_account_confirmation">
								{t("dialog.confirmLabel", { word: ACCOUNT_DELETION_CONFIRMATION })}
							</Label>
							<Input
								id="delete_account_confirmation"
								name="deleteAccountConfirmation"
								type="text"
								autoComplete="off"
								spellCheck={false}
								autoCapitalize="none"
								placeholder={ACCOUNT_DELETION_CONFIRMATION}
								value={confirmationWord}
								onChange={event => {
									setConfirmationWord(event.target.value);
									setErrorMessage(null);
								}}
								disabled={isPending}
								aria-required="true"
								aria-describedby="delete_account_confirmation_hint"
								className="font-mono"
							/>
							<p id="delete_account_confirmation_hint" className="text-xs text-muted-foreground">
								{t("dialog.confirmHint", { word: ACCOUNT_DELETION_CONFIRMATION })}
							</p>
						</div>

						<p className="rounded-card border border-destructive/30 bg-destructive/5 p-3 text-sm leading-6 text-foreground">
							{t("dialog.finalWarning", { action: t("actions.confirm") })}
						</p>

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
								onClick={() => {
									setErrorMessage(null);
									setRequestedStep("review");
								}}>
								{t("actions.back")}
							</Button>
							<Button
								type="submit"
								variant="destructive"
								disabled={!canSubmit || isPending}
								aria-busy={isPending}
								data-testid="delete-account-confirm">
								{isPending ? t("actions.deleting") : t("actions.confirm")}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

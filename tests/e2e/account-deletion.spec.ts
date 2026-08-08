import { expect, test } from "@playwright/test";

import { bearerHeaders, expectOk, getApiBaseUrl, loginViaApi } from "../helpers/api";
import { loginAsAdmin, loginAsAuditor, loginAsManager } from "../helpers/auth";

/**
 * Self-service account deletion.
 *
 * These specs deliberately stop short of actually deleting a seeded account:
 * the seed is shared by every other spec in this suite, and a real deletion
 * would cascade failures across unrelated runs. What is asserted here is
 * everything up to the irreversible step - who is offered the danger zone, what
 * the preview promises, and that every refusal path is both enforced by the API
 * and explained in plain language by the UI.
 *
 * The destructive path itself is covered by the backend integration tests, which
 * own a disposable database.
 */

const DELETION_PATH = "/playspace/me/account-deletion";

interface DeletionPreview {
	role: "AUDITOR" | "MANAGER";
	submitted_audits_preserved: number;
	draft_audits_to_delete: number;
	active_assignments_to_delete: number;
	pending_submissions: number;
	is_primary_manager: boolean;
	can_delete: boolean;
	blocker: string | null;
}

test.describe("@account-deletion deletion preview contract", () => {
	test("an auditor is told how much submitted work their organisation keeps", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "auditor"));

		const response = await request.get(`${getApiBaseUrl()}${DELETION_PATH}`, { headers });

		await expectOk(response);
		const preview = (await response.json()) as DeletionPreview;
		expect(preview.role).toBe("AUDITOR");
		expect(preview.is_primary_manager).toBe(false);
		expect(preview.submitted_audits_preserved).toBeGreaterThanOrEqual(0);
	});

	test("the seeded primary manager is blocked until ownership moves", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "manager"));

		const response = await request.get(`${getApiBaseUrl()}${DELETION_PATH}`, { headers });

		await expectOk(response);
		const preview = (await response.json()) as DeletionPreview;
		expect(preview.role).toBe("MANAGER");
		expect(preview.is_primary_manager).toBe(true);
		expect(preview.can_delete).toBe(false);
		expect(preview.blocker).toBe("PRIMARY_MANAGER_TRANSFER_REQUIRED");
	});

	test("administrators cannot use self-service deletion at all", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "admin"));

		const preview = await request.get(`${getApiBaseUrl()}${DELETION_PATH}`, { headers });
		expect(preview.status()).toBe(403);

		const attempt = await request.post(`${getApiBaseUrl()}${DELETION_PATH}`, {
			headers,
			data: { current_password: "DemoPass123!", confirmation: "DELETE" }
		});
		expect(attempt.status()).toBe(403);
	});
});

test.describe("@account-deletion refusals leave the account intact", () => {
	test("a wrong password is refused and the session still works", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "auditor"));

		const response = await request.post(`${getApiBaseUrl()}${DELETION_PATH}`, {
			headers,
			data: { current_password: "definitely-not-the-password", confirmation: "DELETE" }
		});

		expect(response.status()).toBe(400);
		await expectOk(await request.get(`${getApiBaseUrl()}${DELETION_PATH}`, { headers }));
	});

	test("a confirmation word that is not exactly DELETE is refused", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "auditor"));

		for (const confirmation of ["delete", "Delete", "DELETE ACCOUNT"]) {
			const response = await request.post(`${getApiBaseUrl()}${DELETION_PATH}`, {
				headers,
				data: { current_password: "DemoPass123!", confirmation }
			});
			expect(response.status(), `confirmation "${confirmation}"`).toBe(422);
		}

		await expectOk(await request.get(`${getApiBaseUrl()}${DELETION_PATH}`, { headers }));
	});

	test("a primary manager's delete request is refused with a conflict", async ({ request }) => {
		const headers = bearerHeaders(await loginViaApi(request, "manager"));

		const response = await request.post(`${getApiBaseUrl()}${DELETION_PATH}`, {
			headers,
			data: { current_password: "DemoPass123!", confirmation: "DELETE" }
		});

		expect(response.status()).toBe(409);
	});
});

test.describe("@account-deletion danger zone on the settings page", () => {
	test("login confirms a completed deletion when the redirect flag is present", async ({ page }) => {
		await page.goto("/login?account_deleted=1");

		const confirmation = page.getByTestId("account-deleted-confirmation");
		await expect(confirmation).toBeVisible();
		await expect(confirmation).toContainText(/permanently deleted/i);
	});

	test("an auditor sees the danger zone and a two-step confirmation", async ({ page }) => {
		await loginAsAuditor(page);
		await page.goto("/settings");

		await expect(page.getByText("Danger zone", { exact: true })).toBeVisible();
		const startButton = page.getByRole("button", { name: "Delete my account" });
		await expect(startButton).toBeVisible();

		await startButton.click();

		// Step one explains the outcome before any password field appears.
		await expect(page.getByText("Before you delete your account")).toBeVisible();
		await expect(page.getByText("Step 1 of 2")).toBeVisible();
		await expect(page.getByText("What is removed")).toBeVisible();
		await expect(page.getByLabel("Your password")).toHaveCount(0);
	});

	test("a primary manager is told to hand over ownership instead of being stuck", async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/settings");

		await expect(page.getByText("Danger zone", { exact: true })).toBeVisible();
		// The reason is explained in the reader's terms, never as a raw code.
		await expect(page.getByText(/main contact/i)).toBeVisible();
		await expect(page.getByText("PRIMARY_MANAGER_TRANSFER_REQUIRED")).toHaveCount(0);
		await expect(page.getByRole("button", { name: "Choose who takes over" })).toBeVisible();
	});

	test("administrators are never shown the danger zone", async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("/settings");

		await expect(page.getByText("Workspace Settings")).toBeVisible();
		await expect(page.getByText("Danger zone", { exact: true })).toHaveCount(0);
	});
});

import { type APIRequestContext, expect, test } from "@playwright/test";

import { bearerHeaders, expectOk, getApiBaseUrl, loginViaApi } from "../helpers/api";
import { loginAsAdmin } from "../helpers/auth";

const SOCIABILITY_PROMPT = "Does this feature/environmental characteristic provide opportunities for a child to";
const SOCIABILITY_LABELS = [
	"Play on their own",
	"Play together in a small group (1-4 other users)",
	"Play together in a larger group (5 or more other users)"
] as const;

interface InstrumentScale {
	readonly key: string;
	readonly selection_mode?: "single" | "multiple";
	readonly options: readonly { readonly key: string; readonly label: string }[];
}

interface InstrumentPayload {
	readonly sections: readonly {
		readonly questions: readonly { readonly question_key: string; readonly scales: readonly InstrumentScale[] }[];
	}[];
}

/**
 * Read the active instrument and report whether Sociability currently accepts multiple answers.
 *
 * The candidate 5.32 instrument stays inactive until the rollout completes, so the auditor-facing
 * checks skip with a stated reason rather than silently passing against a scalar instrument.
 */
async function findMultipleSociabilityQuestion(
	request: APIRequestContext,
	token: string
): Promise<{ questionKey: string } | null> {
	const response = await request.get(`${getApiBaseUrl()}/playspace/instrument`, { headers: bearerHeaders(token) });
	await expectOk(response);
	const instrument = (await response.json()) as InstrumentPayload;

	for (const section of instrument.sections) {
		for (const question of section.questions) {
			const scale = question.scales.find(candidate => candidate.key === "sociability");
			if (scale?.selection_mode === "multiple") {
				return { questionKey: question.question_key };
			}
		}
	}
	return null;
}

test.describe("@web-ui Sociability multi-select", () => {
	test("the active instrument exposes the canonical three options when multi-select is live", async ({ request }) => {
		const token = await loginViaApi(request, "auditor");
		const target = await findMultipleSociabilityQuestion(request, token);

		test.skip(
			target === null,
			"The active instrument still scores Sociability as one answer; multi-select activates with 5.32."
		);

		const response = await request.get(`${getApiBaseUrl()}/playspace/instrument`, {
			headers: bearerHeaders(token)
		});
		await expectOk(response);
		const instrument = (await response.json()) as InstrumentPayload;

		const scales = instrument.sections
			.flatMap(section => section.questions)
			.flatMap(question => question.scales)
			.filter(scale => scale.key === "sociability" && scale.selection_mode === "multiple");

		expect(scales.length).toBeGreaterThan(0);
		for (const scale of scales) {
			expect(scale.options.map(option => option.key)).toEqual(["play_alone", "small_group", "large_group"]);
			expect(scale.options.map(option => option.label)).toEqual([...SOCIABILITY_LABELS]);
		}
	});

	test("auditor can select any combination and the choices survive a reload", async ({ page, request }) => {
		const token = await loginViaApi(request, "auditor");
		const target = await findMultipleSociabilityQuestion(request, token);

		test.skip(
			target === null,
			"The active instrument still scores Sociability as one answer; multi-select activates with 5.32."
		);

		await loginAsAdmin(page);
		await page.goto("/auditor/places");

		const startAudit = page.getByRole("link", { name: /audit|survey/i }).first();
		await expect(startAudit).toBeVisible({ timeout: 15_000 });
		await startAudit.click();

		const group = page.getByRole("group", { name: new RegExp(SOCIABILITY_PROMPT, "i") }).first();
		await expect(group).toBeVisible({ timeout: 15_000 });

		const playAlone = group.getByRole("checkbox", { name: SOCIABILITY_LABELS[0] });
		const largeGroup = group.getByRole("checkbox", { name: SOCIABILITY_LABELS[2] });

		// Space toggles, and every option is reachable by keyboard.
		await playAlone.focus();
		await page.keyboard.press("Space");
		await expect(playAlone).toBeChecked();

		await largeGroup.check();
		await expect(largeGroup).toBeChecked();
		await expect(group.getByRole("checkbox", { name: SOCIABILITY_LABELS[1] })).not.toBeChecked();

		await page.reload();
		const reloadedGroup = page.getByRole("group", { name: new RegExp(SOCIABILITY_PROMPT, "i") }).first();
		await expect(reloadedGroup.getByRole("checkbox", { name: SOCIABILITY_LABELS[0] })).toBeChecked();
		await expect(reloadedGroup.getByRole("checkbox", { name: SOCIABILITY_LABELS[2] })).toBeChecked();
		await expect(reloadedGroup.getByRole("checkbox", { name: SOCIABILITY_LABELS[1] })).not.toBeChecked();
	});

	test("admin editor exposes selection mode and previews the guarded bulk action", async ({ page }) => {
		await loginAsAdmin(page);

		await page.goto("/admin/instruments");
		await expect(page.getByText("Version History").first()).toBeVisible({ timeout: 15_000 });
		await page.getByTestId("edit-duplicate-button").first().click();
		await expect(page.getByText("Instrument Editor").first()).toBeVisible({ timeout: 15_000 });

		// Selection mode is editable on the shared scale guidance.
		await page.getByRole("tab", { name: /Scale Guidance/i }).click();
		await expect(page.getByText("Answering").first()).toBeVisible();

		// The bulk action must preview counts and the diff before it writes anything.
		const bulkAction = page.getByRole("button", { name: /Apply Sociability multi-select/i });
		await expect(bulkAction).toBeVisible();
		await bulkAction.click();

		await expect(page.getByText(/items? change/i).first()).toBeVisible();
		await expect(page.getByText(/Items that will change/i)).toBeVisible();
		await expect(page.getByText(/Field-level changes/i)).toBeVisible();
		await expect(page.getByText(/Nothing is saved or activated until you publish/i)).toBeVisible();

		await page.getByRole("button", { name: /Apply to draft/i }).click();

		// After applying, the spreadsheet view marks the converted scales.
		await page.getByRole("tab", { name: /Spreadsheet/i }).click();
		await expect(page.getByTestId("badge-multi-select-sociability").first()).toBeVisible();
	});
});

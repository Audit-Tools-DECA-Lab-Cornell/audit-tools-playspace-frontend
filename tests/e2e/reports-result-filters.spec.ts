import { type APIRequestContext, expect, type Locator, type Page, test } from "@playwright/test";

import { e2eIds } from "../fixtures/ids";
import { bearerHeaders, expectOk, getApiBaseUrl, loginViaApi } from "../helpers/api";
import { loginAsManager } from "../helpers/auth";

const OVERALL_FILTER_ID = "report-result-filter-overall";
const FILTER_BANNER_ID = "report-result-filter-banner";
const OPEN_SPACE_FILTER_ID = "report-result-filter-domain-open_space";

interface SubmittedAuditList {
	readonly items: ReadonlyArray<{
		readonly audit_id: string;
		readonly place_id: string;
		readonly status: string;
	}>;
}

async function findSubmittedAuditId(request: APIRequestContext): Promise<string> {
	const managerToken = await loginViaApi(request, "manager");
	const response = await request.get(
		`${getApiBaseUrl()}/playspace/accounts/${e2eIds.managerAccountId}/audits?page_size=100&status=SUBMITTED`,
		{ headers: bearerHeaders(managerToken) }
	);
	await expectOk(response);

	const payload = (await response.json()) as SubmittedAuditList;
	const submitted = payload.items.find(
		audit => audit.status === "SUBMITTED" && audit.place_id === e2eIds.riversidePlaceId
	);
	expect(submitted, "Riverside Reserve needs its seeded submitted audit for report coverage.").toBeTruthy();
	return submitted?.audit_id ?? "";
}

async function openSubmittedManagerReport(page: Page, request: APIRequestContext): Promise<void> {
	const auditId = await findSubmittedAuditId(request);
	await loginAsManager(page);
	await page.goto(`/manager/reports/${auditId}`);
	await expect(page.getByTestId(OVERALL_FILTER_ID)).toBeVisible();
}

function constructToggle(group: Locator, name: "Play Value" | "Usability"): Locator {
	return group.getByRole("button", { name, exact: true });
}

async function expectConstructSelection(
	group: Locator,
	selection: Readonly<{ playValue: boolean; usability: boolean }>
): Promise<void> {
	await expect(constructToggle(group, "Play Value")).toHaveAttribute("aria-pressed", String(selection.playValue));
	await expect(constructToggle(group, "Usability")).toHaveAttribute("aria-pressed", String(selection.usability));
}

test.describe("@reports result filters", () => {
	test("the full report is the default and overall choices produce a traceable export", async ({ page, request }) => {
		await openSubmittedManagerReport(page, request);

		const overallFilter = page.getByTestId(OVERALL_FILTER_ID);
		const resetToFullReport = page.getByRole("button", { name: "Reset to full report", exact: true });
		await expectConstructSelection(overallFilter, { playValue: true, usability: true });
		await expect(resetToFullReport).toBeVisible();
		await expect(page.getByTestId(FILTER_BANNER_ID)).toBeHidden();
		await expect(page.getByText("audit-scores.json", { exact: true })).toBeVisible();

		await constructToggle(overallFilter, "Usability").click();
		await expectConstructSelection(overallFilter, { playValue: true, usability: false });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing Play Value results only.");
		await expect(constructToggle(overallFilter, "Play Value")).toBeDisabled();
		await expect(resetToFullReport).toBeEnabled();
		await expect(page.getByText("audit-scores.json", { exact: true })).toBeHidden();

		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: "Excel", exact: true }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/^pvua-.+-play-value\.xlsx$/u);

		await resetToFullReport.click();
		await constructToggle(overallFilter, "Play Value").click();
		await expectConstructSelection(overallFilter, { playValue: false, usability: true });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing Usability results only.");
		await expect(constructToggle(overallFilter, "Usability")).toBeDisabled();
	});

	test("a domain can override the report and return to the report setting", async ({ page, request }) => {
		await openSubmittedManagerReport(page, request);

		await page.getByRole("button", { name: /^Open Space(?:\s|$)/u }).click();
		const domainFilter = page.getByTestId(OPEN_SPACE_FILTER_ID);
		await expect(domainFilter).toBeVisible();
		await expectConstructSelection(domainFilter, { playValue: true, usability: true });

		await constructToggle(domainFilter, "Usability").click();
		await expectConstructSelection(page.getByTestId(OVERALL_FILTER_ID), {
			playValue: true,
			usability: true
		});
		await expectConstructSelection(domainFilter, { playValue: true, usability: false });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing results with some domains customized.");

		await page.getByRole("button", { name: "Use report setting", exact: true }).click();
		await expectConstructSelection(domainFilter, { playValue: true, usability: true });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toBeHidden();

		await constructToggle(domainFilter, "Play Value").click();
		await page.getByRole("button", { name: "Reset to full report", exact: true }).click();
		await expectConstructSelection(domainFilter, { playValue: true, usability: true });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toBeHidden();
	});

	test("Show full report is temporary while Reset to full report persists", async ({ page, request }) => {
		await openSubmittedManagerReport(page, request);

		let overallFilter = page.getByTestId(OVERALL_FILTER_ID);
		await constructToggle(overallFilter, "Usability").click();
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing Play Value results only.");

		await page.reload();
		overallFilter = page.getByTestId(OVERALL_FILTER_ID);
		await expectConstructSelection(overallFilter, { playValue: true, usability: false });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing Play Value results only.");

		await page.getByRole("button", { name: "Show full report", exact: true }).click();
		await expectConstructSelection(overallFilter, { playValue: true, usability: true });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toBeHidden();

		await page.reload();
		overallFilter = page.getByTestId(OVERALL_FILTER_ID);
		await expectConstructSelection(overallFilter, { playValue: true, usability: false });
		await expect(page.getByTestId(FILTER_BANNER_ID)).toContainText("Showing Play Value results only.");

		await page.getByRole("button", { name: "Reset to full report", exact: true }).click();
		await page.reload();
		await expectConstructSelection(page.getByTestId(OVERALL_FILTER_ID), {
			playValue: true,
			usability: true
		});
		await expect(page.getByTestId(FILTER_BANNER_ID)).toBeHidden();
	});
});

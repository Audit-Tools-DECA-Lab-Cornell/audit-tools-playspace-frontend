import { expect, type Page } from "@playwright/test";

/**
 * Navigate to the admin instruments page, click the first
 * "Edit / Duplicate" button, then switch to the Spreadsheet editor tab.
 *
 * Assumes the page is already authenticated as admin.
 */
export async function openEditableSpreadsheet(page: Page) {
	await page.goto("/admin/instruments");

	const editButton = page.getByTestId("edit-duplicate-button").first();
	await expect(editButton).toBeVisible({ timeout: 15_000 });
	await editButton.click();

	const spreadsheetTab = page.getByTestId("spreadsheet-tab");
	await expect(spreadsheetTab).toBeVisible({ timeout: 10_000 });
	await spreadsheetTab.click();

	await expect(page.getByTestId("spreadsheet-content")).toBeVisible({ timeout: 10_000 });
}

/**
 * Click an editable cell, fill a new value, and commit.
 *
 * @param commit  "enter" presses Enter; "button" clicks the save icon.
 */
export async function editTextCell(page: Page, testId: string, value: string, commit: "enter" | "button" = "enter") {
	await page.getByTestId(testId).click();
	const textarea = page.getByTestId("editable-cell-textarea");
	await expect(textarea).toBeVisible({ timeout: 5_000 });
	await textarea.fill(value);

	if (commit === "enter") {
		await textarea.press("Enter");
	} else {
		await page.getByTestId("editable-cell-save").click();
	}

	await expect(textarea).toBeHidden({ timeout: 5_000 });
}

/**
 * Click an editable cell, type a temp value, then press Escape to cancel.
 */
export async function cancelTextCellEdit(page: Page, testId: string, tempValue: string) {
	await page.getByTestId(testId).click();
	const textarea = page.getByTestId("editable-cell-textarea");
	await expect(textarea).toBeVisible({ timeout: 5_000 });
	await textarea.fill(tempValue);
	await textarea.press("Escape");
	await expect(textarea).toBeHidden({ timeout: 5_000 });
}

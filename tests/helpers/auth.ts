import { expect, type Page } from "@playwright/test";

export const DUMMY_CREDS = {
	admin: {
		email: "playspace.admin@example.org",
		password: "DemoPass123!"
	},
	manager: {
		email: "amelia.carter@example.org",
		password: "DemoPass123!"
	},
	auditor: {
		email: "ariana.ngata@example.org",
		password: "DemoPass123!"
	}
};

/**
 * Log in as a specific role via the login page UI.
 *
 * Uses data-testid selectors to reliably target the correct
 * role card's inputs regardless of DOM structure or hydration timing.
 */
export async function loginAsRole(page: Page, role: "admin" | "manager" | "auditor") {
	await page.goto("/login");

	const { email, password } = DUMMY_CREDS[role];

	const emailInput = page.getByTestId(`${role}-email-input`);
	const passwordInput = page.getByTestId(`${role}-password-input`);
	const submitButton = page.getByTestId(`${role}-submit-button`);

	await expect(emailInput).toBeVisible({ timeout: 15_000 });
	await emailInput.fill(email);
	await passwordInput.fill(password);

	await Promise.all([
		page.waitForURL(url => url.pathname.startsWith(`/${role}/`), { timeout: 30_000 }),
		submitButton.click()
	]);
}

export async function loginAsAdmin(page: Page) {
	return loginAsRole(page, "admin");
}

export async function loginAsManager(page: Page) {
	return loginAsRole(page, "manager");
}

export async function loginAsAuditor(page: Page) {
	return loginAsRole(page, "auditor");
}

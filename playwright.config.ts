import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/",
	timeout: 60_000,
	expect: { timeout: 60_000 },
	fullyParallel: false,
	retries: 1,
	use: {
		baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 60_000,
		navigationTimeout: 60_000
	},
	projects: [
		{ name: "chromium", testIgnore: /.*tests\/e2e\/.*/, use: { ...devices["Desktop Chrome"] } },
		{ name: "manager-chromium", testMatch: /.*manager.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "auditor-chromium", testMatch: /.*auditor.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "auditor-mobile-web", testMatch: /.*auditor.*\.spec\.ts/, use: { ...devices["iPhone 15"] } },
		{ name: "reports-chromium", testMatch: /.*reports.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "web-ui-chromium", testMatch: /.*web-ui.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } }
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: "pnpm dev",
				url: "http://localhost:3000",
				reuseExistingServer: true,
				timeout: 120_000
			}
});

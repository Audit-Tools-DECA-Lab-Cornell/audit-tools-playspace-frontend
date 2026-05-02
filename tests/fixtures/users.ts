export const E2E_PASSWORD = "DemoPass123!";

export const e2eUsers = {
	admin: {
		email: "playspace.admin@example.org",
		password: E2E_PASSWORD
	},
	manager: {
		email: "amelia.carter@example.org",
		password: E2E_PASSWORD
	},
	auditor: {
		email: "ariana.ngata@example.org",
		password: E2E_PASSWORD
	},
	otherAuditor: {
		email: "maya.thompson@example.org",
		password: E2E_PASSWORD
	}
} as const;

export type E2ERole = keyof typeof e2eUsers;

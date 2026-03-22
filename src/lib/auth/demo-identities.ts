export const PLAYSPACE_PRIMARY_MANAGER_ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";
export const PLAYSPACE_SECONDARY_MANAGER_ACCOUNT_ID = "f6e5870a-0505-5d99-bba8-fc4050596d0d";
export const PLAYSPACE_ADMIN_ACCOUNT_ID = "c01d6712-4703-5cf5-8dd7-40ceba038d9b";

const MANAGER_ACCOUNT_ID_BY_EMAIL: Record<string, string> = {
	"manager@example.org": PLAYSPACE_PRIMARY_MANAGER_ACCOUNT_ID,
	"canterbury.manager@example.org": PLAYSPACE_SECONDARY_MANAGER_ACCOUNT_ID
};

/**
 * Resolve the seeded manager account id from a demo email.
 */
export function resolveManagerAccountId(email: string): string {
	const normalizedEmail = email.trim().toLowerCase();
	return MANAGER_ACCOUNT_ID_BY_EMAIL[normalizedEmail] ?? PLAYSPACE_PRIMARY_MANAGER_ACCOUNT_ID;
}

/**
 * Resolve the seeded admin account id for demo sign-in.
 */
export function resolveAdminAccountId(): string {
	return PLAYSPACE_ADMIN_ACCOUNT_ID;
}

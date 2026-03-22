import type { UserRole } from "./role";

/**
 * Shared auth session shape used by both server and browser helpers.
 */
export interface AuthSession {
	role: UserRole;
	accessToken: string;
	accountId: string | null;
	auditorCode: string | null;
}

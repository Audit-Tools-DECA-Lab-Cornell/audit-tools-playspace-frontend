import type { UserRole } from "./role";

export type AuthNextStep = "VERIFY_EMAIL" | "WAITING_APPROVAL" | "COMPLETE_PROFILE" | "DASHBOARD";

/**
 * Shared auth session shape used by both server and browser helpers.
 */
export interface AuthSession {
	role: UserRole;
	accessToken: string;
	accountId: string | null;
	auditorCode: string | null;
	userName: string | null;
	userEmail: string | null;
	nextStep: AuthNextStep;
}

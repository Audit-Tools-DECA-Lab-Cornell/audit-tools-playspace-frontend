export type UserRole = "manager" | "auditor";

export const AUTH_COOKIE_NAMES = {
  accessToken: "playsafe_access_token",
  role: "playsafe_role",
  auditorCode: "playsafe_auditor_code",
} as const;

export function isUserRole(value: string): value is UserRole {
  return value === "manager" || value === "auditor";
}

export function parseUserRole(value: string | null | undefined): UserRole | null {
  if (!value) return null;
  return isUserRole(value) ? value : null;
}


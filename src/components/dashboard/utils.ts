import type { PlaceSummary, ProjectSummary } from "@/lib/api/playspace";

export interface ScorePair {
	pv: number;
	u: number;
}

export type DashboardTextValues = Record<string, string | number | Date>;

export type DashboardTranslator = (key: string, values?: DashboardTextValues) => string;

/**
 * Resolve the current document language when available for locale formatting.
 */
function getCurrentLocale(): string | undefined {
	if (globalThis.document === undefined) {
		return undefined;
	}

	const currentLanguage = globalThis.document.documentElement.lang.trim();
	return currentLanguage.length > 0 ? currentLanguage : undefined;
}

/**
 * Format a backend date string into a readable medium date.
 */
export function formatDateLabel(value: string | null, t: DashboardTranslator): string {
	if (!value) {
		return t("notSet");
	}

	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) {
		return value;
	}

	return parsedDate.toLocaleDateString(getCurrentLocale(), {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}

/**
 * Format a backend datetime string into a compact label.
 */
export function formatDateTimeLabel(value: string | null, t: DashboardTranslator): string {
	if (!value) {
		return t("noRecentActivity");
	}

	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) {
		return value;
	}

	return parsedDate.toLocaleString(getCurrentLocale(), {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}

/**
 * Format the date segment embedded in an audit code into a shorter label.
 */
function formatAuditCodeDateSegment(value: string): string | null {
	const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
	if (!match) {
		return null;
	}

	const [, year, month, day] = match;
	const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
	if (Number.isNaN(parsedDate.getTime())) {
		return null;
	}

	return parsedDate.toLocaleDateString(getCurrentLocale(), {
		month: "short",
		day: "numeric"
	});
}

/**
 * Compress one verbose audit code into a lighter human-readable reference label.
 */
export function formatAuditCodeReference(auditCode: string): string {
	console.log("auditCode", auditCode);
	if (!auditCode) {
		return "";
	}
	const segments = auditCode
		.split("-")
		.map(segment => segment.trim())
		.filter(segment => segment.length > 0);

	if (segments.length < 4) {
		return auditCode;
	}

	const [scope, areaCode, sequenceCode, dateSegment] = segments;
	const compactAreaCode = [areaCode, sequenceCode].join("-");
	const compactDateLabel = formatAuditCodeDateSegment(dateSegment);

	return compactDateLabel
		? [scope, compactAreaCode, compactDateLabel].join(" · ")
		: [scope, compactAreaCode].join(" · ");
}

/**
 * Format a score consistently across cards and tables.
 */
export function formatScoreLabel(value: number | null, t: DashboardTranslator): string {
	if (value === null) {
		return t("pending");
	}

	return `${Math.round(value * 10) / 10}`;
}

/**
 * Format a PV/U score pair consistently across cards and tables.
 */
export function formatScorePairLabel(value: ScorePair | null | undefined, t: DashboardTranslator): string {
	if (value === null || value === undefined) {
		return t("pending");
	}

	const pv = Math.round(value.pv * 10) / 10;
	const u = Math.round(value.u * 10) / 10;
	return `PV ${pv} | U ${u}`;
}

/**
 * Build a location label from the place summary fields.
 */
export function formatLocationLabel(
	place: Pick<PlaceSummary, "city" | "province" | "country">,
	t: DashboardTranslator
): string {
	const parts = [place.city, place.province, place.country].filter((part): part is string =>
		Boolean(part && part.trim().length > 0)
	);

	if (parts.length === 0) {
		return t("locationPending");
	}

	return parts.join(", ");
}

/**
 * Human-friendly date range text for project headers and tables.
 */
export function formatProjectDateRange(
	project: Pick<ProjectSummary, "start_date" | "end_date">,
	t: DashboardTranslator
): string {
	if (!project.start_date && !project.end_date) {
		return t("datesPending");
	}

	if (project.start_date && project.end_date) {
		return `${formatDateLabel(project.start_date, t)} - ${formatDateLabel(project.end_date, t)}`;
	}

	if (project.start_date) {
		return t("starts", { date: formatDateLabel(project.start_date, t) });
	}

	return t("ends", { date: formatDateLabel(project.end_date, t) });
}

/**
 * Resolve a status chip class for project lifecycle states.
 */
export function getProjectStatusClassName(status: ProjectSummary["status"]): string {
	if (status === "completed") {
		return "border-status-success-border bg-status-success-surface text-status-success";
	}

	if (status === "planned") {
		return "border-status-pending-border bg-status-pending-surface text-status-pending";
	}

	return "border-status-in-progress-border bg-status-in-progress-surface text-status-in-progress";
}

/** Per-axis place coverage: backend may send `submitted` (activity) or legacy `complete`. */
export type PlaceAxisRequirementStatus = "not_started" | "in_progress" | "complete" | "submitted";

/**
 * Resolve a status chip class for place requirement completion states.
 */
export function getRequirementStatusClassName(status: PlaceAxisRequirementStatus): string {
	if (status === "complete" || status === "submitted") {
		return "border-status-success-border bg-status-success-surface text-status-success";
	}

	if (status === "in_progress") {
		return "border-status-in-progress-border bg-status-in-progress-surface text-status-in-progress";
	}

	return "border-status-pending-border bg-status-pending-surface text-status-pending";
}

/**
 * Render a friendly label for the new requirement-completion statuses.
 */
export function formatRequirementStatusLabel(status: PlaceAxisRequirementStatus, t: DashboardTranslator): string {
	if (status === "complete" || status === "submitted") {
		return "Complete";
	}
	if (status === "in_progress") {
		return "In progress";
	}
	return t("pending");
}

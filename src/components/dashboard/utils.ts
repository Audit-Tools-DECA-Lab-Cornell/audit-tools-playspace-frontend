import type { PlaceSummary, ProjectSummary } from "@/lib/api/playspace";

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
export function formatDateLabel(value: string | null): string {
	if (!value) {
		return "Not set";
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
export function formatDateTimeLabel(value: string | null): string {
	if (!value) {
		return "No recent activity";
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
export function formatScoreLabel(value: number | null): string {
	if (value === null) {
		return "Pending";
	}

	return `${Math.round(value * 10) / 10}`;
}

/**
 * Build a location label from the place summary fields.
 */
export function formatLocationLabel(place: Pick<PlaceSummary, "city" | "province" | "country">): string {
	const parts = [place.city, place.province, place.country].filter((part): part is string =>
		Boolean(part && part.trim().length > 0)
	);

	if (parts.length === 0) {
		return "Location pending";
	}

	return parts.join(", ");
}

/**
 * Human-friendly date range text for project headers and tables.
 */
export function formatProjectDateRange(project: Pick<ProjectSummary, "start_date" | "end_date">): string {
	if (!project.start_date && !project.end_date) {
		return "Dates pending";
	}

	if (project.start_date && project.end_date) {
		return `${formatDateLabel(project.start_date)} - ${formatDateLabel(project.end_date)}`;
	}

	if (project.start_date) {
		return `Starts ${formatDateLabel(project.start_date)}`;
	}

	return `Ends ${formatDateLabel(project.end_date)}`;
}

/**
 * Resolve a status chip class for project lifecycle states.
 */
export function getProjectStatusClassName(status: ProjectSummary["status"]): string {
	if (status === "completed") {
		return "border-[color:rgba(111,154,127,0.24)] bg-[color:rgba(111,154,127,0.12)] text-[color:#6F9A7F]";
	}

	if (status === "planned") {
		return "border-[color:rgba(185,154,90,0.24)] bg-[color:rgba(185,154,90,0.12)] text-[color:#B99A5A]";
	}

	return "border-[color:rgba(197,138,92,0.24)] bg-[color:rgba(197,138,92,0.12)] text-[color:#C58A5C]";
}

/**
 * Resolve a status chip class for project place activity states.
 */
export function getPlaceStatusClassName(status: PlaceSummary["status"]): string {
	if (status === "submitted") {
		return "border-[color:rgba(111,154,127,0.24)] bg-[color:rgba(111,154,127,0.12)] text-[color:#6F9A7F]";
	}

	if (status === "in_progress") {
		return "border-[color:rgba(197,138,92,0.24)] bg-[color:rgba(197,138,92,0.12)] text-[color:#C58A5C]";
	}

	return "border-[color:rgba(185,154,90,0.24)] bg-[color:rgba(185,154,90,0.12)] text-[color:#B99A5A]";
}

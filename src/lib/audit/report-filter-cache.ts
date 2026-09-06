import type { ConstructSelection, ReportResultFilter } from "@/lib/audit/report-filter";
import { createDefaultReportFilter } from "@/lib/audit/report-filter";

/**
 * Master switch for remembering a reader's filter choices between visits.
 *
 * Sticky filters are on trial. Setting this to `false` makes every report open
 * with both constructs enabled and turns all reads and writes below into no-ops,
 * without touching any call site. Flip it here rather than reverting the feature.
 */
export const REPORT_FILTERS_PERSIST = true;

/** Storage schema version. Bump to abandon incompatible stored entries. */
const CACHE_VERSION = "v1";

/** Maximum report entries kept per identity, evicting least-recently-changed first. */
const MAX_ENTRIES = 100;

interface CacheEntry {
	readonly overall: ConstructSelection;
	readonly domainOverrides: Record<string, ConstructSelection>;
	/** Epoch milliseconds of the last change, used for eviction ordering. */
	readonly updatedAt: number;
}

type CachePayload = Record<string, CacheEntry>;

/**
 * Stable identity for one report's stored selections.
 *
 * A combined place report merges exactly one audit session and one survey
 * session, so both ids are needed to name it.
 *
 * @param auditId - Audit session id.
 * @param surveyId - Survey session id for a combined report; omit for a single report.
 * @returns The report identity used as a cache entry key.
 */
export function buildReportIdentity(auditId: string, surveyId?: string | null): string {
	return surveyId === undefined || surveyId === null ? `audit:${auditId}` : `combined:${auditId}:${surveyId}`;
}

/**
 * Normalize a signed-in user's email into a cache namespace.
 *
 * Role is deliberately excluded: a manager with several profiles, or any role
 * change, would otherwise orphan every stored selection.
 *
 * @param userEmail - Email from the current session, when there is one.
 * @returns A namespace string, or null when no user can be identified.
 */
export function buildCacheIdentity(userEmail: string | null | undefined): string | null {
	const normalized = (userEmail ?? "").trim().toLowerCase();
	return normalized.length === 0 ? null : normalized;
}

function storageKey(identity: string): string {
	return `playspace.report-filters.${CACHE_VERSION}.${identity}`;
}

function readStorage(): Storage | null {
	if (typeof globalThis.localStorage === "undefined") {
		return null;
	}
	try {
		return globalThis.localStorage;
	} catch {
		return null;
	}
}

function isConstructSelection(value: unknown): value is ConstructSelection {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	if (typeof candidate.playValue !== "boolean" || typeof candidate.usability !== "boolean") {
		return false;
	}
	return candidate.playValue || candidate.usability;
}

function parseEntry(value: unknown): CacheEntry | null {
	if (typeof value !== "object" || value === null) {
		return null;
	}
	const candidate = value as Record<string, unknown>;
	if (!isConstructSelection(candidate.overall)) {
		return null;
	}
	const overrides: Record<string, ConstructSelection> = {};
	const rawOverrides = candidate.domainOverrides;
	if (typeof rawOverrides === "object" && rawOverrides !== null) {
		Object.entries(rawOverrides as Record<string, unknown>).forEach(([domainKey, selection]) => {
			if (isConstructSelection(selection)) {
				overrides[domainKey] = { playValue: selection.playValue, usability: selection.usability };
			}
		});
	}
	return {
		overall: { playValue: candidate.overall.playValue, usability: candidate.overall.usability },
		domainOverrides: overrides,
		updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0
	};
}

function readPayload(identity: string): CachePayload {
	const storage = readStorage();
	if (storage === null) {
		return {};
	}
	try {
		const raw = storage.getItem(storageKey(identity));
		if (raw === null) {
			return {};
		}
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) {
			return {};
		}
		const payload: CachePayload = {};
		Object.entries(parsed as Record<string, unknown>).forEach(([reportIdentity, entry]) => {
			const parsedEntry = parseEntry(entry);
			if (parsedEntry !== null) {
				payload[reportIdentity] = parsedEntry;
			}
		});
		return payload;
	} catch {
		return {};
	}
}

function writePayload(identity: string, payload: CachePayload): void {
	const storage = readStorage();
	if (storage === null) {
		return;
	}
	try {
		storage.setItem(storageKey(identity), JSON.stringify(payload));
	} catch {
		// A full or unavailable store must never break the report.
	}
}

function evictOldest(payload: CachePayload): CachePayload {
	const entries = Object.entries(payload);
	if (entries.length <= MAX_ENTRIES) {
		return payload;
	}
	entries.sort((left, right) => right[1].updatedAt - left[1].updatedAt);
	return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
}

/**
 * Read one report's stored filter.
 *
 * Safe to call before hydration: with no storage available it returns the
 * default filter rather than throwing.
 *
 * @param identity - Cache namespace from `buildCacheIdentity`.
 * @param reportIdentity - Report key from `buildReportIdentity`.
 * @returns The stored filter, or a default filter when there is none to restore.
 */
export function loadReportFilter(identity: string | null, reportIdentity: string): ReportResultFilter {
	if (!REPORT_FILTERS_PERSIST || identity === null) {
		return createDefaultReportFilter();
	}
	const entry = readPayload(identity)[reportIdentity];
	if (entry === undefined) {
		return createDefaultReportFilter();
	}
	return { overall: entry.overall, domainOverrides: entry.domainOverrides };
}

/**
 * Store one report's filter, evicting the least-recently-changed entries beyond
 * the cap.
 *
 * @param identity - Cache namespace from `buildCacheIdentity`.
 * @param reportIdentity - Report key from `buildReportIdentity`.
 * @param filter - Filter to remember.
 * @param changedAt - Epoch milliseconds used for eviction ordering.
 */
export function saveReportFilter(
	identity: string | null,
	reportIdentity: string,
	filter: ReportResultFilter,
	changedAt: number
): void {
	if (!REPORT_FILTERS_PERSIST || identity === null) {
		return;
	}
	const payload = readPayload(identity);
	payload[reportIdentity] = {
		overall: filter.overall,
		domainOverrides: { ...filter.domainOverrides },
		updatedAt: changedAt
	};
	writePayload(identity, evictOldest(payload));
}

/**
 * Remove every stored selection for one identity.
 *
 * Called when an account is deleted so no trace of that reader's choices remains
 * on the device.
 *
 * @param identity - Cache namespace from `buildCacheIdentity`.
 */
export function clearReportFilters(identity: string | null): void {
	const storage = readStorage();
	if (storage === null || identity === null) {
		return;
	}
	try {
		storage.removeItem(storageKey(identity));
	} catch {
		// Nothing to do when the store is unavailable.
	}
}

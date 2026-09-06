"use client";

import * as React from "react";

import type { ConstructSelection, ReportResultFilter } from "@/lib/audit/report-filter";
import {
	applySelectionToAllDomains,
	clearDomainOverride,
	createDefaultReportFilter,
	pruneUnknownDomainOverrides,
	setDomainOverride,
	setOverallSelection
} from "@/lib/audit/report-filter";
import { buildCacheIdentity, loadReportFilter, saveReportFilter } from "@/lib/audit/report-filter-cache";

export interface ReportFilterController {
	readonly filter: ReportResultFilter;
	readonly setOverall: (selection: ConstructSelection) => void;
	readonly setDomain: (domainKey: string, selection: ConstructSelection) => void;
	readonly clearDomain: (domainKey: string) => void;
	readonly applyToAllDomains: () => void;
	readonly showFullReport: () => void;
	readonly reset: () => void;
}

/**
 * Stored filters, read through once per report and then served from memory.
 *
 * `useSyncExternalStore` requires a referentially stable snapshot, so every
 * report's filter object is cached here and only replaced when it changes.
 */
const filterSnapshots = new Map<string, ReportResultFilter>();
const transientSnapshots = new Map<string, ReportResultFilter>();
const listenersBySnapshot = new Map<string, Set<() => void>>();
const subscriberCounts = new Map<string, number>();

/** Shared across every report so the server render always starts unfiltered. */
const SERVER_SNAPSHOT: ReportResultFilter = createDefaultReportFilter();

function snapshotKey(identity: string | null, reportIdentity: string): string {
	return `${identity ?? "-"}::${reportIdentity}`;
}

export function readReportFilterSnapshot(identity: string | null, reportIdentity: string): ReportResultFilter {
	const key = snapshotKey(identity, reportIdentity);
	const transient = transientSnapshots.get(key);
	if (transient !== undefined) {
		return transient;
	}
	const cached = filterSnapshots.get(key);
	if (cached !== undefined) {
		return cached;
	}
	const loaded = loadReportFilter(identity, reportIdentity);
	filterSnapshots.set(key, loaded);
	return loaded;
}

export function writeReportFilterSnapshot(
	identity: string | null,
	reportIdentity: string,
	next: ReportResultFilter,
	persist = true
): void {
	const key = snapshotKey(identity, reportIdentity);
	if (persist) {
		filterSnapshots.set(key, next);
		transientSnapshots.delete(key);
		saveReportFilter(identity, reportIdentity, next, Date.now());
	} else {
		transientSnapshots.set(key, next);
	}
	listenersBySnapshot.get(key)?.forEach(listener => listener());
}

function subscribe(identity: string | null, reportIdentity: string, listener: () => void): () => void {
	const key = snapshotKey(identity, reportIdentity);
	const listeners = listenersBySnapshot.get(key) ?? new Set<() => void>();
	listeners.add(listener);
	listenersBySnapshot.set(key, listeners);
	subscriberCounts.set(key, (subscriberCounts.get(key) ?? 0) + 1);
	return () => {
		listeners.delete(listener);
		const nextCount = (subscriberCounts.get(key) ?? 1) - 1;
		if (nextCount <= 0) {
			subscriberCounts.delete(key);
			listenersBySnapshot.delete(key);
			transientSnapshots.delete(key);
		} else {
			subscriberCounts.set(key, nextCount);
		}
	};
}

/**
 * Own one report's filter state and its stored-selection lifecycle.
 *
 * The server render and the client's first paint both start from the unfiltered
 * default; the stored selection is adopted once the client subscribes, so the
 * markup never mismatches and a reader never waits on a blank report. Overrides
 * naming domains this report does not contain are dropped as they are read.
 *
 * @param reportIdentity - Report key from `buildReportIdentity`.
 * @param userEmail - Signed-in reader's email, used to namespace stored selections.
 * @param knownDomainKeys - Domain keys present in this report. Omit from callers
 * that only observe the filter (export buttons, for instance): passing an empty
 * list would prune every override rather than leaving them alone.
 * @returns The active filter and the operations that change it.
 */
export function useReportFilter(
	reportIdentity: string,
	userEmail: string | null | undefined,
	knownDomainKeys?: readonly string[]
): ReportFilterController {
	const identity = React.useMemo(() => buildCacheIdentity(userEmail), [userEmail]);

	const getSnapshot = React.useCallback(
		() => readReportFilterSnapshot(identity, reportIdentity),
		[identity, reportIdentity]
	);
	const subscribeToSnapshot = React.useCallback(
		(listener: () => void) => subscribe(identity, reportIdentity, listener),
		[identity, reportIdentity]
	);
	const getServerSnapshot = React.useCallback(() => SERVER_SNAPSHOT, []);
	const stored = React.useSyncExternalStore(subscribeToSnapshot, getSnapshot, getServerSnapshot);

	// Pruning is derived during render rather than written back, so a report that
	// is missing a domain today does not destroy a selection another report uses.
	const domainKeysSignature = knownDomainKeys === undefined ? null : knownDomainKeys.join("|");
	const filter = React.useMemo(
		() =>
			domainKeysSignature === null
				? stored
				: pruneUnknownDomainOverrides(
						stored,
						domainKeysSignature.split("|").filter(key => key.length > 0)
					),
		[stored, domainKeysSignature]
	);

	const update = React.useCallback(
		(change: (current: ReportResultFilter) => ReportResultFilter, persist = true) => {
			const loaded = readReportFilterSnapshot(identity, reportIdentity);
			const current =
				domainKeysSignature === null
					? loaded
					: pruneUnknownDomainOverrides(
							loaded,
							domainKeysSignature.split("|").filter(key => key.length > 0)
						);
			const next = change(current);
			if (next !== current) {
				writeReportFilterSnapshot(identity, reportIdentity, next, persist);
			}
		},
		[domainKeysSignature, identity, reportIdentity]
	);

	const setOverall = React.useCallback(
		(selection: ConstructSelection) => update(current => setOverallSelection(current, selection)),
		[update]
	);

	const setDomain = React.useCallback(
		(domainKey: string, selection: ConstructSelection) =>
			update(current => setDomainOverride(current, domainKey, selection)),
		[update]
	);

	const clearDomain = React.useCallback(
		(domainKey: string) => update(current => clearDomainOverride(current, domainKey)),
		[update]
	);

	const applyToAllDomains = React.useCallback(() => update(current => applySelectionToAllDomains(current)), [update]);

	const showFullReport = React.useCallback(() => update(() => createDefaultReportFilter(), false), [update]);

	const reset = React.useCallback(() => update(() => createDefaultReportFilter()), [update]);

	return { filter, setOverall, setDomain, clearDomain, applyToAllDomains, showFullReport, reset };
}

/**
 * Forget every in-memory snapshot.
 *
 * Called on sign-out and account deletion so a following reader on the same
 * device never sees the previous one's selections.
 */
export function resetReportFilterSnapshots(): void {
	filterSnapshots.clear();
	transientSnapshots.clear();
	listenersBySnapshot.forEach(listeners => listeners.forEach(listener => listener()));
}

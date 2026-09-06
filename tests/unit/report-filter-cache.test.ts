import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultReportFilter, setDomainOverride, setOverallSelection } from "@/lib/audit/report-filter";
import {
	buildCacheIdentity,
	buildReportIdentity,
	clearReportFilters,
	loadReportFilter,
	REPORT_FILTERS_PERSIST,
	saveReportFilter
} from "@/lib/audit/report-filter-cache";
import {
	readReportFilterSnapshot,
	resetReportFilterSnapshots,
	writeReportFilterSnapshot
} from "@/lib/audit/use-report-filter";

const PLAY_VALUE_ONLY = { playValue: true, usability: false };
const USABILITY_ONLY = { playValue: false, usability: true };

/** Minimal in-memory Storage stand-in; jsdom is not available to these tests. */
class MemoryStorage {
	private store = new Map<string, string>();

	get length(): number {
		return this.store.size;
	}

	getItem(key: string): string | null {
		return this.store.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
	}

	key(index: number): string | null {
		return Array.from(this.store.keys())[index] ?? null;
	}
}

function withStorage<T>(run: (storage: MemoryStorage) => T): T {
	const storage = new MemoryStorage();
	const globalWithStorage = globalThis as { localStorage?: unknown };
	const previous = globalWithStorage.localStorage;
	globalWithStorage.localStorage = storage;
	try {
		return run(storage);
	} finally {
		globalWithStorage.localStorage = previous;
	}
}

test("the sticky-filter switch is on for the trial", () => {
	assert.equal(REPORT_FILTERS_PERSIST, true);
});

test("a single report identity names its audit, a combined one names both sessions", () => {
	assert.equal(buildReportIdentity("audit-1"), "audit:audit-1");
	assert.equal(buildReportIdentity("audit-1", null), "audit:audit-1");
	assert.equal(buildReportIdentity("audit-1", "survey-2"), "combined:audit-1:survey-2");
});

test("cache identity normalizes email and rejects an absent user", () => {
	assert.equal(buildCacheIdentity("  Reader@Example.COM "), "reader@example.com");
	assert.equal(buildCacheIdentity(null), null);
	assert.equal(buildCacheIdentity(""), null);
	assert.equal(buildCacheIdentity("   "), null);
});

test("a saved filter is restored for the same report", () => {
	withStorage(() => {
		const identity = buildCacheIdentity("reader@example.com");
		const reportIdentity = buildReportIdentity("audit-1");
		const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

		saveReportFilter(identity, reportIdentity, filter, 1000);

		assert.deepEqual(loadReportFilter(identity, reportIdentity).overall, PLAY_VALUE_ONLY);
	});
});

test("one report's selection does not leak into another report", () => {
	withStorage(() => {
		const identity = buildCacheIdentity("reader@example.com");
		saveReportFilter(
			identity,
			buildReportIdentity("audit-1"),
			setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY),
			1000
		);

		const other = loadReportFilter(identity, buildReportIdentity("audit-2"));
		assert.deepEqual(other, createDefaultReportFilter());
	});
});

test("two accounts on one browser keep separate selections", () => {
	withStorage(() => {
		const first = buildCacheIdentity("first@example.com");
		const second = buildCacheIdentity("second@example.com");
		const reportIdentity = buildReportIdentity("audit-1");

		saveReportFilter(
			first,
			reportIdentity,
			setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY),
			1000
		);
		saveReportFilter(
			second,
			reportIdentity,
			setOverallSelection(createDefaultReportFilter(), USABILITY_ONLY),
			1000
		);

		assert.deepEqual(loadReportFilter(first, reportIdentity).overall, PLAY_VALUE_ONLY);
		assert.deepEqual(loadReportFilter(second, reportIdentity).overall, USABILITY_ONLY);
	});
});

test("domain overrides survive a round trip", () => {
	withStorage(() => {
		const identity = buildCacheIdentity("reader@example.com");
		const reportIdentity = buildReportIdentity("audit-1");
		const filter = setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY);

		saveReportFilter(identity, reportIdentity, filter, 1000);

		assert.deepEqual(loadReportFilter(identity, reportIdentity).domainOverrides, {
			seating: USABILITY_ONLY
		});
	});
});

test("a corrupt payload falls back to both constructs", () => {
	withStorage(storage => {
		const identity = buildCacheIdentity("reader@example.com");
		storage.setItem("playspace.report-filters.v1.reader@example.com", "{not json");

		assert.deepEqual(loadReportFilter(identity, buildReportIdentity("audit-1")), createDefaultReportFilter());
	});
});

test("an entry with both constructs disabled is rejected rather than restored", () => {
	withStorage(storage => {
		const identity = buildCacheIdentity("reader@example.com");
		storage.setItem(
			"playspace.report-filters.v1.reader@example.com",
			JSON.stringify({
				"audit:audit-1": {
					overall: { playValue: false, usability: false },
					domainOverrides: {},
					updatedAt: 1000
				}
			})
		);

		assert.deepEqual(loadReportFilter(identity, buildReportIdentity("audit-1")), createDefaultReportFilter());
	});
});

test("a malformed domain override is dropped without losing the entry", () => {
	withStorage(storage => {
		const identity = buildCacheIdentity("reader@example.com");
		storage.setItem(
			"playspace.report-filters.v1.reader@example.com",
			JSON.stringify({
				"audit:audit-1": {
					overall: { playValue: true, usability: false },
					domainOverrides: { seating: "nonsense", pathways: { playValue: false, usability: true } },
					updatedAt: 1000
				}
			})
		);

		const restored = loadReportFilter(identity, buildReportIdentity("audit-1"));
		assert.deepEqual(restored.overall, PLAY_VALUE_ONLY);
		assert.deepEqual(Object.keys(restored.domainOverrides), ["pathways"]);
	});
});

test("only the 100 most recently changed reports are kept", () => {
	withStorage(() => {
		const identity = buildCacheIdentity("reader@example.com");
		const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

		for (let index = 0; index < 105; index += 1) {
			saveReportFilter(identity, buildReportIdentity(`audit-${index}`), filter, index);
		}

		// audit-0 through audit-4 are the oldest and should have been evicted.
		assert.deepEqual(loadReportFilter(identity, buildReportIdentity("audit-0")), createDefaultReportFilter());
		assert.deepEqual(loadReportFilter(identity, buildReportIdentity("audit-104")).overall, PLAY_VALUE_ONLY);
	});
});

test("clearing an identity removes every stored selection for it", () => {
	withStorage(() => {
		const identity = buildCacheIdentity("reader@example.com");
		const reportIdentity = buildReportIdentity("audit-1");
		saveReportFilter(
			identity,
			reportIdentity,
			setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY),
			1
		);

		clearReportFilters(identity);

		assert.deepEqual(loadReportFilter(identity, reportIdentity), createDefaultReportFilter());
	});
});

test("an anonymous reader neither stores nor restores anything", () => {
	withStorage(storage => {
		saveReportFilter(null, buildReportIdentity("audit-1"), createDefaultReportFilter(), 1);
		assert.equal(storage.length, 0);
		assert.deepEqual(loadReportFilter(null, buildReportIdentity("audit-1")), createDefaultReportFilter());
	});
});

test("reading without any storage available returns the default filter", () => {
	const globalWithStorage = globalThis as { localStorage?: unknown };
	const previous = globalWithStorage.localStorage;
	delete globalWithStorage.localStorage;
	try {
		const identity = buildCacheIdentity("reader@example.com");
		assert.deepEqual(loadReportFilter(identity, buildReportIdentity("audit-1")), createDefaultReportFilter());
	} finally {
		globalWithStorage.localStorage = previous;
	}
});

test("showing the full report is temporary and leaves the stored selection intact", () => {
	withStorage(() => {
		resetReportFilterSnapshots();
		const identity = buildCacheIdentity("reader@example.com");
		const reportIdentity = buildReportIdentity("audit-1");
		const stored = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);

		writeReportFilterSnapshot(identity, reportIdentity, stored);
		writeReportFilterSnapshot(identity, reportIdentity, createDefaultReportFilter(), false);
		assert.deepEqual(readReportFilterSnapshot(identity, reportIdentity), createDefaultReportFilter());

		resetReportFilterSnapshots();
		assert.deepEqual(readReportFilterSnapshot(identity, reportIdentity), stored);
		resetReportFilterSnapshots();
	});
});

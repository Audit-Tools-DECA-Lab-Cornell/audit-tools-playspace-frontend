import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultReportFilter, setDomainOverride, setOverallSelection } from "@/lib/audit/report-filter";
import { buildExportFileName } from "@/lib/export/audit";
import { describeResultFilter } from "@/lib/export/audit/row-builders";

const PLAY_VALUE_ONLY = { playValue: true, usability: false };
const USABILITY_ONLY = { playValue: false, usability: true };

// ---------------------------------------------------------------------------
// Filenames: a filtered export must not silently overwrite a full one
// ---------------------------------------------------------------------------

test("an unfiltered export keeps the original filename", () => {
	assert.equal(buildExportFileName("AUDIT-1", "xlsx"), "pvua-audit-1.xlsx");
	assert.equal(buildExportFileName("AUDIT-1", "xlsx", createDefaultReportFilter()), "pvua-audit-1.xlsx");
});

test("a play-value-only export names the construct in its filename", () => {
	const filter = setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY);
	assert.equal(buildExportFileName("AUDIT-1", "pdf", filter), "pvua-audit-1-play-value.pdf");
});

test("a usability-only export names the construct in its filename", () => {
	const filter = setOverallSelection(createDefaultReportFilter(), USABILITY_ONLY);
	assert.equal(buildExportFileName("AUDIT-1", "pdf", filter), "pvua-audit-1-usability.pdf");
});

test("a domain-customized export is still marked filtered in its filename", () => {
	const filter = setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY);
	assert.equal(buildExportFileName("AUDIT-1", "xlsx", filter), "pvua-audit-1-filtered.xlsx");
});

// ---------------------------------------------------------------------------
// Provenance: the document body must say what it contains
// ---------------------------------------------------------------------------

test("an unfiltered export declares itself complete", () => {
	assert.equal(describeResultFilter(undefined), "Play Value and Usability (complete audit)");
	assert.equal(describeResultFilter(createDefaultReportFilter()), "Play Value and Usability (complete audit)");
});

test("a single-construct export says which construct it covers", () => {
	assert.equal(
		describeResultFilter(setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY)),
		"Play Value only"
	);
	assert.equal(
		describeResultFilter(setOverallSelection(createDefaultReportFilter(), USABILITY_ONLY)),
		"Usability only"
	);
});

test("a customized export says so alongside the construct", () => {
	const filter = setDomainOverride(
		setOverallSelection(createDefaultReportFilter(), PLAY_VALUE_ONLY),
		"seating",
		USABILITY_ONLY
	);
	assert.equal(describeResultFilter(filter), "Play Value only; some domains customized");
});

test("an export narrowed only by a domain override still reports customization", () => {
	const filter = setDomainOverride(createDefaultReportFilter(), "seating", USABILITY_ONLY);
	assert.equal(describeResultFilter(filter), "Play Value and Usability; some domains customized");
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildSociabilityDimensionRankings, type DomainReportRow } from "../../src/lib/audit/report-helpers";
import type { AuditScoreTotals } from "../../src/types/audit";

function totals(breakdown: AuditScoreTotals["sociability_breakdown"]): AuditScoreTotals {
	return {
		provision_total: 0,
		provision_total_max: 0,
		variety_total: 0,
		variety_total_max: 0,
		challenge_total: 0,
		challenge_total_max: 0,
		sociability_total: 0,
		sociability_total_max: 0,
		sociability_breakdown: breakdown,
		play_value_total: 0,
		play_value_total_max: 0,
		usability_total: 0,
		usability_total_max: 0
	};
}

function breakdown(
	playAlone: [number, number],
	smallGroup: [number, number],
	largeGroup: [number, number]
): NonNullable<AuditScoreTotals["sociability_breakdown"]> {
	return {
		model: "multi_select_v1",
		play_alone: { total: playAlone[0], max: playAlone[1] },
		small_group: { total: smallGroup[0], max: smallGroup[1] },
		large_group: { total: largeGroup[0], max: largeGroup[1] },
		captured_question_count: 1,
		eligible_question_count: 1
	};
}

function domain(domainTitle: string, scoreTotals: AuditScoreTotals): DomainReportRow {
	return { domainTitle, scoreTotals } as DomainReportRow;
}

test("each opportunity ranks independently by percentage of its own maximum", () => {
	const rows = [
		domain("Pathways", totals(breakdown([4, 4], [1, 4], [2, 4]))),
		domain("Seating", totals(breakdown([1, 2], [2, 2], [0, 2])))
	];

	const rankings = buildSociabilityDimensionRankings(rows);
	const playAlone = rankings.find(entry => entry.dimensionKey === "play_alone");
	const smallGroup = rankings.find(entry => entry.dimensionKey === "small_group");

	assert.equal(playAlone?.bestDomains[0]?.domainTitle, "Pathways");
	assert.equal(playAlone?.bestDomains[0]?.percent, 100);
	assert.equal(playAlone?.worstDomains[0]?.domainTitle, "Seating");
	assert.equal(playAlone?.worstDomains[0]?.percent, 50);
	assert.equal(
		smallGroup?.bestDomains[0]?.domainTitle,
		"Seating",
		"a domain can lead one opportunity and trail another"
	);
	assert.equal(smallGroup?.worstDomains[0]?.domainTitle, "Pathways");
});

test("every tied domain is listed, not just the first match", () => {
	const rows = [
		domain("Pathways", totals(breakdown([1, 2], [0, 2], [0, 2]))),
		domain("Seating", totals(breakdown([2, 4], [2, 2], [0, 2]))),
		domain("Planting", totals(breakdown([0, 2], [1, 2], [0, 2])))
	];

	const playAlone = buildSociabilityDimensionRankings(rows).find(entry => entry.dimensionKey === "play_alone");

	assert.deepEqual(
		playAlone?.bestDomains.map(entry => entry.domainTitle),
		["Pathways", "Seating"],
		"1/2 and 2/4 are the same share and rank together"
	);
	assert.deepEqual(
		playAlone?.worstDomains.map(entry => entry.domainTitle),
		["Planting"]
	);
	assert.equal(playAlone?.hasSufficientData, true);
	assert.equal(playAlone?.allTied, false);
});

test("one comparable domain is an insufficient-data state, never a winner", () => {
	const rows = [
		domain("Pathways", totals(breakdown([1, 2], [0, 0], [0, 0]))),
		domain("Seating", totals(breakdown([0, 0], [1, 2], [0, 0])))
	];

	const rankings = buildSociabilityDimensionRankings(rows);
	const playAlone = rankings.find(entry => entry.dimensionKey === "play_alone");

	assert.equal(playAlone?.comparableDomainCount, 1);
	assert.equal(playAlone?.hasSufficientData, false, "naming one domain both highest and lowest would mislead");
	assert.equal(
		playAlone?.bestDomains[0]?.domainTitle,
		"Pathways",
		"the single domain is still available for context"
	);
});

test("zero maximums are excluded rather than reported as 0%", () => {
	const rows = [
		domain("Pathways", totals(breakdown([0, 0], [0, 0], [0, 0]))),
		domain("Seating", totals(breakdown([0, 0], [0, 0], [0, 0])))
	];

	for (const ranking of buildSociabilityDimensionRankings(rows)) {
		assert.equal(ranking.comparableDomainCount, 0);
		assert.equal(ranking.hasSufficientData, false);
		assert.deepEqual(ranking.bestDomains, []);
		assert.equal(ranking.bestDomain, null);
	}
});

test("an all-tied opportunity is flagged so the report does not pick an arbitrary winner", () => {
	const rows = [
		domain("Pathways", totals(breakdown([1, 2], [0, 2], [0, 2]))),
		domain("Seating", totals(breakdown([2, 4], [0, 2], [0, 2])))
	];

	const playAlone = buildSociabilityDimensionRankings(rows).find(entry => entry.dimensionKey === "play_alone");

	assert.equal(playAlone?.allTied, true);
	assert.equal(playAlone?.bestDomains.length, 2);
	assert.equal(playAlone?.worstDomains.length, 2);
});

test("legacy rows without a breakdown contribute nothing instead of manufacturing zeros", () => {
	const rows = [domain("Pathways", totals(null)), domain("Seating", totals(null))];

	for (const ranking of buildSociabilityDimensionRankings(rows)) {
		assert.equal(ranking.comparableDomainCount, 0);
		assert.equal(ranking.hasSufficientData, false);
	}
});

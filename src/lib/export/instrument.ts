import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { PlayspaceInstrument } from "@/types/audit";

export type InstrumentContent = Record<string, PlayspaceInstrument>;
export type ExportFormat = "pdf" | "xlsx" | "csv" | "json";

interface FlatInstrumentRow {
	sectionNumber: string;
	sectionTitle: string;
	sectionDescription: string;
	sectionInstruction: string;
	sectionNotesPrompt: string;
	questionNumber: string;
	questionPrompt: string;
	questionOptions: string;
	questionType: string;
	questionMode: string;
	questionConstructs: string;
	questionRequired: string;
	questionScales: string;
	questionDisplayCondition: string;
}

/**
 * Trigger a file download from a Blob in a way that works
 * reliably inside Next.js client components.
 *
 * Uses a hidden iframe to avoid Next.js router intercepting the click.
 */
function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const iframe = document.createElement("iframe");
	iframe.style.display = "none";
	document.body.appendChild(iframe);

	const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
	if (iframeDoc) {
		const a = iframeDoc.createElement("a");
		a.href = url;
		a.download = filename;
		iframeDoc.body.appendChild(a);
		a.click();
	}

	setTimeout(() => {
		document.body.removeChild(iframe);
		URL.revokeObjectURL(url);
	}, 1000);
}

function stripMarkdown(text: string): string {
	if (!text) return "";
	return text.replace(/\*\*/g, "").replace(/\n/g, " ").trim();
}

function flattenInstrument(instrument: PlayspaceInstrument): FlatInstrumentRow[] {
	const rows: FlatInstrumentRow[] = [];

	if (!instrument?.sections) return rows;

	instrument.sections.forEach((section, sIndex) => {
		section.questions.forEach((q, qIndex) => {
			const qNumber = `q-${sIndex + 1}-${qIndex + 1}`;
			const optionsStr = q.options?.map(o => o.label).join(" | ") || "";
			const constructsStr = q.constructs?.join(", ") || "";
			const scalesStr = q.scales?.map(s => s.key).join(", ") || "";
			const conditionStr = q.display_if
				? `${q.display_if.question_key} (${q.display_if.response_key}) = ${q.display_if.any_of_option_keys.join(", ")}`
				: "";

			rows.push({
				sectionNumber: `Section ${sIndex + 1}`,
				sectionTitle: section.title || "",
				sectionDescription: stripMarkdown(section.description || ""),
				sectionInstruction: stripMarkdown(section.instruction || ""),
				sectionNotesPrompt: stripMarkdown(section.notes_prompt || ""),
				questionNumber: q.question_key || qNumber,
				questionPrompt: stripMarkdown(q.prompt || ""),
				questionOptions: optionsStr,
				questionType: q.question_type || "scaled",
				questionMode: q.mode || "",
				questionConstructs: constructsStr,
				questionRequired: q.required !== false ? "Yes" : "No",
				questionScales: scalesStr,
				questionDisplayCondition: conditionStr
			});
		});
	});

	return rows;
}

export function exportInstrument(
	content: InstrumentContent,
	version: string,
	format: ExportFormat,
	lang: string = "en"
) {
	const instrument = content[lang];
	if (!instrument) {
		return;
	}

	const fileName = `instrument-v${version}-${lang}`;

	if (format === "json") {
		const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
		downloadBlob(blob, `${fileName}.json`);
		return;
	}

	const flatRows = flattenInstrument(instrument);
	const headers = [
		"Section #",
		"Section Title",
		"Section Description",
		"Section Instruction",
		"Notes Prompt",
		"Question Key",
		"Prompt",
		"Options",
		"Type",
		"Mode",
		"Constructs",
		"Required",
		"Scales",
		"Display Condition"
	];

	const tableData = flatRows.map(row => [
		row.sectionNumber,
		row.sectionTitle,
		row.sectionDescription,
		row.sectionInstruction,
		row.sectionNotesPrompt,
		row.questionNumber,
		row.questionPrompt,
		row.questionOptions,
		row.questionType,
		row.questionMode,
		row.questionConstructs,
		row.questionRequired,
		row.questionScales,
		row.questionDisplayCondition
	]);

	if (format === "csv") {
		const ws = XLSX.utils.aoa_to_sheet([headers, ...tableData]);
		const csv = XLSX.utils.sheet_to_csv(ws);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		downloadBlob(blob, `${fileName}.csv`);
		return;
	}

	if (format === "xlsx") {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([headers, ...tableData]);
		XLSX.utils.book_append_sheet(wb, ws, "Instrument");
		const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		});
		downloadBlob(blob, `${fileName}.xlsx`);
		return;
	}

	if (format === "pdf") {
		const doc = new jsPDF({ orientation: "landscape" });
		doc.setFontSize(14);
		doc.text(`Instrument v${version} (${lang.toUpperCase()})`, 14, 15);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(doc as any).autoTable({
			head: [headers],
			body: tableData,
			startY: 20,
			styles: { fontSize: 8, cellPadding: 2 },
			headStyles: { fillColor: [41, 128, 185], textColor: 255 },
			columnStyles: {
				6: { cellWidth: 50 },
				2: { cellWidth: 30 }
			},
			margin: { top: 20 }
		});

		doc.save(`${fileName}.pdf`);
		return;
	}
}

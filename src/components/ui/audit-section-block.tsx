"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

interface AuditSectionBlockProps {
	domainNumber: number;
	domainName: string;
	sectionHeading: string;
	questionNumber: number;
	totalQuestions: number;
	sectionNumber: number;
	totalSections: number;
	questionText: string;
	progressPercent: number;
	hasProvisionScale?: boolean;
	onProvisionSelect?: (value: 0 | 1 | 2 | 3) => void;
	provisionValue?: 0 | 1 | 2 | 3 | null;
	autoSaveStatus?: "idle" | "saving" | "saved";
	children?: React.ReactNode;
}

export function AuditSectionBlock({
	domainNumber,
	domainName,
	sectionHeading,
	questionNumber,
	totalQuestions,
	sectionNumber,
	totalSections,
	questionText,
	progressPercent,
	hasProvisionScale = false,
	onProvisionSelect,
	provisionValue,
	autoSaveStatus = "idle",
	children
}: AuditSectionBlockProps) {
	const [provisionOpen, setProvisionOpen] = useState(false);
	const [savedMessageVisible, setSavedMessageVisible] = useState(false);

	useEffect(() => {
		if (autoSaveStatus !== "saved") {
			return;
		}
		const showFrame = requestAnimationFrame(() => {
			setSavedMessageVisible(true);
		});
		const hideTimer = window.setTimeout(() => {
			setSavedMessageVisible(false);
		}, 2000);
		return () => {
			cancelAnimationFrame(showFrame);
			window.clearTimeout(hideTimer);
		};
	}, [autoSaveStatus]);

	const showAutoSave = autoSaveStatus === "saving" || (autoSaveStatus === "saved" && savedMessageVisible);

	const provisionLabels: Record<0 | 1 | 2 | 3, string> = {
		0: "None",
		1: "Limited",
		2: "Moderate",
		3: "High"
	};

	return (
		<div className="relative space-y-4 border-b border-edge pb-6 last:border-b-0">
			<div className="space-y-3">
				<div className="font-heading text-[11px] font-medium tracking-[0.03em] text-accent-violet">
					Domain {domainNumber} · {domainName}
				</div>
				<h2 className="font-heading text-[22px] font-semibold text-text-primary">{sectionHeading}</h2>
				<div className="font-sans text-[12px] font-normal text-text-muted">
					Question {questionNumber} of {totalQuestions} · Section {sectionNumber} of {totalSections}
				</div>

				<div className="h-[2px] overflow-hidden rounded-[1px] bg-edge">
					<div
						className="h-full bg-accent-violet transition-[width] duration-[600ms] ease-spring"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			<div className="space-y-4">
				<p className="font-sans text-[13px] font-normal leading-relaxed text-text-secondary">{questionText}</p>

				{hasProvisionScale && (
					<div className="space-y-2">
						<button
							onClick={() => setProvisionOpen(!provisionOpen)}
							className="flex items-center gap-2 font-sans text-[13px] font-normal text-text-primary transition-colors duration-[200ms] ease-spring hover:text-accent-violet">
							<ChevronDown
								size={16}
								className={clsx(
									"transition-transform duration-[300ms] ease-spring",
									provisionOpen && "rotate-90"
								)}
							/>
							Provision Scale
						</button>

						<div
							className={clsx(
								"overflow-hidden transition-all duration-[300ms] ease-spring",
								provisionOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
							)}>
							<div className="space-y-2 pt-3">
								<div className="flex gap-2">
									{([0, 1, 2, 3] as const).map(value => (
										<button
											key={value}
											onClick={() => {
												onProvisionSelect?.(value);
											}}
											className={clsx(
												"flex-1 rounded-sm border px-2 py-1 text-center font-sans text-[12px] font-medium transition-all duration-[200ms] ease-spring",
												provisionValue === value
													? "border-accent-violet bg-accent-violet/10 text-accent-violet"
													: "border-edge bg-surface text-text-secondary hover:border-accent-violet hover:text-accent-violet"
											)}>
											{value} {provisionLabels[value]}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{children}
			</div>

			{showAutoSave && (
				<div className="absolute bottom-6 right-6 font-sans text-[11px] text-text-muted">
					{autoSaveStatus === "saving" && "Saving..."}
					{autoSaveStatus === "saved" && "Saved locally"}
				</div>
			)}
		</div>
	);
}

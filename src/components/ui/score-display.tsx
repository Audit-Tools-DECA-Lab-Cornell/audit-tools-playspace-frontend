"use client";

import { clsx } from "clsx";
import { useEffect, useState, useSyncExternalStore } from "react";

interface ScoreDisplayCompactProps {
	pv?: number | null;
	u?: number | null;
	s?: number | null;
	size?: "sm" | "md";
	animate?: boolean;
}

interface ScoreDisplayFullProps {
	pv?: number | null;
	u?: number | null;
	s?: number | null;
	pvTotal?: string;
	uTotal?: string;
	sTotal?: string;
	auditLabel?: string;
	animate?: boolean;
}

/**
 * Subscribes to the user's reduced-motion preference (client only; SSR assumes motion is allowed).
 */
function usePrefersReducedMotion(): boolean {
	return useSyncExternalStore(
		onStoreChange => {
			const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
			mediaQueryList.addEventListener("change", onStoreChange);
			return () => mediaQueryList.removeEventListener("change", onStoreChange);
		},
		() => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		() => false
	);
}

function useCountUp(target: number | null, duration: number, enabled: boolean): number | null {
	const [value, setValue] = useState(0);
	const prefersReducedMotion = usePrefersReducedMotion();

	useEffect(() => {
		if (!enabled || target === null || prefersReducedMotion) return;

		let rafId = 0;
		const start = Date.now();

		const tick = () => {
			const elapsed = Date.now() - start;
			const progress = Math.min(elapsed / duration, 1);
			const ease = 1 - Math.pow(1 - progress, 3);
			const currentValue = parseFloat((target * ease).toFixed(1));
			setValue(currentValue);

			if (progress < 1) {
				rafId = requestAnimationFrame(tick);
			}
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [target, duration, enabled, prefersReducedMotion]);

	if (target === null) return null;
	if (!enabled || prefersReducedMotion) return target;
	return value;
}

function ScoreDimension({
	label,
	shortLabel,
	value,
	total,
	size = "md"
}: {
	label: string;
	shortLabel: string;
	value: number | null;
	total?: string;
	size?: "sm" | "md";
}) {
	const sizeClasses = {
		sm: "text-[16px]",
		md: "text-[22px]"
	};

	if (value === null) {
		return (
			<div className="flex items-baseline gap-2" aria-label={label}>
				<div className="font-heading text-[10px] font-semibold tracking-[0.02em] text-accent-violet">
					{shortLabel}
				</div>
				<div className={clsx("font-heading font-bold text-text-muted", sizeClasses[size])}>—</div>
				{total && <div className="font-mono text-[10px] text-text-muted">{total}</div>}
			</div>
		);
	}

	return (
		<div className="flex items-baseline gap-2" aria-label={label}>
			<div className="font-heading text-[10px] font-semibold tracking-[0.02em] text-accent-violet">
				{shortLabel}
			</div>
			<div className={clsx("font-heading font-bold text-accent-moss", sizeClasses[size])}>{value.toFixed(1)}</div>
			{total && <div className="font-mono text-[10px] text-text-muted">{total}</div>}
		</div>
	);
}

export function ScoreDisplayCompact({ pv, u, s, size = "md", animate = false }: ScoreDisplayCompactProps) {
	const pvAnimated = useCountUp(pv ?? null, 700, animate);
	const uAnimated = useCountUp(u ?? null, 700, animate);
	const sAnimated = useCountUp(s ?? null, 700, animate);

	return (
		<div className="flex flex-wrap items-baseline gap-4">
			<ScoreDimension label="Play Value" shortLabel="PV" value={pvAnimated} size={size} />
			<span className="text-text-muted opacity-50">·</span>
			<ScoreDimension label="Usability" shortLabel="U" value={uAnimated} size={size} />
			{s !== undefined && s !== null && (
				<>
					<span className="text-text-muted opacity-50">·</span>
					<ScoreDimension label="Sociability" shortLabel="S" value={sAnimated} size={size} />
				</>
			)}
		</div>
	);
}

export function ScoreDisplayFull({
	pv,
	u,
	s,
	pvTotal,
	uTotal,
	sTotal,
	auditLabel,
	animate = true
}: ScoreDisplayFullProps) {
	const pvAnimated = useCountUp(pv ?? null, 1000, animate);
	const uAnimated = useCountUp(u ?? null, 1000, animate);
	const sAnimated = useCountUp(s ?? null, 1000, animate);

	return (
		<div className="space-y-6">
			{auditLabel && <div className="font-mono text-[11px] text-text-muted">{auditLabel}</div>}
			<div className="grid grid-cols-3 gap-8">
				<div className="space-y-2">
					<div className="font-heading text-[10px] font-semibold tracking-[0.02em] uppercase text-accent-violet">
						Play Value
					</div>
					<div className="font-heading text-[36px] font-bold text-accent-moss">
						{pvAnimated === null ? "—" : pvAnimated.toFixed(1)}
					</div>
					{pvTotal && <div className="font-mono text-[10px] text-text-muted">{pvTotal}</div>}
				</div>
				<div className="space-y-2">
					<div className="font-heading text-[10px] font-semibold tracking-[0.02em] uppercase text-accent-violet">
						Usability
					</div>
					<div className="font-heading text-[36px] font-bold text-accent-moss">
						{uAnimated === null ? "—" : uAnimated.toFixed(1)}
					</div>
					{uTotal && <div className="font-mono text-[10px] text-text-muted">{uTotal}</div>}
				</div>
				<div className="space-y-2">
					<div className="font-heading text-[10px] font-semibold tracking-[0.02em] uppercase text-accent-violet">
						Sociability
					</div>
					<div className="font-heading text-[36px] font-bold text-accent-moss">
						{sAnimated === null ? "—" : sAnimated.toFixed(1)}
					</div>
					{sTotal && <div className="font-mono text-[10px] text-text-muted">{sTotal}</div>}
				</div>
			</div>
		</div>
	);
}

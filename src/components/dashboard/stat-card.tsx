import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "warning" | "violet";

const toneClassesByTone: Record<StatTone, string> = {
	primary: "bg-[color:rgba(197,138,92,0.92)]",
	success: "bg-[color:rgba(111,154,127,0.92)]",
	warning: "bg-[color:rgba(185,154,90,0.92)]",
	violet: "bg-[color:rgba(155,134,178,0.92)]"
};

export interface StatCardProps {
	title: string;
	value: string;
	helper: string;
	tone?: StatTone;
	valueClassName?: string;
}

/**
 * Compact KPI card shared across dashboard pages.
 */
export function StatCard({ title, value, helper, tone = "primary", valueClassName }: Readonly<StatCardProps>) {
	return (
		<Card className="relative gap-0 overflow-hidden border-border/80 bg-card/95">
			<div className={cn("absolute inset-x-0 top-0 h-1", toneClassesByTone[tone])} aria-hidden="true" />
			<CardHeader className="gap-2 border-border/50 pt-5">
				<CardTitle className="text-xs font-semibold tracking-[0.08em] text-foreground/70">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2.5 pb-5">
				<div
					className={cn(
						"max-w-full overflow-hidden text-ellipsis font-mono text-[2rem] font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-[2.3rem]",
						valueClassName
					)}>
					{value}
				</div>
				<p className="max-w-[28ch] text-sm leading-5 text-muted-foreground">{helper}</p>
			</CardContent>
		</Card>
	);
}

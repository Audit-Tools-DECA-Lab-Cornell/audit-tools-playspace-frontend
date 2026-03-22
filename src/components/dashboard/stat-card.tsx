import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "warning" | "violet";

const toneClassesByTone: Record<StatTone, string> = {
	primary: "border-[color:rgba(197,138,92,0.24)] bg-[color:rgba(197,138,92,0.08)]",
	success: "border-[color:rgba(111,154,127,0.24)] bg-[color:rgba(111,154,127,0.08)]",
	warning: "border-[color:rgba(185,154,90,0.24)] bg-[color:rgba(185,154,90,0.08)]",
	violet: "border-[color:rgba(155,134,178,0.24)] bg-[color:rgba(155,134,178,0.08)]"
};

export interface StatCardProps {
	title: string;
	value: string;
	helper: string;
	tone?: StatTone;
}

/**
 * Compact KPI card shared across dashboard pages.
 */
export function StatCard({ title, value, helper, tone = "primary" }: Readonly<StatCardProps>) {
	return (
		<Card className={cn("gap-0 overflow-hidden", toneClassesByTone[tone])}>
			<CardHeader className="gap-2 border-border/50">
				<CardTitle className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 pb-5">
				<div className="font-mono text-[2rem] font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-[2.3rem]">
					{value}
				</div>
				<p className="text-sm leading-5 text-muted-foreground">{helper}</p>
			</CardContent>
		</Card>
	);
}

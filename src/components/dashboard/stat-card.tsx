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
		<Card className={cn("gap-3 py-5", toneClassesByTone[tone])}>
			<CardHeader className="gap-1">
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				<div className="font-mono text-3xl font-semibold text-foreground">{value}</div>
				<p className="text-sm text-muted-foreground">{helper}</p>
			</CardContent>
		</Card>
	);
}

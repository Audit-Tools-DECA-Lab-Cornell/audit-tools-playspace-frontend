import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	title: string;
	value: string;
	helper: string;
	valueClassName?: string;
}

export function StatCard({ title, value, helper, valueClassName }: Readonly<StatCardProps>) {
	return (
		<Card className="relative flex flex-col justify-between gap-6 overflow-hidden border-border bg-card/95">
			<CardHeader className="gap-2 border-border/70">
				<CardTitle className="text-[13px] font-semibold tracking-[0.08em] text-text-secondary">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2.5">
				<div
					className={cn(
						"max-w-full overflow-hidden text-ellipsis font-mono text-[2.3rem] font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-[2.5rem]",
						valueClassName
					)}>
					{value}
				</div>
				<p className="max-w-[28ch] text-sm leading-5 text-muted-foreground">{helper}</p>
			</CardContent>
		</Card>
	);
}

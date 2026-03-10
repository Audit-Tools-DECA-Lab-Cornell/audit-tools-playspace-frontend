import type { ReactNode } from "react";

export interface DashboardHeaderProps {
	title: string;
	description: string;
	eyebrow?: string;
	actions?: ReactNode;
}

/**
 * Shared page header for dashboard screens.
 */
export function DashboardHeader({ title, description, eyebrow, actions }: Readonly<DashboardHeaderProps>) {
	return (
		<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div className="space-y-2">
				{eyebrow ? (
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						{eyebrow}
					</p>
				) : null}
				<div className="space-y-1">
					<h1 className="text-3xl font-semibold">{title}</h1>
					<p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
				</div>
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</div>
	);
}

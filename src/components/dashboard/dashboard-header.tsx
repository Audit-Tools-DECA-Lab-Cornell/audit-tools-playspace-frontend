import type { ReactNode } from "react";
import Link from "next/link";

import {
	Breadcrumb,
	BreadcrumbLink,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export interface DashboardHeaderProps {
	title: string;
	description: string;
	eyebrow?: string;
	actions?: ReactNode;
	breadcrumbs?: Array<{
		label: string;
		href?: string;
	}>;
}

/**
 * Shared page header for dashboard screens.
 */
export function DashboardHeader({
	title,
	description,
	eyebrow,
	actions,
	breadcrumbs = []
}: Readonly<DashboardHeaderProps>) {
	return (
		<div className="space-y-4">
			{breadcrumbs.length > 0 ? (
				<div className="px-1">
					<Breadcrumb>
						<BreadcrumbList className="text-xs font-medium tracking-[0.12em] uppercase">
							{breadcrumbs.map((item, index) => {
								const isLastItem = index === breadcrumbs.length - 1;

								return (
									<BreadcrumbItem key={`${item.label}_${index}`}>
										{item.href && !isLastItem ? (
											<BreadcrumbLink asChild>
												<Link href={item.href}>{item.label}</Link>
											</BreadcrumbLink>
										) : (
											<BreadcrumbPage>{item.label}</BreadcrumbPage>
										)}
										{!isLastItem && <BreadcrumbSeparator />}
									</BreadcrumbItem>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			) : null}
			<div className="flex flex-col gap-4 rounded-card border border-border/70 bg-card/70 p-6 shadow-card md:p-7">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						{eyebrow ? (
							<p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								{eyebrow}
							</p>
						) : null}
						<div className="space-y-1.5">
							<h1 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">{title}</h1>
							<p className="max-w-4xl text-sm leading-6 text-muted-foreground md:text-base">
								{description}
							</p>
						</div>
					</div>
					{actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
				</div>
			</div>
		</div>
	);
}

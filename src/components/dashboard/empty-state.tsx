import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface EmptyStateProps {
	title: string;
	description: string;
	action?: ReactNode;
}

/**
 * Reusable empty-state panel for dashboard lists.
 */
export function EmptyState({ title, description, action }: Readonly<EmptyStateProps>) {
	return (
		<Card className="border-dashed bg-card/70">
			<CardHeader className="gap-1.5">
				<CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
				<CardDescription className="max-w-2xl">{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">{action}</CardContent>
		</Card>
	);
}

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
		<Card className="border-dashed">
			<CardHeader className="gap-1">
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
				{action}
			</CardContent>
		</Card>
	);
}

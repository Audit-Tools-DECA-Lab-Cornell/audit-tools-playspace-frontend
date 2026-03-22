import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Lightweight loading placeholder used across dashboard cards, tables, and forms.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
	return (
		<div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-secondary/75", className)} {...props} />
	);
}

export { Skeleton };

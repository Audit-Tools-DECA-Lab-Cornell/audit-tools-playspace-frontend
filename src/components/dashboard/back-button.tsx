"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
	href: string;
	label: string;
	className?: string;
}

/**
 * Shared back-navigation action used across detail and settings screens.
 */
export function BackButton({ href, label, className }: Readonly<BackButtonProps>) {
	return (
		<Button asChild variant="outline" className={cn("gap-2", className)}>
			<Link href={href}>
				<ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
				<span>{label}</span>
			</Link>
		</Button>
	);
}

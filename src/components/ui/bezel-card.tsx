import { clsx } from "clsx";

interface BezelCardProps {
	children: React.ReactNode;
	className?: string;
	accentOnHover?: boolean;
}

export function BezelCard({
	children,
	className,
	accentOnHover = true,
}: BezelCardProps) {
	return (
		<div
			className={clsx(
				"rounded-[14px] border border-white/[0.055] bg-surface-raised p-[2px]",
				"transition-colors duration-[400ms] ease-spring",
				accentOnHover && "hover:border-[rgba(197,138,92,0.25)]",
				className
			)}
		>
			<div className="relative overflow-hidden rounded-[12px] border border-white/[0.03] bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div className="pointer-events-none absolute inset-0 h-[40%] rounded-t-[12px] bg-gradient-to-b from-white/[0.025] to-transparent" />
				{children}
			</div>
		</div>
	);
}

export function BezelCardBody({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={clsx("p-4 md:p-[18px]", className)}>{children}</div>
	);
}

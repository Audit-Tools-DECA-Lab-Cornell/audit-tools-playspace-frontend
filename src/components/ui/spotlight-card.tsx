"use client";

import { clsx } from "clsx";
import { useState } from "react";

interface SpotlightCardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

export function SpotlightCard({ children, className, onClick }: SpotlightCardProps) {
	const [pos, setPos] = useState({ x: 50, y: 50 });

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setPos({
			x: ((e.clientX - rect.left) / rect.width) * 100,
			y: ((e.clientY - rect.top) / rect.height) * 100
		});
	};

	return (
		<div
			className={clsx(
				"group relative overflow-hidden rounded-[12px] border border-edge bg-surface-raised",
				"transition-transform duration-[300ms] ease-spring",
				"hover:-translate-y-px",
				onClick && "cursor-pointer",
				className
			)}
			onClick={onClick}
			onMouseMove={handleMouseMove}>
			<div
				className="pointer-events-none absolute inset-0 rounded-[12px] opacity-0 transition-opacity duration-[350ms] ease-out-fast group-hover:opacity-100"
				style={{
					background: `radial-gradient(220px circle at ${pos.x}% ${pos.y}%, rgba(197, 138, 92, 0.18), transparent 70%)`
				}}
			/>
			{children}
		</div>
	);
}

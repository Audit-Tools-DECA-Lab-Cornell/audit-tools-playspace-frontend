import type { Config } from "tailwindcss";

/**
 * Tailwind configuration for the Resilient Field Kit aesthetic.
 * Step 1: Define content sources for class scanning.
 * Step 2: Extend tokens with tactile shadows and friendly radii.
 * Step 3: Keep the plugin list explicit and predictable.
 */
const config: Config = {
	content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
	theme: {
		extend: {
			// Step 1: Provide rounded shapes that feel hand-friendly.
			borderRadius: {
				field: "var(--radius)",
				card: "calc(var(--radius) + 4px)",
				pill: "999px"
			},
			// Step 2: Define tactile depth for cards and inputs.
			boxShadow: {
				card: "0 2px 8px var(--shadow-key), 0 1px 0 var(--shadow-highlight) inset",
				field: "inset 0 2px 3px var(--shadow-inset), inset 0 0 0 1px var(--shadow-border)",
				lift: "0 8px 16px var(--shadow-key), 0 2px 6px var(--shadow-ambient)",
				press: "inset 0 3px 6px var(--shadow-inset), inset 0 0 0 1px var(--shadow-border)"
			},
			// Step 3: Keep motion snappy for fast field work.
			transitionTimingFunction: {
				field: "cubic-bezier(0.2, 0.8, 0.2, 1)"
			}
		}
	},
	plugins: []
};

export default config;

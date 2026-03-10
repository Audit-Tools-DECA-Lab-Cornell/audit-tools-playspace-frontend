import type { Config } from "tailwindcss";

/**
 * Tailwind configuration for the shared Playspace dashboard aesthetic.
 * Step 1: Define content sources for class scanning.
 * Step 2: Mirror the mobile radii and shadow treatment.
 * Step 3: Keep the plugin list explicit and predictable.
 */
const config: Config = {
	content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
	theme: {
		extend: {
			// Step 1: Mirror the mobile radii scale.
			borderRadius: {
				field: "12px",
				card: "20px",
				pill: "999px"
			},
			// Step 2: Port the warmer mobile shadow treatment.
			boxShadow: {
				accent: "0 0 14px rgba(197, 138, 92, 0.12)",
				card: "0 10px 24px rgba(0, 0, 0, 0.14)",
				field: "inset 0 0 0 1px rgba(58, 52, 48, 0.9)",
				lift: "0 18px 40px rgba(0, 0, 0, 0.2)",
				press: "inset 0 2px 6px rgba(0, 0, 0, 0.18)"
			},
			// Step 3: Keep motion snappy but a little softer than before.
			transitionTimingFunction: {
				field: "cubic-bezier(0.2, 0.8, 0.2, 1)"
			}
		}
	},
	plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
	theme: {
		extend: {
			borderRadius: {
				field: "6px",
				card: "8px",
				pill: "14px"
			},
			boxShadow: {
				accent: "0 0 14px rgba(197, 138, 92, 0.12)",
				card: "0 10px 24px rgba(0, 0, 0, 0.14)",
				field: "inset 0 0 0 1px rgba(58, 52, 48, 0.9)",
				lift: "0 18px 40px rgba(0, 0, 0, 0.2)",
				press: "inset 0 2px 6px rgba(0, 0, 0, 0.18)"
			},
			transitionTimingFunction: {
				field: "cubic-bezier(0.2, 0.8, 0.2, 1)"
			}
		}
	},
	plugins: []
};

export default config;

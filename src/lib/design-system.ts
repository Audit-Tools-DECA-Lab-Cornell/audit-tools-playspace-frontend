/**
 * Centralized design tokens shared across the web workspace.
 *
 * The values in this file intentionally drive CSS custom properties so the
 * visual system can be reused by other applications without copying raw class
 * names or editing multiple CSS files.
 */
export type DesignSystemThemeMode = "light" | "dark";
export type DesignSystemContrastMode = "standard" | "high";

interface DesignSystemPalette {
	readonly canvas: string;
	readonly surface: string;
	readonly surfaceRaised: string;
	readonly surfaceSunken: string;
	readonly textPrimary: string;
	readonly textSecondary: string;
	readonly textMuted: string;
	readonly edge: string;
	readonly focus: string;
	readonly accentTerracotta: string;
	readonly accentMoss: string;
	readonly accentSlate: string;
	readonly accentViolet: string;
	readonly statusSuccess: string;
	readonly statusWarning: string;
	readonly statusDanger: string;
	readonly statusPending: string;
	readonly statusInProgress: string;
	readonly statusSuccessSurface: string;
	readonly statusSuccessBorder: string;
	readonly statusWarningSurface: string;
	readonly statusWarningBorder: string;
	readonly statusDangerSurface: string;
	readonly statusDangerBorder: string;
	readonly statusPendingSurface: string;
	readonly statusPendingBorder: string;
	readonly statusInProgressSurface: string;
	readonly statusInProgressBorder: string;
	readonly statusInfoSurface: string;
	readonly statusInfoBorder: string;
	readonly primaryForeground: string;
	readonly inputBorder: string;
	readonly actionOutlineBorder: string;
	readonly tableRowHover: string;
	readonly statAccentNeutral: string;
}

interface DesignSystemVariableInput {
	readonly theme: DesignSystemThemeMode;
	readonly contrast: DesignSystemContrastMode;
	readonly fontScale?: number;
	readonly dyslexicFont?: boolean;
}

export const DESIGN_SYSTEM = {
	defaultTheme: "dark",
	defaultContrast: "standard",
	fontScale: {
		min: 0.85,
		max: 1.3,
		default: 1
	},
	radii: {
		sm: "4px",
		md: "6px",
		lg: "8px",
		xl: "10px",
		"2xl": "12px",
		"3xl": "14px",
		"4xl": "16px"
	},
	typography: {
		sectionTitle: {
			size: "1.25rem",
			sizeDesktop: "1.375rem",
			lineHeight: "1.2",
			tracking: "-0.01em",
			weight: "600"
		},
		eyebrow: {
			size: "0.75rem",
			tracking: "0.12em",
			weight: "600"
		},
		workspaceLabel: {
			size: "0.75rem",
			tracking: "0.08em",
			weight: "600"
		}
	},
	fonts: {
		body: {
			variable: "--font-body",
			loader: {
				subsets: ["latin"]
			},
			stack: 'var(--font-body), "Geist", sans-serif'
		},
		heading: {
			variable: "--font-heading",
			loader: {
				subsets: ["latin"],
				weight: ["500", "700"]
			},
			stack: 'var(--font-heading), "Space Grotesk", var(--font-body), sans-serif'
		},
		mono: {
			variable: "--font-code",
			loader: {
				subsets: ["latin"]
			},
			stack: 'var(--font-code), "JetBrains Mono", ui-monospace, monospace'
		},
		dyslexicStack: '"OpenDyslexic"',
		dyslexicFont: false
	},
	palettes: {
		light: {
			standard: {
				canvas: "#f7f1eb",
				surface: "#fdf8f3",
				surfaceRaised: "#ffffff",
				surfaceSunken: "#ede6da",
				textPrimary: "#1e1a16",
				textSecondary: "#4a423a",
				textMuted: "#7a6e62",
				edge: "rgba(30, 26, 22, 0.15)",
				focus: "#b8743f",
				accentTerracotta: "#c58a5c",
				accentMoss: "#3d7554",
				accentSlate: "#7b90b8",
				accentViolet: "#9b86b2",
				statusSuccess: "#5f8d70",
				statusWarning: "#a88439",
				statusDanger: "#b36554",
				statusPending: "#857567",
				statusInProgress: "#c58a5c",
				statusSuccessSurface: "rgba(95, 141, 112, 0.14)",
				statusSuccessBorder: "rgba(95, 141, 112, 0.28)",
				statusWarningSurface: "rgba(168, 132, 57, 0.14)",
				statusWarningBorder: "rgba(168, 132, 57, 0.28)",
				statusDangerSurface: "rgba(179, 101, 84, 0.14)",
				statusDangerBorder: "rgba(179, 101, 84, 0.28)",
				statusPendingSurface: "rgba(133, 117, 103, 0.12)",
				statusPendingBorder: "rgba(133, 117, 103, 0.24)",
				statusInProgressSurface: "rgba(197, 138, 92, 0.12)",
				statusInProgressBorder: "rgba(197, 138, 92, 0.24)",
				statusInfoSurface: "rgba(123, 144, 184, 0.14)",
				statusInfoBorder: "rgba(123, 144, 184, 0.28)",
				primaryForeground: "#ffffff",
				inputBorder: "#c4b8ad",
				actionOutlineBorder: "rgba(47, 39, 34, 0.22)",
				tableRowHover: "rgba(47, 39, 34, 0.04)",
				statAccentNeutral: "rgba(47, 39, 34, 0.12)"
			},
			high: {
				canvas: "#ffffff",
				surface: "#ffffff",
				surfaceRaised: "#ffffff",
				surfaceSunken: "#f3f3f3",
				textPrimary: "#111111",
				textSecondary: "#2f2822",
				textMuted: "#50463f",
				edge: "#57504a",
				focus: "#8a4a1b",
				accentTerracotta: "#8a4a1b",
				accentMoss: "#1f5b33",
				accentSlate: "#163a70",
				accentViolet: "#4d3a70",
				statusSuccess: "#1f5b33",
				statusWarning: "#6f5600",
				statusDanger: "#8e231a",
				statusPending: "#40362f",
				statusInProgress: "#8a4a1b",
				statusSuccessSurface: "rgba(31, 91, 51, 0.16)",
				statusSuccessBorder: "rgba(31, 91, 51, 0.32)",
				statusWarningSurface: "rgba(111, 86, 0, 0.16)",
				statusWarningBorder: "rgba(111, 86, 0, 0.32)",
				statusDangerSurface: "rgba(142, 35, 26, 0.16)",
				statusDangerBorder: "rgba(142, 35, 26, 0.32)",
				statusPendingSurface: "rgba(64, 54, 47, 0.12)",
				statusPendingBorder: "rgba(64, 54, 47, 0.26)",
				statusInProgressSurface: "rgba(138, 74, 27, 0.14)",
				statusInProgressBorder: "rgba(138, 74, 27, 0.28)",
				statusInfoSurface: "rgba(22, 58, 112, 0.16)",
				statusInfoBorder: "rgba(22, 58, 112, 0.32)",
				primaryForeground: "#ffffff",
				inputBorder: "#8a8078",
				actionOutlineBorder: "rgba(17, 17, 17, 0.36)",
				tableRowHover: "rgba(17, 17, 17, 0.08)",
				statAccentNeutral: "rgba(17, 17, 17, 0.2)"
			}
		},
		dark: {
			standard: {
				canvas: "#171310",
				surface: "#211c17",
				surfaceRaised: "#2c241d",
				surfaceSunken: "#120f0c",
				textPrimary: "#ede5d8",
				textSecondary: "#c4b9ae",
				textMuted: "#968880",
				edge: "#3d342c",
				focus: "#d09a70",
				accentTerracotta: "#c58a5c",
				accentMoss: "#5e9470",
				accentSlate: "#7a90b7",
				accentViolet: "#9b86b2",
				statusSuccess: "#6f9a7f",
				statusWarning: "#b99a5a",
				statusDanger: "#c98472",
				statusPending: "#9f9486",
				statusInProgress: "#c58a5c",
				statusSuccessSurface: "rgba(111, 154, 127, 0.16)",
				statusSuccessBorder: "rgba(111, 154, 127, 0.3)",
				statusWarningSurface: "rgba(185, 154, 90, 0.16)",
				statusWarningBorder: "rgba(185, 154, 90, 0.3)",
				statusDangerSurface: "rgba(201, 132, 114, 0.16)",
				statusDangerBorder: "rgba(201, 132, 114, 0.3)",
				statusPendingSurface: "rgba(159, 148, 134, 0.12)",
				statusPendingBorder: "rgba(159, 148, 134, 0.24)",
				statusInProgressSurface: "rgba(197, 138, 92, 0.16)",
				statusInProgressBorder: "rgba(197, 138, 92, 0.3)",
				statusInfoSurface: "rgba(123, 144, 184, 0.16)",
				statusInfoBorder: "rgba(123, 144, 184, 0.3)",
				primaryForeground: "#ffffff",
				inputBorder: "#5a524c",
				actionOutlineBorder: "rgba(235, 227, 215, 0.30)",
				tableRowHover: "rgba(255, 255, 255, 0.06)",
				statAccentNeutral: "rgba(235, 227, 215, 0.16)"
			},
			high: {
				canvas: "#000000",
				surface: "#0f0f0f",
				surfaceRaised: "#141414",
				surfaceSunken: "#050505",
				textPrimary: "#ffffff",
				textSecondary: "#efefef",
				textMuted: "#d2d2d2",
				edge: "#8e8e8e",
				focus: "#ffd0a8",
				accentTerracotta: "#ffd0a8",
				accentMoss: "#91d4a7",
				accentSlate: "#a8c2f5",
				accentViolet: "#d0b8f4",
				statusSuccess: "#91d4a7",
				statusWarning: "#f1cf6a",
				statusDanger: "#f2a392",
				statusPending: "#d8d8d8",
				statusInProgress: "#ffd0a8",
				statusSuccessSurface: "rgba(145, 212, 167, 0.16)",
				statusSuccessBorder: "rgba(145, 212, 167, 0.34)",
				statusWarningSurface: "rgba(241, 207, 106, 0.16)",
				statusWarningBorder: "rgba(241, 207, 106, 0.34)",
				statusDangerSurface: "rgba(242, 163, 146, 0.16)",
				statusDangerBorder: "rgba(242, 163, 146, 0.34)",
				statusPendingSurface: "rgba(216, 216, 216, 0.14)",
				statusPendingBorder: "rgba(216, 216, 216, 0.3)",
				statusInProgressSurface: "rgba(255, 208, 168, 0.18)",
				statusInProgressBorder: "rgba(255, 208, 168, 0.36)",
				statusInfoSurface: "rgba(168, 194, 245, 0.18)",
				statusInfoBorder: "rgba(168, 194, 245, 0.36)",
				primaryForeground: "#000000",
				inputBorder: "#a0a0a0",
				actionOutlineBorder: "rgba(255, 255, 255, 0.42)",
				tableRowHover: "rgba(255, 255, 255, 0.1)",
				statAccentNeutral: "rgba(255, 255, 255, 0.22)"
			}
		}
	} satisfies Record<DesignSystemThemeMode, Record<DesignSystemContrastMode, DesignSystemPalette>>
} as const;

/**
 * Clamp requested font scaling into the supported application range.
 */
export function clampDesignSystemFontScale(scale: number): number {
	return Math.round(Math.max(DESIGN_SYSTEM.fontScale.min, Math.min(DESIGN_SYSTEM.fontScale.max, scale)) * 100) / 100;
}

/**
 * Resolve a CSS custom-property map for the active theme and contrast mode.
 */
export function getDesignSystemCssVariables(input: Readonly<DesignSystemVariableInput>): Record<string, string> {
	const palette = DESIGN_SYSTEM.palettes[input.theme][input.contrast];
	const fontScale = clampDesignSystemFontScale(input.fontScale ?? DESIGN_SYSTEM.fontScale.default);

	return {
		"--radius": "6px",
		"--app-font-scale": String(fontScale),
		"--font-body-stack": input.dyslexicFont ? DESIGN_SYSTEM.fonts.dyslexicStack : DESIGN_SYSTEM.fonts.body.stack,
		"--font-heading-stack": input.dyslexicFont
			? DESIGN_SYSTEM.fonts.dyslexicStack
			: DESIGN_SYSTEM.fonts.heading.stack,
		"--font-code-stack": DESIGN_SYSTEM.fonts.mono.stack,
		"--font-body-active": input.dyslexicFont ? DESIGN_SYSTEM.fonts.dyslexicStack : DESIGN_SYSTEM.fonts.body.stack,
		"--font-heading-active": input.dyslexicFont
			? DESIGN_SYSTEM.fonts.dyslexicStack
			: DESIGN_SYSTEM.fonts.heading.stack,
		"--font-code-active": input.dyslexicFont ? DESIGN_SYSTEM.fonts.dyslexicStack : DESIGN_SYSTEM.fonts.mono.stack,
		"--font-dyslexic": DESIGN_SYSTEM.fonts.dyslexicStack,
		"--canvas": palette.canvas,
		"--surface": palette.surface,
		"--surface-raised": palette.surfaceRaised,
		"--surface-sunken": palette.surfaceSunken,
		"--text-primary": palette.textPrimary,
		"--text-secondary": palette.textSecondary,
		"--text-muted": palette.textMuted,
		"--ink": palette.textPrimary,
		"--ink-muted": palette.textSecondary,
		"--edge": palette.edge,
		"--focus": palette.focus,
		"--accent-terracotta": palette.accentTerracotta,
		"--accent-moss": palette.accentMoss,
		"--accent-slate": palette.accentSlate,
		"--accent-violet": palette.accentViolet,
		"--status-success": palette.statusSuccess,
		"--status-warning": palette.statusWarning,
		"--status-danger": palette.statusDanger,
		"--status-complete": palette.statusSuccess,
		"--status-in-progress": palette.statusInProgress,
		"--status-pending": palette.statusPending,
		"--status-success-surface": palette.statusSuccessSurface,
		"--status-success-border": palette.statusSuccessBorder,
		"--status-warning-surface": palette.statusWarningSurface,
		"--status-warning-border": palette.statusWarningBorder,
		"--status-danger-surface": palette.statusDangerSurface,
		"--status-danger-border": palette.statusDangerBorder,
		"--status-pending-surface": palette.statusPendingSurface,
		"--status-pending-border": palette.statusPendingBorder,
		"--status-in-progress-surface": palette.statusInProgressSurface,
		"--status-in-progress-border": palette.statusInProgressBorder,
		"--status-info-surface": palette.statusInfoSurface,
		"--status-info-border": palette.statusInfoBorder,
		"--background": palette.canvas,
		"--foreground": palette.textPrimary,
		"--card": palette.surface,
		"--card-foreground": palette.textPrimary,
		"--popover": palette.surfaceRaised,
		"--popover-foreground": palette.textPrimary,
		"--primary": palette.accentTerracotta,
		"--primary-foreground": palette.primaryForeground,
		"--secondary": palette.surfaceRaised,
		"--secondary-foreground": palette.textPrimary,
		"--muted": palette.surfaceSunken,
		"--muted-foreground": palette.textSecondary,
		"--accent": palette.surfaceRaised,
		"--accent-foreground": palette.textPrimary,
		"--destructive": palette.statusDanger,
		"--border": palette.edge,
		"--input": palette.surface,
		"--input-border": palette.inputBorder,
		"--ring": palette.focus,
		"--chart-1": palette.accentTerracotta,
		"--chart-2": palette.statusSuccess,
		"--chart-3": palette.accentSlate,
		"--chart-4": palette.statusWarning,
		"--chart-5": palette.accentViolet,
		"--sidebar": palette.surface,
		"--sidebar-foreground": palette.textPrimary,
		"--sidebar-primary": palette.accentTerracotta,
		"--sidebar-primary-foreground": palette.primaryForeground,
		"--sidebar-accent": palette.surfaceRaised,
		"--sidebar-accent-foreground": palette.textPrimary,
		"--sidebar-border": palette.edge,
		"--sidebar-ring": palette.focus,
		"--action-outline-border": palette.actionOutlineBorder,
		"--table-row-hover": palette.tableRowHover,
		"--stat-accent-neutral": palette.statAccentNeutral,
		"--stat-accent-info": palette.accentSlate,
		"--section-title-size": DESIGN_SYSTEM.typography.sectionTitle.size,
		"--section-title-size-lg": DESIGN_SYSTEM.typography.sectionTitle.sizeDesktop,
		"--section-title-line-height": DESIGN_SYSTEM.typography.sectionTitle.lineHeight,
		"--section-title-tracking": DESIGN_SYSTEM.typography.sectionTitle.tracking,
		"--section-title-weight": DESIGN_SYSTEM.typography.sectionTitle.weight,
		"--eyebrow-size": DESIGN_SYSTEM.typography.eyebrow.size,
		"--eyebrow-tracking": DESIGN_SYSTEM.typography.eyebrow.tracking,
		"--eyebrow-weight": DESIGN_SYSTEM.typography.eyebrow.weight,
		"--workspace-label-size": DESIGN_SYSTEM.typography.workspaceLabel.size,
		"--workspace-label-tracking": DESIGN_SYSTEM.typography.workspaceLabel.tracking,
		"--workspace-label-weight": DESIGN_SYSTEM.typography.workspaceLabel.weight,
		"--text-eyebrow-font": "var(--font-heading-active)",
		"--text-eyebrow-size": "0.6875rem",
		"--text-eyebrow-weight": "500",
		"--text-eyebrow-tracking": "0.03em",
		"--text-score-dim-font": "var(--font-heading-active)",
		"--text-score-dim-size": "0.625rem",
		"--text-score-dim-weight": "600",
		"--text-badge-font": "var(--font-body-active)",
		"--text-badge-size": "0.6875rem",
		"--text-badge-weight": "500",
		"--text-badge-tracking": "0.02em",
		"--text-counter-font": "var(--font-body-active)",
		"--text-counter-size": "0.75rem",
		"--text-counter-weight": "400",
		"--text-meta-font": "var(--font-code-active)",
		"--text-meta-size": "0.6875rem",
		"--text-meta-tracking": "0.04em",
		"--ease-spring": "cubic-bezier(0.32, 0.72, 0, 1)",
		"--ease-out-fast": "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
		"--ease-in-fast": "cubic-bezier(0.4, 0.0, 1.0, 1.0)"
	};
}

/**
 * Apply the active design-token values to a specific DOM element.
 */
export function applyDesignSystemVariables(element: HTMLElement, input: Readonly<DesignSystemVariableInput>): void {
	const variables = getDesignSystemCssVariables(input);

	for (const [propertyName, propertyValue] of Object.entries(variables)) {
		element.style.setProperty(propertyName, propertyValue);
	}
}

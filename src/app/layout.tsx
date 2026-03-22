import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { Providers } from "./providers";

const bodyFont = Geist({
	variable: "--font-body",
	subsets: ["latin"]
});

const headingFont = Space_Grotesk({
	variable: "--font-heading",
	subsets: ["latin"],
	weight: ["500", "700"]
});

const monoFont = JetBrains_Mono({
	variable: "--font-code",
	subsets: ["latin"]
});

export const metadata: Metadata = {
	title: "Playspace Audit Tool",
	description: "Playspace Play Value and Usability Audit Tool"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata");

	return {
		title: t("title"),
		description: t("description")
	};
}

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const messages = await getMessages();

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} antialiased`}>
				<NextIntlClientProvider messages={messages}>
					<Providers>{children}</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

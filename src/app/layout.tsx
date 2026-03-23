import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import "@fontsource/opendyslexic";
import { getRequestLanguageState } from "@/i18n/server-locale";
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
	const { locale, preference } = await getRequestLanguageState();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} antialiased`}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<Providers initialLanguagePreference={preference} initialResolvedLanguage={locale}>
						{children}
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

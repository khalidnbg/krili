// app/[locale]/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { ensureProfile } from "@/lib/actions/profile";
import { isAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/seo";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage",
	subsets: ["latin"],
});

const locales = ["fr", "ar"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations("metadata")

	const localeCode = locale === "ar" ? "ar_MA" : "fr_MA"

	return {
		metadataBase: new URL(siteUrl()),
		title: {
			default: t("title"),
			template: "%s | " + t("siteName"),
		},
		description: t("description"),
		applicationName: t("siteName"),
		openGraph: {
			type: "website",
			siteName: t("siteName"),
			locale: localeCode,
		},
		twitter: {
			card: "summary_large_image",
		},
		robots: {
			index: true,
			follow: true,
		},
	}
}

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	if (!locales.includes(locale)) {
		notFound();
	}

	const messages = await getMessages();

	await ensureProfile();
	const admin = await isAdmin();

	return (
		<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`font-sans ${geist.variable}`}>
			<body className={`${bricolage.variable} antialiased`}>
				<ClerkProvider appearance={{ variables: { colorPrimary: '#fe5933' } }}>
					<NextIntlClientProvider messages={messages}>
						<Navbar isAdmin={admin} />
						{children}
					</NextIntlClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
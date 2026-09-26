import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { ensureProfile } from "@/lib/actions/profile";
import { isAdmin } from "@/lib/admin";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Krili — Houses, Studios & Rooms for Rent",
	description: "Find and post house, studio and room rental listings across Morocco.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	await ensureProfile()

	const admin = await isAdmin()

	return (
		<html lang="en" className={cn("font-sans", geist.variable)}>
			<body className={`${bricolage.variable} antialiased`}>
				<ClerkProvider appearance={{ variables: { colorPrimary: '#fe5933' } }}>
					<Navbar isAdmin={admin} />
					{children}
				</ClerkProvider>
			</body>
		</html>
	);
}
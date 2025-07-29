import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { SearchProvider } from "@/lib/search-context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Spark Token Lists",
	description: "A token list standard for btkn assets.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased flex flex-col",
					GeistSans.variable,
					GeistMono.variable,
				)}
			>
				<SearchProvider>
					<div className="min-h-screen flex flex-col">
						<Header />
						{children}
					</div>
				</SearchProvider>
			</body>
		</html>
	);
}

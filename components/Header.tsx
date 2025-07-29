"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/lib/search-context";

export default function Header() {
	const pathname = usePathname();
	const isTokenListPage = pathname.startsWith("/token-list");
	const { searchQuery, setSearchQuery } = useSearch();

	return (
		<header className="w-full flex items-center justify-between px-4 md:px-6 py-5 border-b border-border bg-background">
			<Link href="/" className="flex items-center gap-2 flex-shrink-0">
				<Image
					src="/logo.svg"
					alt="BTKN logo"
					width={85}
					height={24}
					className="w-[70px] h-[20px] md:w-[85px] md:h-[24px]"
				/>
			</Link>
			{!isTokenListPage && (
				<div className="relative flex items-center flex-1 max-w-md mx-4">
					<Image
						src="/search.svg"
						alt="Search icon"
						width={14}
						height={14}
						className="absolute left-3 flex-shrink-0"
					/>
					<Input
						type="search"
						placeholder="Search token list.."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full h-8 pl-9 bg-transparent border-[#1B1B1B] text-[#6E6E6E] placeholder:text-[#6E6E6E] focus:border-[#1B1B1B] focus:ring-0 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
					/>
				</div>
			)}
			<Link
				href="https://github.com/flashnetxyz/btkn-info"
				target="_blank"
				className="flex items-center justify-center gap-1 px-3 md:px-4 h-8 bg-white/5 rounded flex-shrink-0"
			>
				<Image
					src="/github.svg"
					alt="Github logo"
					width={16}
					height={16}
					className="flex-shrink-0"
				/>
				<span className="text-xs hidden sm:inline">GitHub</span>
			</Link>
		</header>
	);
}

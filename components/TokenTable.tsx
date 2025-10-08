"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Token } from "@/lib/parsers";

export default function TokenTable({ tokens }: { tokens: Token[] }) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		if (!query) return tokens;
		const q = query.toLowerCase();
		return tokens.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.symbol.toLowerCase().includes(q) ||
				t.address.toLowerCase().includes(q),
		);
	}, [tokens, query]);

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="relative flex items-center">
				<Image
					src="/search.svg"
					alt="Search icon"
					width={14}
					height={14}
					className="absolute left-3 flex-shrink-0"
				/>
				<Input
					placeholder="Search tokens..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="w-full pl-9 bg-transparent border-[#1B1B1B] text-[#6E6E6E] placeholder:text-[#6E6E6E] focus:border-[#1B1B1B] focus:ring-0"
				/>
			</div>
			<div className="bg-[#1A1A1A] border border-[#222222] rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-b border-[#222222]">
							<tr>
								<th className="text-left p-4 text-[#8A8A8A] font-normal text-sm"></th>
								<th className="text-left p-4 text-[#8A8A8A] font-normal text-sm">
									Name
								</th>
								<th className="text-left p-4 text-[#8A8A8A] font-normal text-sm">
									Symbol
								</th>
								<th className="text-left p-4 text-[#8A8A8A] font-normal text-sm">
									Tags
								</th>
								<th className="text-left p-4 text-[#8A8A8A] font-normal text-sm">
									Address
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((token, index) => (
								<tr
									key={token.address}
									className={
										index !== filtered.length - 1
											? "border-b border-[#222222]"
											: ""
									}
								>
									<td className="p-4">
										{token.logoURI ? (
											<Image
												src={token.logoURI}
												alt={token.symbol}
												width={24}
												height={24}
												className="rounded-full"
											/>
										) : (
											<div className="w-6 h-6 bg-[#282828] rounded-full" />
										)}
									</td>
									<td className="p-4 text-white font-normal">{token.name}</td>
									<td className="p-4 text-white font-normal">{token.symbol}</td>
									<td className="p-4 text-[#8A8A8A]">
										{token.tags?.join(", ") || "-"}
									</td>
									<td className="p-4">
										<code className="text-xs text-[#8A8A8A] break-all font-mono">
											{token.address.length > 24
												? `${token.address.slice(
														0,
														12,
													)}...${token.address.slice(-12)}`
												: token.address}
										</code>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

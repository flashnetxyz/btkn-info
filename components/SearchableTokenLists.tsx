"use client";

import { useMemo } from "react";
import { useSearch } from "@/lib/search-context";
import { TokenListCard } from "./TokenListCard";

interface ListSummary {
	url: string;
	name: string;
	homepage: string;
	tokensCount: number | null;
	logoURI?: string;
}

export default function SearchableTokenLists({
	lists,
}: {
	lists: ListSummary[];
}) {
	const { searchQuery } = useSearch();

	const filtered = useMemo(() => {
		if (!searchQuery) return lists;
		const q = searchQuery.toLowerCase();
		return lists.filter((l) => l.name.toLowerCase().includes(q));
	}, [lists, searchQuery]);

	return (
		<div className="grid gap-6 grid-cols-2">
			{filtered.length === 0 ? (
				<div className="col-span-2 text-center py-8">
					<p className="text-[#6E6E6E]">No list found</p>
				</div>
			) : (
				filtered.map((l) => <TokenListCard key={l.url} {...l} />)
			)}
		</div>
	);
}

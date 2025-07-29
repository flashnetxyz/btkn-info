import SearchableTokenLists from "@/components/SearchableTokenLists";
import { getTokenLists } from "@/lib/parsers";

export default async function Home() {
	const lists = await getTokenLists();

	const summaries = lists.map((l) => ({
		url: l.url,
		name: l.name,
		homepage: l.homepage,
		tokensCount: l.tokens ? l.tokens.tokens.length : null,
		logoURI: l.tokens ? l.tokens.logoURI : undefined,
	}));

	return (
		<>
			<main className="flex-1 w-full max-w-7xl mx-auto py-12 md:py-24 px-4 md:px-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
					<div className="flex flex-col gap-6 order-1 lg:order-1">
						<p className="text-sm">
							<span className="text-sm text-white/50">
								A{" "}
								<a
									className="text-[#4DFF94]"
									href="https://flashnet.xyz"
									target="_blank"
									rel="noopener"
								>
									Flashnet
								</a>{" "}
								project
							</span>
						</p>
						<div className="max-w-md">
							<h1 className="text-3xl md:text-5xl text-[#888888] leading-tight">
								A token list standard <br /> for{" "}
								<span className="text-white">btkn</span> assets.
							</h1>
							<p className="text-sm md:text-[0.8rem] text-[#FAFAFA] max-w-sm mt-4 font-light">
								Spark Token Lists is a community-led initiative to improve
								discoverability, reputation and trust in BTKN token lists in a
								manner that is inclusive, transparent, and decentralized.
							</p>
							<a
								href="https://github.com/flashnetxyz/btkn-info#readme"
								target="_blank"
								rel="noopener noreferrer"
								className="w-full h-11 flex items-center justify-center text-base text-white bg-transparent border border-[#292929] rounded-xl hover:bg-white/5 transition-colors cursor-pointer mt-6"
							>
								+ add a list
							</a>
						</div>
					</div>
					<div className="flex flex-col gap-6 order-2 lg:order-2">
						<SearchableTokenLists lists={summaries} />
					</div>
				</div>
			</main>
			<footer className="w-full flex items-center justify-center p-5 border-t border-border">
				<p className="text-sm text-white/50">
					A{" "}
					<a
						className="text-[#4DFF94]"
						href="https://flashnet.xyz"
						target="_blank"
						rel="noopener"
					>
						Flashnet
					</a>{" "}
					project
				</p>
			</footer>
		</>
	);
}

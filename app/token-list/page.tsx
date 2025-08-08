import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import TokenListOverviewCard from "@/components/TokenListOverviewCard";
import TokenTable from "@/components/TokenTable";
import { getTokenList, getTokenListHomepage } from "@/lib/parsers";

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function TokenListPage({ searchParams }: PageProps) {
  const awaitedSearchParams = await searchParams;
  const urlParam = Array.isArray(awaitedSearchParams.url)
    ? awaitedSearchParams.url[0]
    : awaitedSearchParams.url;

  if (!urlParam) {
    return notFound();
  }

  const [tokenList, homepage] = await Promise.all([
    getTokenList(urlParam),
    getTokenListHomepage(urlParam),
  ]);

  if (!tokenList) {
    return notFound();
  }

  return (
    <>
      <div className="px-4 md:px-8 pt-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm hover:underline text-[#8A8A8A]">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
      <main className="flex-1 w-full max-w-7xl mx-auto py-8 md:py-12 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column: list overview */}
          <section className="lg:col-span-1 order-1">
            <TokenListOverviewCard
              name={tokenList.name}
              url={urlParam}
              homepage={homepage || urlParam}
              tokensCount={tokenList.tokens.length}
              logoURI={tokenList.logoURI}
            />
          </section>

          {/* Right column: tokens */}
          <section className="lg:col-span-2 order-2">
            <TokenTable tokens={tokenList.tokens} />
          </section>
        </div>
      </main>
      <footer className="w-full flex items-center justify-center p-5 border-t border-border">
        <p className="text-sm text-white/50">
          A{" "}
          <a
            className="text-[#4DFF94]"
            href="https://flashnet.xyz"
            target="_blank"
            rel="noopener">
            Flashnet
          </a>{" "}
          project
        </p>
      </footer>
    </>
  );
}

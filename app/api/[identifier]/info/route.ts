import { NextResponse } from "next/server";
import { z } from "zod";
import tokenListsConfig from "@/lib/token-lists.json";

// Token schema matching the existing schema
const TokenSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	identifier: z.string().optional(),
	address: z.string(),
	decimals: z.number(),
	tags: z.array(z.string()).optional(),
	logoURI: z.string().optional(),
});

const TokenListSchema = z.object({
	name: z.string(),
	logoURI: z.string().optional(),
	tokens: z.array(TokenSchema),
	// Support for nested token lists (recursive structure)
	lists: z.array(z.string()).optional(),
});

type Token = z.infer<typeof TokenSchema>;
type TokenList = z.infer<typeof TokenListSchema>;

// Cache for fetched token lists to avoid repeated requests
const tokenListCache = new Map<string, TokenList | null>();

async function fetchTokenList(url: string): Promise<TokenList | null> {
	// Check cache first
	if (tokenListCache.has(url)) {
		return tokenListCache.get(url) || null;
	}

	try {
		const response = await fetch(url, {
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			console.error(
				`Failed to fetch token list from ${url}: ${response.status}`,
			);
			tokenListCache.set(url, null);
			return null;
		}

		const data = await response.json();
		const tokenList = TokenListSchema.parse(data);
		tokenListCache.set(url, tokenList);
		return tokenList;
	} catch (error) {
		console.error(`Error fetching token list from ${url}:`, error);
		tokenListCache.set(url, null);
		return null;
	}
}

async function findTokenInfo(
	searchValue: string,
	visitedUrls: Set<string> = new Set(),
): Promise<Token | null> {
	const normalizedSearch = searchValue.toLowerCase().trim();

	// Start with the configured token lists
	const tokenListUrls = Object.keys(tokenListsConfig);

	// Process all token lists in parallel for better performance
	const searchPromises = tokenListUrls.map(async (url) => {
		if (visitedUrls.has(url)) {
			return null;
		}
		visitedUrls.add(url);

		const tokenList = await fetchTokenList(url);
		if (!tokenList) {
			return null;
		}

		// Search for the token in this list
		const token = tokenList.tokens.find((t: Token) => {
			const addressMatch = t.address?.toLowerCase() === normalizedSearch;
			const identifierMatch = t.identifier?.toLowerCase() === normalizedSearch;
			// Also allow matching by symbol for convenience
			const symbolMatch = t.symbol?.toLowerCase() === normalizedSearch;
			return addressMatch || identifierMatch || symbolMatch;
		});

		if (token) {
			return token;
		}

		// If this token list contains references to other lists, search them recursively
		if (tokenList.lists && tokenList.lists.length > 0) {
			const nestedSearches = tokenList.lists.map(async (nestedUrl) => {
				if (visitedUrls.has(nestedUrl)) {
					return null;
				}
				return findTokenInfo(normalizedSearch, visitedUrls);
			});

			const nestedResults = await Promise.all(nestedSearches);
			const foundToken = nestedResults.find((token) => token !== null);
			if (foundToken) {
				return foundToken;
			}
		}

		return null;
	});

	const results = await Promise.all(searchPromises);
	return results.find((token) => token !== null) || null;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ identifier: string }> },
) {
	const { identifier } = await params;

	if (!identifier) {
		// Return a 400 error as an image
		return new NextResponse(null, {
			status: 404,
			headers: {
				"Cache-Control": "public, max-age=60",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}

	try {
		const tokenInfo = await findTokenInfo(identifier);

		if (!tokenInfo) {
			return new NextResponse(null, {
				status: 404,
				headers: {
					"Cache-Control": "public, max-age=300", // Cache 404s for 5 minutes
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		return new NextResponse(JSON.stringify(tokenInfo), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", // 24h cache, 12h stale
				"X-Token-Identifier": identifier,
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	} catch (error) {
		console.error("Error serving token info:", error);

		return new NextResponse(null, {
			status: 500,
			headers: {
				"Cache-Control": "public, max-age=60",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
		},
	});
}

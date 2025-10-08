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
// Cache for fetched images
const imageCache = new Map<string, { data: Buffer; contentType: string }>();

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

async function findTokenImageUrl(
	searchValue: string,
	visitedUrls: Set<string> = new Set(),
): Promise<string | null> {
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

		if (token?.logoURI) {
			return token.logoURI;
		}

		// If this token list contains references to other lists, search them recursively
		if (tokenList.lists && tokenList.lists.length > 0) {
			const nestedSearches = tokenList.lists.map(async (nestedUrl) => {
				if (visitedUrls.has(nestedUrl)) {
					return null;
				}
				return findTokenImageUrl(normalizedSearch, visitedUrls);
			});

			const nestedResults = await Promise.all(nestedSearches);
			const foundImage = nestedResults.find((img) => img !== null);
			if (foundImage) {
				return foundImage;
			}
		}

		return null;
	});

	const results = await Promise.all(searchPromises);
	return results.find((img) => img !== null) || null;
}

async function fetchImage(
	imageUrl: string,
): Promise<{ data: Buffer; contentType: string } | null> {
	// Check cache first
	if (imageCache.has(imageUrl)) {
		return imageCache.get(imageUrl) || null;
	}

	try {
		const response = await fetch(imageUrl, {
			next: { revalidate: 86400 }, // Cache images for 24 hours
		});

		if (!response.ok) {
			console.error(
				`Failed to fetch image from ${imageUrl}: ${response.status}`,
			);
			return null;
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Get content type from response or try to detect it
		let contentType = response.headers.get("content-type") || "image/png";

		// Validate it's an image content type
		if (!contentType.startsWith("image/")) {
			// Try to detect from the URL extension
			if (imageUrl.endsWith(".svg")) contentType = "image/svg+xml";
			else if (imageUrl.endsWith(".jpg") || imageUrl.endsWith(".jpeg"))
				contentType = "image/jpeg";
			else if (imageUrl.endsWith(".gif")) contentType = "image/gif";
			else if (imageUrl.endsWith(".webp")) contentType = "image/webp";
			else contentType = "image/png"; // Default to PNG
		}

		const imageData = { data: buffer, contentType };

		// Cache the image data
		imageCache.set(imageUrl, imageData);

		return imageData;
	} catch (error) {
		console.error(`Error fetching image from ${imageUrl}:`, error);
		return null;
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ identifier: string[] }> },
) {
	// Extract the identifier from the URL path
	// The identifier array will contain the path segments
	// e.g., /api/image/abc123.png -> ['abc123.png']
	// e.g., /api/image/btkn1xyz/image.png -> ['btkn1xyz', 'image.png']

	const { identifier: identifierSegments } = await params;
	const fullPath = identifierSegments.join("/");

	// Remove any file extension
	const identifier = fullPath.replace(/\.(png|jpg|jpeg|gif|svg|webp)$/i, "");

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
		// Find the token image URL
		const imageUrl = await findTokenImageUrl(identifier);

		if (!imageUrl) {
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

		// Fetch the actual image
		const imageData = await fetchImage(imageUrl);

		if (!imageData) {
			// If we found the URL but couldn't fetch the image, return placeholder
			return new NextResponse(null, {
				status: 502,
				headers: {
					"Cache-Control": "public, max-age=60", // Short cache for errors
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		// Return the actual image with appropriate headers
		return new NextResponse(imageData.data, {
			status: 200,
			headers: {
				"Content-Type": imageData.contentType,
				"Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", // 24h cache, 12h stale
				"X-Token-Identifier": identifier,
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	} catch (error) {
		console.error("Error serving token image:", error);

		// Return error as placeholder image
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

/*
 Validates token list URLs defined in lib/token-lists.json against schema.json.
 - Usage:
   bun scripts/validate-tokenlists.ts            # validate all URLs
   bun scripts/validate-tokenlists.ts --only=url1,url2  # validate only specific URLs
 Exits non-zero on any failure and prints a concise error report.
*/

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020, { type DefinedError } from "ajv/dist/2020";
import addFormats from "ajv-formats";

type Token = {
	identifier: string;
	address: string;
	name: string;
	symbol: string;
	decimals: number;
	logoURI?: string;
	tags?: string[];
};

type TokenList = {
	name: string;
	timestamp: string;
	version: { major: number; minor: number; patch: number };
	logoURI?: string;
	keywords?: string[];
	tags?: Record<string, { name: string; description: string } | undefined>;
	tokens: Token[];
};

function isBtknAddress(value: string): boolean {
	return typeof value === "string" && value.toLowerCase().startsWith("btkn1");
}

function isInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value);
}

function readJsonFile<T>(filePath: string): T {
	const file = fs.readFileSync(filePath, "utf8");
	return JSON.parse(file) as T;
}

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}
	return (await res.json()) as T;
}

async function main() {
	const repoRoot = process.cwd();
	const schemaPath = path.join(repoRoot, "schema.json");
	const registryPath = path.join(repoRoot, "lib", "token-lists.json");

	if (!fs.existsSync(schemaPath)) {
		console.error(`schema not found at ${schemaPath}`);
		process.exit(2);
	}
	if (!fs.existsSync(registryPath)) {
		console.error(`registry not found at ${registryPath}`);
		process.exit(2);
	}

	const schema = readJsonFile<Record<string, unknown>>(schemaPath);
	const registry =
		readJsonFile<Record<string, { name: string; homepage?: string }>>(
			registryPath,
		);

	const argOnly = process.argv.find((a) => a.startsWith("--only="));
	const onlyUrls = argOnly
		? argOnly.replace("--only=", "").split(",").filter(Boolean)
		: null;
	const urlsToValidate = onlyUrls ?? Object.keys(registry);

	const ajv = new Ajv2020({ allErrors: true, strict: false });
	addFormats(ajv);
	const validate = ajv.compile<TokenList>(schema as any);

	const failures: Array<{ url: string; errors: string[] }> = [];

	for (const url of urlsToValidate) {
		try {
			const list = await fetchJson<TokenList>(url);

			const valid = validate(list);
			const errorMessages: string[] = [];
			if (!valid) {
				const errors = (validate.errors ?? []) as DefinedError[];
				for (const err of errors) {
					errorMessages.push(
						`${err.instancePath || "/"} ${err.message ?? "invalid"}`,
					);
				}
			}

			// Additional domain-specific checks beyond JSON Schema
			// 1) BTKN address prefix
			for (const [index, token] of list.tokens.entries()) {
				if (!isBtknAddress(token.address)) {
					errorMessages.push(
						`/tokens/${index}/address must start with 'btkn1'`,
					);
				}
				if (!isInteger(token.decimals)) {
					errorMessages.push(`/tokens/${index}/decimals must be an integer`);
				}
			}

			// 2) Ensure unique identifiers and addresses within the list
			const seenIdentifiers = new Set<string>();
			const seenAddresses = new Set<string>();
			for (const [index, token] of list.tokens.entries()) {
				if (token.identifier) {
					if (seenIdentifiers.has(token.identifier)) {
						errorMessages.push(
							`/tokens/${index}/identifier duplicate: ${token.identifier}`,
						);
					} else {
						seenIdentifiers.add(token.identifier);
					}
				}
				const normalizedAddress = token.address.toLowerCase();
				if (seenAddresses.has(normalizedAddress)) {
					errorMessages.push(
						`/tokens/${index}/address duplicate: ${token.address}`,
					);
				} else {
					seenAddresses.add(normalizedAddress);
				}
			}

			if (errorMessages.length > 0) {
				failures.push({ url, errors: errorMessages });
			} else {
				console.log(`✓ ${url} is valid`);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			failures.push({ url, errors: [message] });
		}
	}

	if (failures.length > 0) {
		console.error("\nValidation failures:");
		for (const f of failures) {
			console.error(`\n- ${f.url}`);
			for (const e of f.errors) {
				console.error(`  • ${e}`);
			}
		}
		process.exit(1);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

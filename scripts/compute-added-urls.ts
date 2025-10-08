/*
 Computes which URLs were added in lib/token-lists.json in the current HEAD
 compared to the PR base (origin/master) to allow targeted validation during CI.
 - If git is not available (e.g., local run), falls back to returning all URLs.
 - Usage: bun scripts/compute-added-urls.ts
*/

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Registry = Record<string, { name: string; homepage?: string }>;

function readJsonFile<T>(filePath: string): T {
	const file = fs.readFileSync(filePath, "utf8");
	return JSON.parse(file) as T;
}

function safeGitShow(refAndPath: string): string | null {
	try {
		return execSync(`git show ${refAndPath}`, {
			stdio: ["ignore", "pipe", "pipe"],
		}).toString("utf8");
	} catch {
		return null;
	}
}

function main() {
	const repoRoot = process.cwd();
	const relativeRegistry = path.join("lib", "token-lists.json");
	const absoluteRegistry = path.join(repoRoot, relativeRegistry);

	const currentContent = fs.readFileSync(absoluteRegistry, "utf8");

	const baseSha = process.env.BASE_SHA ?? "origin/master";
	const baseContent = safeGitShow(`${baseSha}:${relativeRegistry}`);

	if (!baseContent) {
		// Fallback: no git baseline; output all URLs
		const all = Object.keys(readJsonFile<Registry>(absoluteRegistry));
		console.log(all.join(","));
		return;
	}

	const baseRegistry = JSON.parse(baseContent) as Registry;
	const currentRegistry = JSON.parse(currentContent) as Registry;

	const baseUrls = new Set(Object.keys(baseRegistry));
	const added = Object.keys(currentRegistry).filter((u) => !baseUrls.has(u));

	console.log(added.join(","));
}

main();

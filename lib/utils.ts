import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function parseTokenURI(tokenURI: string) {
	if (tokenURI.startsWith("ipfs://")) {
		return `https://ipfs.io/ipfs/${tokenURI.split("://")[1]}`;
	}
	return tokenURI;
}

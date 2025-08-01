import { z } from "zod";

export type Address = `btkn1${string}`;

export function isAddress(address: string): address is Address {
  return address.startsWith("btkn1");
}

const TokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  identifier: z.string().optional(),
  address: z.custom<Address>().refine(isAddress),
  decimals: z.number(),
  tags: z.array(z.string()).optional(),
  logoURI: z.string().optional(),
});

export const TokenListSchema = z.object({
  name: z.string(),
  logoURI: z.string().optional(),
  tokens: z.array(TokenSchema),
});

export type Token = z.infer<typeof TokenSchema>;
export type TokenList = z.infer<typeof TokenListSchema>;

export async function getTokenLists() {
  const tokenLists = await fetch(
    "https://raw.githubusercontent.com/flashnetxyz/btkn-info/refs/heads/master/lib/token-lists.json"
  ).then(
    (res) =>
      res.json() as Promise<Record<string, { name: string; homepage: string }>>
  );

  const tokenListsWithTokens = await Promise.all(
    Object.entries(tokenLists).map(async ([url, { name, homepage }]) => {
      const tokens = await fetch(url)
        .then((res) => res.json())
        .then((res) => TokenListSchema.parse(res))
        .catch(() => null);
      return { url, name, homepage, tokens };
    })
  );

  return tokenListsWithTokens;
}

export async function getTokenList(url: string) {
  return fetch(url)
    .then((res) => res.json())
    .then((res) => TokenListSchema.parse(res))
    .catch(() => null);
}

export async function getTokenListHomepage(url: string) {
  const tokenLists = await fetch(
    "https://raw.githubusercontent.com/flashnetxyz/btkn-info/refs/heads/master/lib/token-lists.json"
  ).then(
    (res) =>
      res.json() as Promise<Record<string, { name: string; homepage: string }>>
  );

  return tokenLists[url]?.homepage;
}

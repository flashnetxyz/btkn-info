# Spark Token Lists

Community-maintained registry of BTKN token lists.<br/>
Lists live in this GitHub repo and are surfaced at <https://btkn.info> (this site).

Anyone can propose a new list or update an existing one via Pull Request.

## Adding a List

To surface your token list on <https://btkn.info>, open a Pull Request that **appends your list’s URL** to `lib/token-lists.json`.

```jsonc
{
  "https://example.com/my-list.json": {
    "name": "Example Token List",
    "homepage": "https://example.com"
  }
}
```

Guidelines:

1. The list JSON referenced by the URL **must** conform to the specification below.
2. Use a stable, immutable URL (raw GitHub, IPFS, your own domain, etc.).
3. Keep the `name` concise — it will be displayed in the UI.
4. Optionally provide a `homepage` for users to learn more about the list.

Once the PR is merged, the site will automatically pick up the change and display your list.

---

## JSON Specification

Each file submitted must be a valid JSON document that conforms to the specification below.

### Top-level fields

| Key         | Type              | Required | Description                                 |
| ----------- | ----------------- | -------- | ------------------------------------------- |
| `name`      | string            | ✔︎       | Human-readable list name.                   |
| `timestamp` | string (ISO 8601) | ✔︎       | UTC timestamp of the last change.           |
| `version`   | object            | ✔︎       | Semantic version `{ major, minor, patch }`. |
| `logoURI`   | string            | –        | URI/IPFS hash for list logo.                |
| `keywords`  | string[]          | –        | Free-form search keywords.                  |
| `tags`      | object            | –        | Map of tag ID ⇒ `{ name, description }`.    |
| `tokens`    | Token[]           | ✔︎       | Array of token objects (defined below).     |

### `Token` object

| Key          | Type     | Required | Description                                           |
| ------------ | -------- | -------- | ----------------------------------------------------- |
| `identifier` | string   | –        | BTKN asset identifier hex-string.                     |
| `address`    | string   | ✔︎       | BTKN asset address (case-insensitive).                |
| `name`       | string   | ✔︎       | Token name.                                           |
| `symbol`     | string   | ✔︎       | Ticker / short symbol.                                |
| `decimals`   | integer  | ✔︎       | Number of decimal places.                             |
| `logoURI`    | string   | –        | URI/IPFS hash for a token logo.                       |
| `tags`       | string[] | –        | Array of tag IDs defined in the parent list’s `tags`. |

### Example

```jsonc
{
  "name": "Flashnet Token List",
  "timestamp": "2025-07-28T12:00:00Z",
  "version": { "major": 1, "minor": 0, "patch": 0 },
  "logoURI": "ipfs://QmXsbxYZrdZrgqDMv...",
  "keywords": ["spark", "flashnet"],
  "tags": {
    "stablecoin": {
      "name": "Stablecoin",
      "description": "Tokens fixed to an external asset"
    }
  },
  "tokens": [
    {
      "identifier": "0000000000000000000000000000000000000000000000000000000000000000",
      "address": "btkn10000000000000000000000000000000000000000000000000000000000",
      "name": "USD Bitcoin",
      "symbol": "USDB",
      "decimals": 6,
      "logoURI": "ipfs://QmXsbxYZrdZrgqDMv...",
      "tags": ["stablecoin"]
    }
  ]
}
```

---

## Local development

```bash
bun install
bun dev
```

---

## License

MIT © Flashnet

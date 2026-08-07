# Gousto Meal Planner

Meal planning built around Gousto recipe cards. Single-file PWA on Cloudflare Pages,
with two Functions and a separate KV-backed sync Worker.

Live: https://gousto-6e5.pages.dev · Repo: `github.com/tombozza/gousto`

## Deploy from a staged clean directory — not the repo root

**This is the one thing to get right here.** The `Recipe cards/` folder is ~1GB of scanned
images. It is gitignored, but **wrangler ignores `.gitignore`**, so
`wrangler pages deploy .` tries to upload the lot and fails (or takes forever).

Stage the site files into a temp dir and deploy *that*:

```bash
STAGE=$(mktemp -d)
cp index.html manifest.json sw.js "$STAGE"/
cp -R icons functions "$STAGE"/
npx wrangler pages deploy "$STAGE" --project-name gousto --branch main --commit-dirty=true
rm -rf "$STAGE"
```

Also excluded by that copy, deliberately: `Recipe cards/`, `Spreadsheets/`, `Prompt/`,
`sync-worker/`, `.claude/`.

## Layout

```
index.html          the entire app — ~7k lines, one file, inline CSS + JS
sw.js               service worker; bump the cache name on every change
functions/api/anthropic.js   vision proxy for recipe-card scanning
functions/api/status.js      reports whether the server key is configured
sync-worker/        separate Worker (`gousto-sync`), KV-backed state sync
Prompt/             the recipe-extraction prompt, as .txt and .json
Spreadsheets/       source meal plans and the recipe list (xlsx)
```

`index.html` also loads **tesseract.js from a CDN** for on-device OCR — that's the free
path that runs before any API call.

## The Anthropic proxy is deliberately locked down

[`functions/api/anthropic.js`](functions/api/anthropic.js) injects the server's
`ANTHROPIC_API_KEY` so the client never holds one. Because it runs on the account key, it
is constrained so it can't be used as a general-purpose LLM proxy:

- **Model allowlist** — anything not in the set falls back to `claude-haiku-4-5-20251001`.
- **`max_tokens` capped at 4096.**
- It mirrors Anthropic's error shape (`{ type: "error", error: { message } }`) so the
  existing client parsing keeps working — keep that shape if you touch error handling.

Don't loosen the allowlist or the cap to "make a feature work"; add the model explicitly
if it's genuinely needed.

Per the free-manual-mode convention, the OCR/paste path must keep working with no key at
all. `functions/api/status.js` exists so the UI can tell the user which mode is available.

## Sync worker

`sync-worker/` deploys separately as **`gousto-sync`** and stores one JSON blob per sync
code in KV. The code is a bearer secret — anyone with it can read/write that blob, so it
must be long and random. Blobs are keyed by `SHA-256("gousto:" + code)`, so **raw codes
are never used as KV keys**; keep that hashing if you extend it.

`GET /state` and `PUT /state` are the only routes.

## Commands

```bash
npx wrangler pages dev .                       # local (fine — no upload)
cd sync-worker && npx wrangler deploy
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name gousto
```

The secret is a **Pages** secret: it only takes effect on the **next deploy**.

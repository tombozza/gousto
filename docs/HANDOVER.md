# Gousto Meal Planner: handover (retired app)

Written 10 Nov 2026. **This app is retired.** It was replaced by Food Planner (`../../food-planner`,
https://food-planner-dez.pages.dev) on 6 Oct 2026. It is still deployed as a read-only safety net, and it
is off the App Hub. Don't develop it. Anything wanted "from the Gousto app" gets built in Food Planner.
Shared rules for all apps: [`../../CLAUDE.md`](../../CLAUDE.md). How this app works: [`../CLAUDE.md`](../CLAUDE.md).

## What it was

Tom's meal planner built around his Gousto recipe cards. It had recipe browsing and filters, a physical binder index
(`B1 R42`), a protein picker, meal plans, shopping lists with pack costs, live cooking mode, and recipe-card
scanning (on-device OCR, or Claude via a locked proxy). It was a single-file PWA: `index.html` is about 1 MB, with
the recipe data embedded as JSON.

Live (read-only safety net): https://gousto-6e5.pages.dev

## Where its data went

- **On each device:** browser localStorage (the source of truth while it was live).
- **Synced:** one shared JSON blob in KV through the `gousto-sync` Worker (`sync-worker/`, KV namespace id in
  `sync-worker/wrangler.jsonc`). Every device used the same fixed store code. Tom rejected per-device sync codes
  as too confusing.
- **Migrated:** Food Planner's migration read that blob on 12 Sep 2026 (`food-planner/raw/user-state.json`,
  gitignored, made by `npm run extract` there). Before archiving, the live blob was diffed against that snapshot.
  The only new data was one custom recipe (Chorizo & Potato Stew, copied by hand) and one rating (already present).
- Recipe base data (Gousto catalogue amounts and methods) went into Food Planner's `raw/` and `data/`.

## Run it locally / deploy (only if ever needed)

No install and no build. `npx wrangler pages dev .` serves it locally. **Warning:** a browser that has opened the
live app may sync localhost test data into the real KV blob. See CLAUDE.md, and clear `gousto_sync_*` from
localStorage first.

Deploy is a staged directory. Note that `clearx.js` must be included. It is loaded by `index.html` but missing
from the copy list in CLAUDE.md:

```bash
STAGE=$(mktemp -d)
cp index.html manifest.json sw.js clearx.js "$STAGE"/
cp -R icons functions "$STAGE"/
npx wrangler pages deploy "$STAGE" --project-name gousto --branch main --commit-dirty=true
rm -rf "$STAGE"
# sync worker: cd sync-worker && npx wrangler deploy
```

Secrets: `ANTHROPIC_API_KEY` (Pages secret on project `gousto`, for card scanning only). Not needed for read-only use.
See `.dev.vars.example`.

## Repo state (10 Nov 2026)

- Checked out on branch **`live-cooking-mode`**, which has **no upstream** and is **16 commits ahead of `main`**.
  It holds all work from 7 Aug to 5 Oct 2026. `origin/main` on GitHub (`tombozza/gousto`) lacks those 16 commits.
- Uncommitted: `sync-worker/src/index.js`, which also stores the client's per-key `meta` timestamps (the merge
  needs them). It is probably what is deployed **(unconfirmed)**.
- Untracked, not gitignored: `Prompt/` (the extraction prompt) and `Spreadsheets/` (old meal-plan xlsx files).
- The ~1 GB `Recipe cards/` folder that CLAUDE.md warns about is no longer in this folder.

## Decisions (newest first)

- 2026-10-06: Archived, and replaced by Food Planner. Kept deployed as a safety net. Deleting it is Tom's call.
- 2026-09-15: Tom decided to rethink Gousto Planner and Soup Planner as one new app rather than rip them apart.
  That became Food Planner.
- 2026-08: No estimated amounts, ever. Gousto's published figures or Tom's own only. The exceptions are Gousto's
  printed "cooking for 3/4" rule and whole multiples for bulk cooking. This rule carried over to Food Planner.
- 2026-08: tesseract.js left on a CDN on purpose. Vendoring would mean about 15 MB, and losing it only loses free OCR.
- 2026-07-31: Cloud sync rebuilt merge-only, after a stale blob overwrote a saved plan. One shared store and no device
  linking (Tom: "I just want server side sync on whatever device I'm accessing the website from").

## Status

Works read-only as a safety net. No known bugs being tracked. Nothing half-done that matters.

## Parked ideas

None. New ideas belong in Food Planner.

## Shutting it down (Tom's decision, not done)

1. Optional last export of the KV blob, read-only:
   `cd sync-worker && npx wrangler kv key list --namespace-id <id from wrangler.jsonc> --remote`, then `kv key get` each key.
2. Delete the Pages project `gousto` (its `ANTHROPIC_API_KEY` secret goes with it), the Worker `gousto-sync` and its
   KV namespace.
3. Decide what happens to the 16 local-only commits: push the branch, or merge to `main` and push. Then archive the
   GitHub repo.
4. Food Planner's `npm run extract` reads from `gousto-sync`. It is only for re-running the migration, so it stops
   working after this.

## Setup check (10 Nov 2026)

Fresh `git clone` of the local repo. It checked out `live-cooking-mode`, because that is the local HEAD. A clone
from GitHub would get the older `main`. Every file in the deploy list is present. `node --check` passed on `sw.js`,
`functions/api/anthropic.js` and `sync-worker/src/index.js`. There is no install or build step. Nothing was
deployed or served.

# Gousto final archive (12 Nov 2026)

Taken just before the live Gousto site (Pages `gousto`) and its sync Worker (`gousto-sync`) were deleted.

- `gousto-sync-kv/` holds every key in KV namespace `gousto-sync-kv` (id `c0d787338d4b41beb3f374acc0091ec1`),
  one JSON file per key, plus `_keys.json` (the key list). Keys are `st_` + SHA-256 of the sync code.
- The real store is `st_435a7735…json` (version 555, last written 20 Oct 2026, 34 data keys, 90 custom recipes).
  The other six are old test or abandoned sync codes from June and July 2026.
- Gousto had no D1 database. Soup Planner had no server storage at all (its data lived on the device, and was
  imported into Food Planner from its own backup).

Compared with Food Planner's migration snapshot (`food-planner/raw/user-state.json`, 12 Sep 2026, version 540):
one extra custom recipe (Chorizo & Potato Stew), one extra favourite and rating (Suya-Style Chicken Skewers),
both already in Food Planner; a plan draft; and 39 fewer binder filing entries (168 vs 207). The snapshot's
fuller filing list is what Food Planner was built from, so nothing is lost.

The KV namespace itself was left in place on Cloudflare as a second copy.

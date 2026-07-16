// POST /api/anthropic — recipe-card vision proxy using the shared server key
// (wrangler pages secret put ANTHROPIC_API_KEY). The client sends the same
// message body it used to send straight to Anthropic; we inject the key here.
//
// Model is checked against an allowlist and max_tokens is capped so this can't
// be used as a general-purpose LLM proxy on the account key — it only ever runs
// small recipe-card scans.

const MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-sonnet-5",
]);
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS_CAP = 4096;

// Mirror Anthropic's error shape so the existing client parsing keeps working.
const err = (message, status) =>
  Response.json({ type: "error", error: { message } }, { status });

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.ANTHROPIC_API_KEY) {
    return err("Server missing ANTHROPIC_API_KEY. Set it with: wrangler pages secret put ANTHROPIC_API_KEY --project-name gousto", 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return err("Invalid request body.", 400); }

  const model = MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const max_tokens = Math.min(Number(body.max_tokens) || 1500, MAX_TOKENS_CAP);
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages) return err("No messages provided.", 400);

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });
  } catch (e) {
    return err("Couldn’t reach Anthropic: " + (e.message || e), 502);
  }

  // Pass Anthropic's response (success or error) straight through unchanged.
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

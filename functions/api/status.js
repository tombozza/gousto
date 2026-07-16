// GET /api/status — tells the app whether a shared server key is set, so it can
// hide the per-device key field and let scanning work on every device.
export function onRequestGet(context) {
  return Response.json({ serverKey: !!context.env.ANTHROPIC_API_KEY });
}

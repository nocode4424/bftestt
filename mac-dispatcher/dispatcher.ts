// mac-dispatcher/dispatcher.ts
// Oak-based dispatcher that runs on macOS and forwards order alerts to the local Messages.app.
// Usage (example):
// deno run --allow-env --allow-run --allow-net mac-dispatcher/dispatcher.ts

import { Application, Router, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { formatOrder, OrderPayload } from "../shared/formatOrder.ts";

// ENVIRONMENT
const ORDER_ALERT_SECRET = Deno.env.get("ORDER_ALERT_SECRET") ?? "";
const LISTEN_PORT = Number(Deno.env.get("LISTEN_PORT") ?? 7777);

if (!ORDER_ALERT_SECRET) {
  console.error("[mac-dispatcher] Missing env ORDER_ALERT_SECRET, exiting.");
  Deno.exit(1);
}

// Duplicate guard (same implementation as server/order-alert)
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const orderCache = new Map<string, number>();
function isDuplicate(orderId: string): boolean {
  const now = Date.now();
  const ts = orderCache.get(orderId);
  if (ts && now - ts < CACHE_DURATION_MS) return true;
  orderCache.set(orderId, now);
  return false;
}
setInterval(() => {
  const threshold = Date.now() - CACHE_DURATION_MS;
  for (const [id, ts] of orderCache.entries()) {
    if (ts < threshold) orderCache.delete(id);
  }
}, CACHE_DURATION_MS);

async function sendViaMessages(message: string): Promise<void> {
  // Escape double-quotes and backslashes for AppleScript inline string.
  const escaped = message.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  const script = `tell application \"Messages\" to send \"${escaped}\" to buddy \"+13106924743\" of service \"E:*\"`;

  const p = Deno.run({
    cmd: ["osascript", "-e", script],
    stdout: "piped",
    stderr: "piped",
  });
  const [status, out, err] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);
  p.close();

  if (!status.success) {
    const errText = new TextDecoder().decode(err);
    throw new Error(errText || `osascript exited with code ${status.code}`);
  }
  const txt = new TextDecoder().decode(out).trim();
  if (txt) console.log(`[mac-dispatcher] osascript: ${txt}`);
}

const router = new Router();

router.post("/dispatch", async (ctx) => {
  const now = new Date().toISOString();
  // Secret validation
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.body({ type: "json" }).value;
  } catch {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: "invalid json" };
    return;
  }

  const secret = String(body.secret ?? "");
  if (secret !== ORDER_ALERT_SECRET) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: "unauthorized" };
    console.warn(`[mac-dispatcher] ${now} Unauthorized dispatch request from ${ctx.request.ip}`);
    return;
  }

  const orderId = String((body as Record<string, unknown>).orderId ?? "");
  if (!orderId) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: "missing orderId" };
    return;
  }

  if (isDuplicate(orderId)) {
    ctx.response.status = Status.Accepted;
    ctx.response.body = { status: "duplicate_ignored" };
    console.log(`[mac-dispatcher] ${now} Duplicate orderId ${orderId} ignored`);
    return;
  }

  // Generate formatted message
  const message = formatOrder(body as OrderPayload);

  try {
    await sendViaMessages(message);
    console.log(`[mac-dispatcher] ${now} Sent order ${orderId} to Messages`);
    ctx.response.status = Status.OK;
    ctx.response.body = { status: "sent" };
  } catch (err) {
    console.error(`[mac-dispatcher] ${now} Failed to send order ${orderId}:`, err);
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: "send_failed" };
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`[mac-dispatcher] Listening on http://localhost:${LISTEN_PORT}`);
await app.listen({ port: LISTEN_PORT });


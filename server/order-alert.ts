// server/order-alert.ts
// An Oak-based HTTP server that exposes POST /order-alert.
// Validates X-SHARED-SECRET header against env ORDER_ALERT_SECRET.
// On success, forwards the payload (plus the shared secret) to MAC_DISPATCH_URL/dispatch,
// returns 202 Accepted and logs activities to stdout.
// It also maintains an in-memory, 5-minute cache to ignore duplicate orderId values.

// This file is intended to be executed with Deno. Example:
//   deno run --allow-env --allow-net server/order-alert.ts

import { Application, Router, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Environment variables
const ORDER_ALERT_SECRET = Deno.env.get("ORDER_ALERT_SECRET") ?? "";
const MAC_DISPATCH_URL = Deno.env.get("MAC_DISPATCH_URL") ?? "";
if (!ORDER_ALERT_SECRET) {
  console.error("[order-alert] Missing env ORDER_ALERT_SECRET, exiting.");
  Deno.exit(1);
}
if (!MAC_DISPATCH_URL) {
  console.error("[order-alert] Missing env MAC_DISPATCH_URL, exiting.");
  Deno.exit(1);
}

// Simple in-memory cache for duplicate order detection
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const orderCache = new Map<string, number>(); // orderId -> timestamp

/**
 * Returns true if the orderId is a duplicate received within the last CACHE_DURATION_MS.
 */
function isDuplicate(orderId: string): boolean {
  const now = Date.now();
  const ts = orderCache.get(orderId);
  if (ts && now - ts < CACHE_DURATION_MS) {
    return true;
  }
  // Otherwise store / refresh
  orderCache.set(orderId, now);
  return false;
}

// Periodic cleanup to keep memory usage bounded.
setInterval(() => {
  const threshold = Date.now() - CACHE_DURATION_MS;
  for (const [id, ts] of orderCache.entries()) {
    if (ts < threshold) orderCache.delete(id);
  }
}, CACHE_DURATION_MS);

const router = new Router();

router.post("/order-alert", async (ctx) => {
  const sharedSecret = ctx.request.headers.get("X-SHARED-SECRET") ?? "";
  if (sharedSecret !== ORDER_ALERT_SECRET) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: "unauthorized" };
    console.warn(`[order-alert] Unauthorized request from ${ctx.request.ip}`);
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await ctx.request.body({ type: "json" }).value;
  } catch (err) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: "invalid json" };
    console.warn("[order-alert] Invalid JSON payload", err);
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
    console.log(`[order-alert] Duplicate orderId ${orderId} ignored`);
    return;
  }

  // Forward payload to dispatcher service
  const forwardPayload = {
    ...body,
    secret: ORDER_ALERT_SECRET,
  };

  const dispatchUrl = `${MAC_DISPATCH_URL.replace(/\/$/, "")}/dispatch`;
  try {
    const resp = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(forwardPayload),
    });
    if (!resp.ok) {
      console.error(`[order-alert] Failed to dispatch order ${orderId}: ${resp.status} ${resp.statusText}`);
    } else {
      console.log(`[order-alert] Dispatched order ${orderId} to ${dispatchUrl}`);
    }
  } catch (err) {
    console.error(`[order-alert] Error dispatching order ${orderId}:`, err);
  }

  ctx.response.status = Status.Accepted;
  ctx.response.body = { status: "queued" };
});

const PORT = Number(Deno.env.get("PORT") ?? 8000);
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`[order-alert] Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });


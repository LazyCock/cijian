import { query, closeDb } from "../db";

/**
 * Outbox consumer skeleton. The web tier can enqueue domain events without
 * blocking the request; this worker drains them in order. Notification fanout
 * and e-mail delivery belong here so they can scale independently.
 */
let running = true;
let draining = false;

async function tick() {
  if (!running || draining) return;
  draining = true;
  try {
    const events = await query<{ id: string; topic: string; payload: unknown; attempts: number }>(
      `SELECT id, topic, payload, attempts FROM outbox
       WHERE processed_at IS NULL ORDER BY created_at ASC LIMIT 50`,
    );
    for (const event of events) {
      // Delivery handlers are added per topic here. Marking the row processed
      // is intentionally separate from the web request path.
      console.log(JSON.stringify({ event: "outbox.delivered", topic: event.topic, id: event.id }));
      await query("UPDATE outbox SET processed_at = now(), attempts = attempts + 1 WHERE id = $1::uuid", [event.id]);
    }
    if (events.length === 0) {
      // Keep the loop quiet but observable.
      if (process.env.WORKER_VERBOSE === "true") {
        console.log(JSON.stringify({ event: "outbox.idle", at: new Date().toISOString() }));
      }
    }
    if (events.length === 50) {
      setImmediate(tick);
    }
  } catch (error) {
    console.error("worker.tick.failed", error);
  } finally {
    draining = false;
  }
}

const timer = setInterval(tick, 2_000);
void tick();

async function shutdown(signal: string) {
  if (!running) return;
  running = false;
  clearInterval(timer);
  console.log(JSON.stringify({ event: "worker.stopped", signal }));
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

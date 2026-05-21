/**
 * MongoDB-backed Notification Queue
 *
 * Why MongoDB instead of Redis/Bull:
 *   - No additional infrastructure to deploy or manage
 *   - Persists across restarts (jobs survive server crashes)
 *   - Full audit trail in the same database
 *   - Sufficient throughput for a startup-scale event platform
 *
 * Job lifecycle:
 *   pending → processing → sent        (success)
 *   pending → processing → retrying    (failure, attempts < maxAttempts)
 *   retrying → processing → retrying   (still failing)
 *   retrying → processing → dead       (maxAttempts exhausted)
 *
 * Retry delays (exponential back-off):
 *   attempt 1 failed → retry in 30s
 *   attempt 2 failed → retry in 2 min
 *   attempt 3 failed → dead (logged, no more retries)
 */

import { NotificationLog } from "../models/NotificationLog";
import { sendWhatsApp } from "./whatsapp.service";
import { sendSms } from "./sms.service";
import type { WhatsAppMessage } from "./whatsapp.service";
import type { SmsMessage } from "./sms.service";

export type QueuePayload = WhatsAppMessage | SmsMessage;

// Back-off delays in milliseconds: 30 s, 2 min, 10 min
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000];

let workerTimer: ReturnType<typeof setInterval> | null = null;

// ── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueNotification(params: {
  channel: "whatsapp" | "sms";
  payload: QueuePayload;
  userId?: string;
  eventId?: string;
}): Promise<void> {
  try {
    await NotificationLog.create({
      channel: params.channel,
      to: params.payload.to,
      type: params.payload.type,
      payload: params.payload as unknown as Record<string, unknown>,
      status: "pending",
      nextRetryAt: new Date(), // process immediately on next worker tick
      userId: params.userId ?? null,
      eventId: params.eventId ?? null,
    });

    // Trigger immediate processing of the queue instead of waiting for the cron tick
    processQueue().catch(() => {});
  } catch (err: any) {
    console.error("[Queue] Failed to enqueue notification:", err.message);
  }
}

// ── Process a single job ──────────────────────────────────────────────────────

async function processJob(jobId: string): Promise<void> {
  const job = await NotificationLog.findOneAndUpdate(
    { _id: jobId, status: { $in: ["pending", "retrying"] } },
    {
      $set: { status: "processing", lastAttemptAt: new Date() },
      $inc: { attempts: 1 },
    },
    { returnDocument: "after" }
  );

  if (!job) return; // Job not found, or already processed/processing by another worker tick

  try {
    let success = false;

    if (job.channel === "whatsapp") {
      success = await sendWhatsApp(job.payload as unknown as WhatsAppMessage);
    } else {
      success = await sendSms(job.payload as unknown as SmsMessage);
    }

    if (!success) throw new Error("Provider returned false");

    job.status = "sent";
    job.sentAt = new Date();
    job.lastError = null;
    console.log(`[Queue] ✅ ${job.channel} sent to ${job.to} (job ${job._id})`);
  } catch (err: any) {
    job.lastError = String(err.message).slice(0, 500);

    if (job.attempts >= job.maxAttempts) {
      job.status = "dead";
      console.error(
        `[Queue] ☠️  Job ${job._id} dead after ${job.attempts} attempts: ${job.lastError}`
      );
    } else {
      const delayMs =
        RETRY_DELAYS_MS[job.attempts - 1] ??
        RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      job.status = "retrying";
      job.nextRetryAt = new Date(Date.now() + delayMs);
      console.warn(
        `[Queue] ⚠️  Job ${job._id} attempt ${job.attempts}/${job.maxAttempts} failed — retry in ${delayMs / 1000}s`
      );
    }
  }

  await job.save();
}

// ── Worker tick ───────────────────────────────────────────────────────────────

export async function processQueue(): Promise<void> {
  const now = new Date();
  try {
    // Fetch up to 20 jobs due for processing (pending or scheduled retry)
    const jobs = await NotificationLog.find({
      status: { $in: ["pending", "retrying"] },
      nextRetryAt: { $lte: now },
    })
      .limit(20)
      .select("_id");

    if (jobs.length > 0) {
      console.log(`[Queue] Processing ${jobs.length} job(s)…`);
    }

    await Promise.allSettled(jobs.map((j) => processJob(String(j._id))));
  } catch (err: any) {
    console.error("[Queue] Worker tick error:", err.message);
  }
}

// ── Worker lifecycle ──────────────────────────────────────────────────────────

export function startQueueWorker(): void {
  if (workerTimer) return; // already running

  // Drain any leftover pending jobs immediately, then poll every 60 s
  processQueue().catch(() => {});
  workerTimer = setInterval(() => processQueue().catch(() => {}), 60_000);
  console.log("[Queue] Notification queue worker started (60 s interval)");
}

export function stopQueueWorker(): void {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

// ── Stats (for /api/test/queue status endpoint) ───────────────────────────────

export async function getQueueStats(): Promise<Record<string, number>> {
  const rows = await NotificationLog.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return rows.reduce(
    (acc: Record<string, number>, { _id, count }: { _id: string; count: number }) => {
      acc[_id] = count;
      return acc;
    },
    {}
  );
}

try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import {
  claimDueNotificationOutboxRecords,
  markNotificationOutboxRecordFailed,
  markNotificationOutboxRecordSent,
} from "@/lib/data/notification-outbox";
import { sendBookingNotificationEmail } from "@/lib/server/booking-notification-email";

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildProcessorRunId(now = Date.now()) {
  return `booking_notification_run_${now}`;
}

export async function processBookingNotificationOutbox({
  now = new Date().toISOString(),
  batchSize = 50,
  staleAfterMs = 15 * 60 * 1000,
  actorId = "system",
  processorRunId = "",
} = {}) {
  const resolvedProcessorRunId = processorRunId || buildProcessorRunId(Date.now());
  const claimedRecords = await claimDueNotificationOutboxRecords({
    now,
    batchSize: Math.max(1, normalizeInteger(batchSize, 50)),
    staleAfterMs: Math.max(1, normalizeInteger(staleAfterMs, 15 * 60 * 1000)),
    processorRunId: resolvedProcessorRunId,
  });

  const summary = {
    processorRunId: resolvedProcessorRunId,
    claimed: claimedRecords.length,
    sent: 0,
    failed: 0,
    logged: 0,
    results: [],
  };

  for (const notification of claimedRecords) {
    let delivery;

    try {
      delivery = await sendBookingNotificationEmail(notification);
    } catch (error) {
      delivery = {
        status: "failed",
        attemptedAt: new Date().toISOString(),
        sentAt: "",
        provider: "",
        providerMessageId: "",
        error: String(error?.message || error),
      };
    }

    if (delivery?.status === "failed") {
      await markNotificationOutboxRecordFailed(
        notification.hubId,
        notification.id,
        {
          attemptedAt: delivery.attemptedAt,
          error: delivery.error,
        },
        actorId
      );
      summary.failed += 1;
    } else {
      await markNotificationOutboxRecordSent(
        notification.hubId,
        notification.id,
        {
          provider: delivery.provider,
          providerMessageId: delivery.providerMessageId,
          attemptedAt: delivery.attemptedAt,
          sentAt: delivery.sentAt || delivery.attemptedAt,
        },
        actorId
      );

      if (delivery?.status === "logged") {
        summary.logged += 1;
      } else {
        summary.sent += 1;
      }
    }

    summary.results.push({
      notificationId: notification.id,
      hubId: notification.hubId,
      kind: notification.kind,
      recipientEmail: notification.recipientEmail,
      status: delivery?.status || "unknown",
      error: delivery?.error || "",
      providerMessageId: delivery?.providerMessageId || "",
    });
  }

  return summary;
}

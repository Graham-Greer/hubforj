import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildNotificationOutboxDocumentId,
  isNotificationOutboxRecordStale,
  normalizeNotificationOutboxRecord,
} from "../../src/lib/data/notification-outbox.js";

test("notification outbox normalization keeps lifecycle fields explicit and stable", () => {
  const record = normalizeNotificationOutboxRecord({
    id: "notification_123",
    hubId: "hub_123",
    kind: "event_booking_confirmed",
    sourceType: "eventBooking",
    sourceId: "booking_123",
    parentType: "event",
    parentId: "event_123",
    recipientEmail: "MEMBER@example.com",
    attemptCount: "2",
    payloadVersion: "3",
    status: "sent",
  });

  assert.equal(record.recipientEmail, "member@example.com");
  assert.equal(record.attemptCount, 2);
  assert.equal(record.payloadVersion, 3);
  assert.equal(record.status, "sent");
});

test("notification outbox document ids are deterministic hashes of dedupe keys", () => {
  const dedupeKey = "event_booking_confirmed:hub_123:event:event_123:eventBooking:booking_123:user_123";

  assert.equal(
    buildNotificationOutboxDocumentId(dedupeKey),
    buildNotificationOutboxDocumentId(dedupeKey)
  );
  assert.match(buildNotificationOutboxDocumentId(dedupeKey), /^notification_[a-f0-9]{32}$/);
});

test("notification outbox stale processing helper detects recoverable stuck jobs", () => {
  assert.equal(
    isNotificationOutboxRecordStale(
      {
        status: "processing",
        processingStartedAt: "2026-06-05T10:00:00.000Z",
      },
      {
        now: "2026-06-05T10:20:01.000Z",
        staleAfterMs: 15 * 60 * 1000,
      }
    ),
    true
  );

  assert.equal(
    isNotificationOutboxRecordStale(
      {
        status: "processing",
        processingStartedAt: "2026-06-05T10:10:00.000Z",
      },
      {
        now: "2026-06-05T10:20:01.000Z",
        staleAfterMs: 15 * 60 * 1000,
      }
    ),
    false
  );
});

test("notification outbox source uses collection-group lookup and transactional claiming", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/notification-outbox.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /collectionGroup\("notificationOutbox"\)/);
  assert.match(source, /runTransaction/);
  assert.match(source, /claimDueNotificationOutboxRecords/);
  assert.match(source, /listStaleProcessingNotificationOutboxRecords/);
});

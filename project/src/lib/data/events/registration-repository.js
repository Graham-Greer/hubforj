try {
  await import("server-only");
} catch {
  // Unit tests run in plain Node where this package may not be installed.
}
import crypto from "node:crypto";
import { getDataProvider } from "@/lib/data/shared/provider";
import { getEventById } from "@/lib/data/events/event-repository";
import { getLatestMembershipByUser } from "@/lib/data/memberships/membership-repository";
import {
  resolveInitialPaymentStatusForEvent,
  validateAttendanceStatus,
  validatePaymentStatusForEvent,
  validateRegistrationStatusTransition,
} from "@/lib/validation/registrations";

function registrationToViewModel(registration) {
  return {
    id: registration.id,
    hubId: registration.hubId,
    eventId: registration.eventId,
    userId: registration.userId,
    status: registration.status,
    paymentStatus: registration.paymentStatus,
    attendanceStatus: registration.attendanceStatus,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    notes: registration.notes || "",
  };
}

function getMemoryKey(hubId, eventId) {
  return `${hubId}:${eventId}`;
}

function getMemoryRegistrations(db, hubId, eventId) {
  const key = getMemoryKey(hubId, eventId);
  return db.registrations.get(key) || [];
}

function setMemoryRegistrations(db, hubId, eventId, rows) {
  const key = getMemoryKey(hubId, eventId);
  db.registrations.set(key, rows);
}

async function countRegistered(provider, hubId, eventId) {
  if (provider.type === "firestore") {
    const snap = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .where("status", "==", "registered")
      .get();

    return snap.size;
  }

  return getMemoryRegistrations(provider.db, hubId, eventId).filter((row) => row.status === "registered").length;
}

export async function listRegistrationsByEvent(hubId, eventId, options = {}) {
  const provider = getDataProvider();
  const statusFilter = String(options.status || "all").trim();
  const search = String(options.search || "").trim().toLowerCase();

  let rows;
  if (provider.type === "firestore") {
    const snap = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .orderBy("createdAt", "desc")
      .get();

    rows = snap.docs.map((doc) => registrationToViewModel({ id: doc.id, hubId, eventId, ...doc.data() }));
  } else {
    rows = getMemoryRegistrations(provider.db, hubId, eventId).map(registrationToViewModel);
  }

  return rows.filter((row) => {
    const byStatus = statusFilter === "all" ? true : row.status === statusFilter;
    const bySearch = search
      ? String(row.userId || "").toLowerCase().includes(search) || String(row.notes || "").toLowerCase().includes(search)
      : true;

    return byStatus && bySearch;
  });
}

export async function listRegistrationsByUser(hubId, userId) {
  const provider = getDataProvider();
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return [];

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collectionGroup("registrations")
      .where("hubId", "==", hubId)
      .where("userId", "==", normalizedUserId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return registrationToViewModel({
        id: doc.id,
        hubId: data.hubId || hubId,
        eventId: data.eventId || "",
        ...data,
      });
    });
  }

  const rows = [];
  for (const [key, registrations] of provider.db.registrations.entries()) {
    if (!String(key).startsWith(`${hubId}:`)) continue;
    for (const row of registrations) {
      if (row.userId === normalizedUserId) {
        rows.push(registrationToViewModel(row));
      }
    }
  }

  return rows.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
}

export async function getRegistrationById(hubId, eventId, registrationId) {
  const provider = getDataProvider();

  if (provider.type === "firestore") {
    const doc = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .doc(registrationId)
      .get();

    if (!doc.exists) return null;
    return registrationToViewModel({ id: doc.id, hubId, eventId, ...doc.data() });
  }

  const found = getMemoryRegistrations(provider.db, hubId, eventId).find((row) => row.id === registrationId);
  return found ? registrationToViewModel(found) : null;
}

export async function getLatestRegistrationByUserForEvent(hubId, eventId, userId) {
  const provider = getDataProvider();
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;

  if (provider.type === "firestore") {
    const snapshot = await provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .where("userId", "==", normalizedUserId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return registrationToViewModel({ id: doc.id, hubId, eventId, ...doc.data() });
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId)
    .filter((row) => row.userId === normalizedUserId)
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));

  return rows.length ? registrationToViewModel(rows[0]) : null;
}

export async function getRegistrationStats(hubId, eventId) {
  const all = await listRegistrationsByEvent(hubId, eventId, { status: "all" });
  const stats = {
    total: all.length,
    registered: 0,
    waitlisted: 0,
    cancelled: 0,
  };

  all.forEach((item) => {
    if (item.status === "registered") stats.registered += 1;
    if (item.status === "waitlisted") stats.waitlisted += 1;
    if (item.status === "cancelled") stats.cancelled += 1;
  });

  return stats;
}

export async function createRegistration(hubId, eventId, payload, actorId = "system") {
  const provider = getDataProvider();
  const event = await getEventById(hubId, eventId);
  if (!event) throw new Error("Event not found.");
  if (event.status !== "published") {
    throw new Error("Only published events can accept registrations.");
  }

  const now = new Date().toISOString();
  const userId = String(payload.userId || "").trim();
  if (!userId) throw new Error("userId is required.");

  const existing = await getLatestRegistrationByUserForEvent(hubId, eventId, userId);
  if (existing && existing.status !== "cancelled") {
    throw new Error("You already have an active registration for this event.");
  }

  if (event.registrationEligibility === "members-only") {
    const membership = await getLatestMembershipByUser(hubId, userId);
    if (!membership || membership.status !== "active") {
      throw new Error("This event is members-only and requires an active membership.");
    }
  }

  const initialPaymentStatus = resolveInitialPaymentStatusForEvent(event.pricingMode);

  if (provider.type === "firestore") {
    const eventRef = provider.db.collection("hubs").doc(hubId).collection("events").doc(eventId);
    const regRef = eventRef.collection("registrations").doc();

    await provider.db.runTransaction(async (txn) => {
      const registeredSnap = await txn.get(eventRef.collection("registrations").where("status", "==", "registered"));
      const status = registeredSnap.size < Number(event.capacity || 0) ? "registered" : "waitlisted";

      txn.set(regRef, {
        hubId,
        eventId,
        userId,
        status,
        paymentStatus: initialPaymentStatus,
        attendanceStatus: "unknown",
        notes: String(payload.notes || "").trim(),
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
      });
    });

    const created = await regRef.get();
    return registrationToViewModel({ id: created.id, hubId, eventId, ...created.data() });
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId);
  const registeredCount = rows.filter((row) => row.status === "registered").length;
  const status = registeredCount < Number(event.capacity || 0) ? "registered" : "waitlisted";
  const row = {
    id: `reg_${crypto.randomUUID().slice(0, 8)}`,
    hubId,
    eventId,
    userId,
    status,
    paymentStatus: initialPaymentStatus,
    attendanceStatus: "unknown",
    notes: String(payload.notes || "").trim(),
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
  };

  setMemoryRegistrations(provider.db, hubId, eventId, [row, ...rows]);
  return registrationToViewModel(row);
}

export async function promoteWaitlistedRegistration(hubId, eventId, registrationId, actorId = "system") {
  const provider = getDataProvider();
  const registration = await getRegistrationById(hubId, eventId, registrationId);
  if (!registration) throw new Error("Registration not found.");

  validateRegistrationStatusTransition(registration.status, "registered");
  const event = await getEventById(hubId, eventId);
  if (!event) throw new Error("Event not found.");

  if (provider.type === "firestore") {
    const regRef = provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .doc(registrationId);

    await provider.db.runTransaction(async (txn) => {
      const registeredSnap = await txn.get(
        provider.db
          .collection("hubs")
          .doc(hubId)
          .collection("events")
          .doc(eventId)
          .collection("registrations")
          .where("status", "==", "registered")
      );

      if (registeredSnap.size >= Number(event.capacity || 0)) {
        throw new Error("Cannot promote waitlisted registration: event capacity is full.");
      }

      txn.update(regRef, {
        status: "registered",
        updatedAt: new Date().toISOString(),
        updatedBy: actorId,
      });
    });

    const updated = await regRef.get();
    return registrationToViewModel({ id: updated.id, hubId, eventId, ...updated.data() });
  }

  const registeredCount = await countRegistered(provider, hubId, eventId);
  if (registeredCount >= Number(event.capacity || 0)) {
    throw new Error("Cannot promote waitlisted registration: event capacity is full.");
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId);
  const index = rows.findIndex((row) => row.id === registrationId);
  if (index === -1) throw new Error("Registration not found.");

  const next = {
    ...rows[index],
    status: "registered",
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  const clone = [...rows];
  clone[index] = next;
  setMemoryRegistrations(provider.db, hubId, eventId, clone);
  return registrationToViewModel(next);
}

export async function cancelRegistration(hubId, eventId, registrationId, actorId = "system") {
  const provider = getDataProvider();
  const registration = await getRegistrationById(hubId, eventId, registrationId);
  if (!registration) throw new Error("Registration not found.");

  validateRegistrationStatusTransition(registration.status, "cancelled");

  const patch = {
    status: "cancelled",
    attendanceStatus: "unknown",
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  if (provider.type === "firestore") {
    const ref = provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .doc(registrationId);

    await ref.update(patch);
    const updated = await ref.get();
    return registrationToViewModel({ id: updated.id, hubId, eventId, ...updated.data() });
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId);
  const index = rows.findIndex((row) => row.id === registrationId);
  if (index === -1) throw new Error("Registration not found.");

  const next = { ...rows[index], ...patch };
  const clone = [...rows];
  clone[index] = next;
  setMemoryRegistrations(provider.db, hubId, eventId, clone);
  return registrationToViewModel(next);
}

export async function updateRegistrationPaymentStatus(hubId, eventId, registrationId, paymentStatus, actorId = "system") {
  const provider = getDataProvider();
  const registration = await getRegistrationById(hubId, eventId, registrationId);
  if (!registration) throw new Error("Registration not found.");

  const event = await getEventById(hubId, eventId);
  if (!event) throw new Error("Event not found.");

  const nextPaymentStatus = validatePaymentStatusForEvent(event.pricingMode, paymentStatus);
  const patch = {
    paymentStatus: nextPaymentStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  if (provider.type === "firestore") {
    const ref = provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .doc(registrationId);

    await ref.update(patch);
    const updated = await ref.get();
    return registrationToViewModel({ id: updated.id, hubId, eventId, ...updated.data() });
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId);
  const index = rows.findIndex((row) => row.id === registrationId);
  if (index === -1) throw new Error("Registration not found.");

  const next = { ...rows[index], ...patch };
  const clone = [...rows];
  clone[index] = next;
  setMemoryRegistrations(provider.db, hubId, eventId, clone);
  return registrationToViewModel(next);
}

export async function updateRegistrationAttendanceStatus(hubId, eventId, registrationId, attendanceStatus, actorId = "system") {
  const provider = getDataProvider();
  const registration = await getRegistrationById(hubId, eventId, registrationId);
  if (!registration) throw new Error("Registration not found.");

  const nextAttendanceStatus = validateAttendanceStatus(registration.status, attendanceStatus);
  const patch = {
    attendanceStatus: nextAttendanceStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  if (provider.type === "firestore") {
    const ref = provider.db
      .collection("hubs")
      .doc(hubId)
      .collection("events")
      .doc(eventId)
      .collection("registrations")
      .doc(registrationId);

    await ref.update(patch);
    const updated = await ref.get();
    return registrationToViewModel({ id: updated.id, hubId, eventId, ...updated.data() });
  }

  const rows = getMemoryRegistrations(provider.db, hubId, eventId);
  const index = rows.findIndex((row) => row.id === registrationId);
  if (index === -1) throw new Error("Registration not found.");

  const next = { ...rows[index], ...patch };
  const clone = [...rows];
  clone[index] = next;
  setMemoryRegistrations(provider.db, hubId, eventId, clone);
  return registrationToViewModel(next);
}

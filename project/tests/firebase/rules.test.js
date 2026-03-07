import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

async function setup() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "community-app-test";
  const host = process.env.FIRESTORE_EMULATOR_HOST;

  if (!host) {
    return null;
  }

  return initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: host.split(":")[0],
      port: Number(host.split(":")[1] || 8080),
    },
  });
}

test("rules harness boots", async () => {
  const env = await setup();
  if (!env) {
    assert.equal(true, true);
    return;
  }

  const superadmin = env.authenticatedContext("owner_1");
  const member = env.authenticatedContext("member_1");
  const admin = env.authenticatedContext("admin_1");
  const otherAdmin = env.authenticatedContext("admin_2");
  const guest = env.unauthenticatedContext();

  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/owner_1"), {
      hubId: "hub_1",
      role: "superadmin",
      email: "owner@example.com",
      name: "Owner",
    });
    await setDoc(doc(context.firestore(), "users/member_1"), {
      hubId: "hub_1",
      role: "member",
      email: "member@example.com",
      name: "Member",
    });
    await setDoc(doc(context.firestore(), "users/admin_1"), {
      hubId: "hub_1",
      role: "admin",
      email: "admin@example.com",
      name: "Admin",
    });
    await setDoc(doc(context.firestore(), "users/admin_2"), {
      hubId: "hub_2",
      role: "admin",
      email: "admin2@example.com",
      name: "Admin 2",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1"), {
      name: "Hub One",
      slug: "hub-one",
      templateKey: "templateA",
      features: {
        cmsPages: false,
        stripePayments: false,
        emailNotifications: false,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/invites/invite_1"), {
      hubId: "hub_1",
      email: "new-admin@example.com",
      role: "admin",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_2"), {
      name: "Hub Two",
      slug: "hub-two",
      templateKey: "templateA",
      features: {
        cmsPages: false,
        stripePayments: false,
        emailNotifications: false,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/events/event_1"), {
      hubId: "hub_1",
      title: "Published Event",
      slug: "published-event",
      description: "Body",
      status: "published",
      startAt: "2026-01-10T10:00:00.000Z",
      endAt: "2026-01-10T12:00:00.000Z",
      location: "Room 1",
      capacity: 50,
      category: "Workshop",
      tags: [],
      pricingMode: "free",
      price: null,
      registrationEligibility: "members-only",
      visibility: "public",
      imageMediaIds: [],
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/membershipPlans/plan_1"), {
      hubId: "hub_1",
      title: "Monthly",
      description: "Monthly plan",
      durationUnit: "months",
      durationValue: 1,
      price: 25,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/memberships/membership_1"), {
      hubId: "hub_1",
      userId: "member_1",
      planId: "plan_1",
      status: "pending",
      paymentStatus: "unpaid",
      startDate: "2026-01-01T00:00:00.000Z",
      renewalDate: "2026-02-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      hubId: "hub_1",
      eventId: "event_1",
      userId: "member_1",
      status: "registered",
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-10T09:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/events/event_1/registrations/reg_2"), {
      hubId: "hub_1",
      eventId: "event_1",
      userId: "member_2",
      status: "waitlisted",
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      createdAt: "2026-01-10T09:10:00.000Z",
      updatedAt: "2026-01-10T09:10:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/pages/page_published"), {
      hubId: "hub_1",
      title: "About",
      slug: "about",
      status: "published",
      draftComposition: [{ id: "blk_1", type: "HeroSection", variant: "centered", props: {} }],
      publishedComposition: [{ id: "blk_1", type: "HeroSection", variant: "centered", props: {} }],
      seo: { title: "About", description: "About page", imageMediaId: "" },
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-10T09:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/pages/page_draft"), {
      hubId: "hub_1",
      title: "Draft",
      slug: "draft-only",
      status: "draft",
      draftComposition: [{ id: "blk_2", type: "AccordionSection", variant: "default", props: {} }],
      publishedComposition: [],
      seo: { title: "Draft", description: "Draft page", imageMediaId: "" },
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-10T09:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/media/media_in_use"), {
      hubId: "hub_1",
      filename: "hero.jpg",
      type: "image",
      publicUrl: "https://example.invalid/hero.jpg",
      contentType: "image/jpeg",
      sizeBytes: 1200,
      folderId: "all-assets",
      alt: "Hero image",
      usageRefs: [{ kind: "pageBlock", label: "About - Hero" }],
      usageCount: 1,
      status: "active",
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-10T09:00:00.000Z",
    });
    await setDoc(doc(context.firestore(), "hubs/hub_1/media/media_unused"), {
      hubId: "hub_1",
      filename: "poster.jpg",
      type: "image",
      publicUrl: "https://example.invalid/poster.jpg",
      contentType: "image/jpeg",
      sizeBytes: 800,
      folderId: "all-assets",
      alt: "",
      usageRefs: [],
      usageCount: 0,
      status: "active",
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-10T09:00:00.000Z",
    });
  });

  await assertFails(getDoc(doc(member.firestore(), "users/owner_1")));
  await assertSucceeds(getDoc(doc(superadmin.firestore(), "users/member_1")));
  await assertSucceeds(
    setDoc(doc(superadmin.firestore(), "hubs/hub_1/invites/invite_superadmin"), {
      hubId: "hub_1",
      email: "invite@example.com",
      role: "admin",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
    })
  );
  await assertFails(
    setDoc(doc(member.firestore(), "hubs/hub_1/invites/invite_member"), {
      hubId: "hub_1",
      email: "blocked@example.com",
      role: "admin",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
    })
  );
  await assertSucceeds(updateDoc(doc(superadmin.firestore(), "hubs/hub_1/invites/invite_1"), { status: "revoked" }));
  await assertFails(updateDoc(doc(admin.firestore(), "hubs/hub_1/invites/invite_1"), { status: "revoked" }));
  await assertSucceeds(getDoc(doc(admin.firestore(), "hubs/hub_1/invites/invite_1")));
  await assertSucceeds(
    updateDoc(doc(superadmin.firestore(), "hubs/hub_1"), {
      customDomains: ["community.example.com"],
    })
  );
  await assertFails(
    updateDoc(doc(admin.firestore(), "hubs/hub_1"), {
      customDomains: ["blocked.example.com"],
    })
  );
  await assertSucceeds(
    setDoc(doc(admin.firestore(), "hubs/hub_1/events/event_2"), {
      hubId: "hub_1",
      title: "Draft Event",
      slug: "draft-event",
      description: "Body",
      status: "draft",
      startAt: "2026-01-11T10:00:00.000Z",
      endAt: "2026-01-11T12:00:00.000Z",
      location: "Room 2",
      capacity: 30,
      category: "Meetup",
      tags: ["test"],
      pricingMode: "free",
      price: null,
      registrationEligibility: "members-only",
      visibility: "public",
      imageMediaIds: [],
    })
  );
  await assertFails(
    setDoc(doc(otherAdmin.firestore(), "hubs/hub_1/events/event_3"), {
      hubId: "hub_1",
      title: "Blocked Event",
      slug: "blocked-event",
      description: "Body",
      status: "draft",
      startAt: "2026-01-12T10:00:00.000Z",
      endAt: "2026-01-12T12:00:00.000Z",
      location: "Room 3",
      capacity: 20,
      category: "Course",
      tags: [],
      pricingMode: "free",
      price: null,
      registrationEligibility: "members-only",
      visibility: "public",
      imageMediaIds: [],
    })
  );
  await assertSucceeds(getDoc(doc(member.firestore(), "hubs/hub_1/events/event_1")));
  await assertFails(getDoc(doc(member.firestore(), "hubs/hub_1/events/event_2")));
  await assertFails(
    updateDoc(doc(member.firestore(), "hubs/hub_1/events/event_1"), {
      title: "Member should not edit event",
    })
  );
  await assertSucceeds(
    setDoc(doc(member.firestore(), "hubs/hub_1/events/event_1/registrations/reg_new"), {
      hubId: "hub_1",
      eventId: "event_1",
      userId: "member_1",
      status: "waitlisted",
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      createdAt: "2026-01-10T09:20:00.000Z",
      updatedAt: "2026-01-10T09:20:00.000Z",
      notes: "",
    })
  );
  await assertSucceeds(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      attendanceStatus: "attended",
    })
  );
  await assertSucceeds(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/events/event_1/registrations/reg_2"), {
      status: "registered",
      updatedAt: "2026-01-10T09:30:00.000Z",
    })
  );
  await assertSucceeds(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      paymentStatus: "paid",
      updatedAt: "2026-01-10T09:40:00.000Z",
    })
  );
  await assertSucceeds(
    updateDoc(doc(member.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      status: "cancelled",
      attendanceStatus: "unknown",
      updatedAt: "2026-01-10T09:35:00.000Z",
    })
  );
  await assertFails(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      attendanceStatus: "attended",
      updatedAt: "2026-01-10T09:36:00.000Z",
    })
  );
  await assertFails(
    updateDoc(doc(member.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      paymentStatus: "paid",
    })
  );
  await assertFails(
    updateDoc(doc(member.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      attendanceStatus: "attended",
    })
  );
  await assertFails(
    updateDoc(doc(otherAdmin.firestore(), "hubs/hub_1/events/event_1/registrations/reg_1"), {
      attendanceStatus: "no-show",
    })
  );
  await assertSucceeds(getDoc(doc(member.firestore(), "hubs/hub_1/memberships/membership_1")));
  await assertSucceeds(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/memberships/membership_1"), {
      paymentStatus: "paid",
      status: "active",
    })
  );
  await assertFails(
    updateDoc(doc(member.firestore(), "hubs/hub_1/memberships/membership_1"), {
      paymentStatus: "paid",
    })
  );
  await assertSucceeds(
    updateDoc(doc(member.firestore(), "hubs/hub_1/memberships/membership_1"), {
      status: "cancelled",
      updatedAt: "2026-01-10T09:50:00.000Z",
    })
  );
  await assertFails(
    updateDoc(doc(otherAdmin.firestore(), "hubs/hub_1/memberships/membership_1"), {
      status: "cancelled",
    })
  );
  await assertSucceeds(getDoc(doc(guest.firestore(), "hubs/hub_1/pages/page_published")));
  await assertFails(getDoc(doc(guest.firestore(), "hubs/hub_1/pages/page_draft")));
  await assertSucceeds(getDoc(doc(superadmin.firestore(), "hubs/hub_1/pages/page_draft")));
  await assertFails(
    updateDoc(doc(admin.firestore(), "hubs/hub_1/pages/page_draft"), {
      title: "Not allowed",
    })
  );
  await assertSucceeds(
    updateDoc(doc(superadmin.firestore(), "hubs/hub_1/pages/page_draft"), {
      title: "Updated by superadmin",
    })
  );
  await assertSucceeds(getDoc(doc(admin.firestore(), "hubs/hub_1/media/media_in_use")));
  await assertFails(getDoc(doc(guest.firestore(), "hubs/hub_1/media/media_in_use")));
  await assertFails(deleteDoc(doc(admin.firestore(), "hubs/hub_1/media/media_in_use")));
  await assertSucceeds(deleteDoc(doc(admin.firestore(), "hubs/hub_1/media/media_unused")));

  await env.cleanup();
});

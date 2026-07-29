try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import crypto from "node:crypto";

import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

export const legalSummaryGeneratorVersion = "hub-data-use-v1";

function normalizeString(value) {
  return String(value || "").trim();
}

function createHashFromObject(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function createSection({
  key,
  title,
  visibility,
  platformResponsibility,
  hubOwnerResponsibility,
  dataFields,
  plainEnglish,
  suggestedPrivacyTopics = [],
  suggestedTermsTopics = [],
}) {
  return {
    key,
    title,
    visibility,
    platformResponsibility,
    hubOwnerResponsibility,
    dataFields,
    plainEnglish,
    suggestedPrivacyTopics,
    suggestedTermsTopics,
  };
}

async function collectionHasDocuments(collectionRef) {
  const snapshot = await collectionRef.limit(1).get();
  return !snapshot.empty;
}

async function buildHubFeaturePresence(hub) {
  const db = getFirebaseAdminDb();
  const hubRef = db.collection("hubs").doc(hub.id);

  const [
    membershipPlansExist,
    membershipsExist,
    eventsExist,
    coursesExist,
    mediaAssetsExist,
    testimonialsExist,
  ] = await Promise.all([
    collectionHasDocuments(hubRef.collection("membershipPlans")),
    collectionHasDocuments(hubRef.collection("memberships")),
    collectionHasDocuments(hubRef.collection("events")),
    collectionHasDocuments(hubRef.collection("courses")),
    collectionHasDocuments(hubRef.collection("mediaAssets")),
    collectionHasDocuments(hubRef.collection("testimonials")),
  ]);

  return {
    membershipPlansExist,
    membershipsExist,
    eventsExist,
    coursesExist,
    mediaAssetsExist,
    testimonialsExist,
  };
}

function buildCapabilitySnapshot(hub, paymentConfiguration, presence) {
  const packageCapabilities = hub?.packageCapabilities || {};

  return {
    hubId: normalizeString(hub?.id),
    hubSlug: normalizeString(hub?.slug),
    customDomainConnected: normalizeString(hub?.customDomain?.status) === "connected",
    packageTier: normalizeString(hub?.packageTier),
    packageStatus: normalizeString(hub?.packageStatus),
    paymentProcessingMode: normalizeString(hub?.packagePaymentProcessingMode),
    capabilities: {
      eventsEnabled: packageCapabilities.eventsEnabled === true,
      coursesEnabled: packageCapabilities.coursesEnabled === true,
      testimonialsEnabled: packageCapabilities.testimonialsEnabled === true,
      memberListEnabled: packageCapabilities.memberListEnabled === true,
      nativePaymentsEnabled: packageCapabilities.nativePaymentsEnabled === true,
      paymentsEnabled: packageCapabilities.paymentsEnabled === true,
      paidEventsEnabled: packageCapabilities.paidEventsEnabled === true,
      paidCoursesEnabled: packageCapabilities.paidCoursesEnabled === true,
      paidMembershipsEnabled: packageCapabilities.paidMembershipsEnabled === true,
      transactionalBookingEmailsEnabled: packageCapabilities.transactionalBookingEmailsEnabled === true,
      emailRemindersEnabled: packageCapabilities.emailRemindersEnabled === true,
      customDomainEnabled: packageCapabilities.customDomainEnabled === true,
    },
    featurePresence: presence,
    paymentConfiguration: {
      status: normalizeString(paymentConfiguration?.status),
      isReady: paymentConfiguration?.isReady === true,
      hasConnectedAccount: paymentConfiguration?.hasConnectedAccount === true,
      stripeAccountIdPresent: Boolean(normalizeString(paymentConfiguration?.stripeAccountId)),
      provider: normalizeString(paymentConfiguration?.provider),
    },
  };
}

function buildChangeItems(previousSnapshot = null, currentSnapshot) {
  if (!previousSnapshot) {
    return [];
  }

  const changes = [];
  const previousCapabilities = previousSnapshot.capabilities || {};
  const currentCapabilities = currentSnapshot.capabilities || {};
  const previousPresence = previousSnapshot.featurePresence || {};
  const currentPresence = currentSnapshot.featurePresence || {};
  const previousPayments = previousSnapshot.paymentConfiguration || {};
  const currentPayments = currentSnapshot.paymentConfiguration || {};

  if (!previousCapabilities.paidMembershipsEnabled && currentCapabilities.paidMembershipsEnabled) {
    changes.push({
      key: "paid_memberships_enabled",
      category: "payments",
      title: "Paid memberships are now enabled",
      description: "This hub can now support paid membership pricing and related payment-status handling.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousCapabilities.paidEventsEnabled && currentCapabilities.paidEventsEnabled) {
    changes.push({
      key: "paid_events_enabled",
      category: "payments",
      title: "Paid event flows are now enabled",
      description: "This hub can now use paid event registration flows and related payment-status handling.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousCapabilities.nativePaymentsEnabled && currentCapabilities.nativePaymentsEnabled) {
    changes.push({
      key: "native_payments_enabled",
      category: "payments",
      title: "Built-in payments are now available",
      description: "This hub can now move from external payment handling toward built-in payment flows where configured.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousPayments.isReady && currentPayments.isReady) {
    changes.push({
      key: "stripe_ready",
      category: "payments",
      title: "Stripe payments are now ready",
      description: "This hub now has a ready connected payment configuration for eligible built-in payment flows.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousPresence.membershipPlansExist && currentPresence.membershipPlansExist) {
    changes.push({
      key: "membership_plans_created",
      category: "memberships",
      title: "Membership plans are now in use",
      description: "This hub now has membership plan records and membership administration features in active use.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousPresence.eventsExist && currentPresence.eventsExist) {
    changes.push({
      key: "events_created",
      category: "events",
      title: "Events are now in use",
      description: "This hub now has event records and event registration or attendance workflows may apply.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousPresence.coursesExist && currentPresence.coursesExist) {
    changes.push({
      key: "courses_created",
      category: "courses",
      title: "Courses are now in use",
      description: "This hub now has course records and course registration or completion workflows may apply.",
      suggestedDocuments: ["privacy", "terms"],
    });
  }

  if (!previousPresence.mediaAssetsExist && currentPresence.mediaAssetsExist) {
    changes.push({
      key: "media_assets_uploaded",
      category: "media",
      title: "Public media assets are now in use",
      description: "This hub is now using uploaded media assets that may appear publicly on the site or be accessible by URL.",
      suggestedDocuments: ["privacy"],
    });
  }

  if (!previousCapabilities.emailRemindersEnabled && currentCapabilities.emailRemindersEnabled) {
    changes.push({
      key: "email_reminders_enabled",
      category: "notifications",
      title: "Automated email reminders are now enabled",
      description: "This hub can now use reminder-related email capabilities that may need to be reflected in communications or privacy wording.",
      suggestedDocuments: ["privacy"],
    });
  }

  return changes;
}

function buildSections(snapshot) {
  const sections = [];
  const capabilities = snapshot.capabilities || {};
  const presence = snapshot.featurePresence || {};
  const payment = snapshot.paymentConfiguration || {};

  sections.push(
    createSection({
      key: "public_site",
      title: "Hub website and public pages",
      visibility: "public-member-admin",
      platformResponsibility:
        "The platform provides the public website for this hub and handles sign-in for protected member and admin areas.",
      hubOwnerResponsibility:
        "The hub owner should explain what is public, what requires sign-in, and what information they choose to publish on the site.",
      dataFields: [
        "public page content",
        "hub slug or custom domain",
        "member-only visibility settings where applicable",
      ],
      plainEnglish: [
        "This hub has a public website powered by the platform.",
        "Some pages are public to visitors, while member or admin areas require an account and the correct permissions.",
      ],
      suggestedPrivacyTopics: ["What public content is visible to visitors", "Whether any member-only areas require sign-in"],
      suggestedTermsTopics: ["Public site usage rules", "Member-only access rules"],
    })
  );

  sections.push(
    createSection({
      key: "accounts",
      title: "Member and admin accounts",
      visibility: "admin-and-member",
      platformResponsibility:
        "The platform stores account information needed for sign-in and for controlling access to member and admin areas.",
      hubOwnerResponsibility:
        "The hub owner should explain why accounts are needed, who can use them, and how people can ask questions about their data.",
      dataFields: ["name", "email", "role", "hub association", "account creation date", "avatar reference if used"],
      plainEnglish: [
        "Members and admins have accounts connected to this hub.",
        "The platform uses account data to sign users in, route them to the correct hub, and control access to member or admin areas.",
      ],
      suggestedPrivacyTopics: ["Account data used for sign-in and access control", "Who can contact the organisation about account data"],
      suggestedTermsTopics: ["Account responsibilities", "Accurate information and acceptable use expectations"],
    })
  );

  if (presence.membershipPlansExist || presence.membershipsExist) {
    sections.push(
      createSection({
        key: "memberships",
        title: "Memberships",
        visibility: "admin-and-member",
        platformResponsibility:
          "The platform stores membership details so the hub can manage plans, status, renewals, and payment status.",
        hubOwnerResponsibility:
          "The hub owner should define the membership rules, pricing, renewals, cancellations, refunds, and how long related records are kept.",
        dataFields: ["membership plan", "membership status", "payment status", "start date", "renewal date", "cancellation state"],
        plainEnglish: [
          "This hub uses platform membership features.",
          "The platform can track membership status and payment state so the hub can manage access and administration.",
        ],
        suggestedPrivacyTopics: ["How membership data is used", "How long membership records are kept"],
        suggestedTermsTopics: ["Membership eligibility and renewal rules", "Cancellation and refund rules"],
      })
    );
  }

  if (capabilities.eventsEnabled || presence.eventsExist) {
    sections.push(
      createSection({
        key: "events",
        title: "Events and registrations",
        visibility: "admin-and-member",
        platformResponsibility:
          "The platform stores event and registration records, including waitlists, cancellations, payment status, and attendance where those features are used.",
        hubOwnerResponsibility:
          "The hub owner should explain registration rules, attendance expectations, cancellations, refunds if relevant, and how long event records are kept.",
        dataFields: [
          "event registration",
          "waitlist state",
          "cancellation state",
          "payment status",
          "attendance status",
          "event visibility and eligibility settings",
        ],
        plainEnglish: [
          "This hub can use the platform to manage event registrations and attendance.",
          "Registrations can be confirmed, waitlisted, or cancelled, and admins can manage attendance for eligible events.",
        ],
        suggestedPrivacyTopics: ["Event registration and attendance data", "Event-related communications and retention"],
        suggestedTermsTopics: ["Event registration conditions", "Waitlist, cancellation, and attendance rules"],
      })
    );
  }

  if (capabilities.coursesEnabled || presence.coursesExist) {
    sections.push(
      createSection({
        key: "courses",
        title: "Courses and registrations",
        visibility: "admin-and-member",
        platformResponsibility:
          "The platform stores course and enrolment records, including payment, completion, or withdrawal information where those features are used.",
        hubOwnerResponsibility:
          "The hub owner should explain enrolment rules, completion or withdrawal handling, cancellations or refunds if relevant, and how long course records are kept.",
        dataFields: [
          "course registration",
          "payment status",
          "completion state",
          "withdrawal state",
          "course visibility and eligibility settings",
        ],
        plainEnglish: [
          "This hub can use the platform to manage course enrolments and completion-related records.",
          "Course registrations can be tracked alongside payment and completion state where those features are used.",
        ],
        suggestedPrivacyTopics: ["Course enrolment and completion data", "Course-related communications and retention"],
        suggestedTermsTopics: ["Course enrolment conditions", "Completion, withdrawal, cancellation, and refund rules"],
      })
    );
  }

  if (capabilities.paymentsEnabled || capabilities.nativePaymentsEnabled || payment.hasConnectedAccount) {
    sections.push(
      createSection({
        key: "payments",
        title: "Payments and payment status",
        visibility: "admin-and-member",
        platformResponsibility:
          "The platform stores payment status information for supported memberships, events, or courses and can support built-in payment flows where configured.",
        hubOwnerResponsibility:
          "The hub owner should explain how payments are handled, what refund or cancellation rules apply, and whether any third-party payment provider is used.",
        dataFields: ["payment status", "transaction references where applicable", "internal checkout state where supported"],
        plainEnglish: payment.isReady
          ? [
              "This hub has a ready built-in payment configuration for eligible payment flows.",
              "The platform may track payment state alongside related membership or registration records.",
            ]
          : [
              "This hub can store payment status information for supported offerings.",
              "Where built-in payments are not fully ready, some payment handling may remain manual or externally managed.",
            ],
        suggestedPrivacyTopics: ["Payment status data and third-party providers", "Financial record handling and contact route"],
        suggestedTermsTopics: ["Payment obligations", "Refund and cancellation terms"],
      })
    );
  }

  if (presence.mediaAssetsExist) {
    sections.push(
      createSection({
        key: "media",
        title: "Media and public assets",
        visibility: "public-and-admin",
        platformResponsibility:
          "The platform stores uploaded media files and related details so they can be used on the public website and in admin-managed content.",
        hubOwnerResponsibility:
          "The hub owner should avoid uploading sensitive private documents into public media areas and explain any media handling that affects visitors or members.",
        dataFields: ["filename", "file type", "size", "public URL", "alt text", "folder"],
        plainEnglish: [
          "This hub is using uploaded media assets through the platform.",
          "Public website media may be visible on public pages or accessible by URL.",
        ],
        suggestedPrivacyTopics: ["Publicly visible media usage", "Any media-related personal data handling"],
        suggestedTermsTopics: ["Rules around uploaded or published media where relevant"],
      })
    );
  }

  sections.push(
    createSection({
      key: "notifications",
      title: "Emails and notifications",
      visibility: "admin-and-member",
      platformResponsibility:
        capabilities.transactionalBookingEmailsEnabled && capabilities.emailRemindersEnabled
          ? "The platform can send transactional booking emails and automated reminder emails for eligible hub workflows."
          : capabilities.transactionalBookingEmailsEnabled
            ? "The platform can send transactional booking emails for eligible hub workflows. Automated reminder emails are not currently enabled for this hub."
            : capabilities.emailRemindersEnabled
              ? "The platform can support automated reminder emails for eligible hub workflows."
              : "Automated platform email notifications are not currently enabled for this hub.",
      hubOwnerResponsibility:
        "The hub owner should explain any emails or messages they send, what consent approach they rely on, and any communications they manage outside the platform.",
      dataFields: [
        ...(capabilities.transactionalBookingEmailsEnabled ? ["booking and enrolment communication state"] : []),
        ...(capabilities.emailRemindersEnabled ? ["reminder-related communication state"] : []),
      ],
      plainEnglish:
        capabilities.transactionalBookingEmailsEnabled && capabilities.emailRemindersEnabled
          ? [
              "This hub can use platform emails for booking or enrolment confirmations, cancellations, and eligible reminders.",
              "The hub owner remains responsible for explaining how they communicate with members and visitors.",
            ]
          : capabilities.transactionalBookingEmailsEnabled
            ? [
                "This hub can use platform emails for booking or enrolment confirmations and cancellations.",
                "Automated reminder emails are not currently enabled for this hub.",
              ]
            : capabilities.emailRemindersEnabled
              ? [
                  "This hub has reminder-related communication capability available through the platform.",
                  "The hub owner remains responsible for explaining how they communicate with members and visitors.",
                ]
              : [
                  "Automated platform email notifications are not currently enabled for this hub.",
                  "That does not mean the hub never contacts members outside the platform.",
                ],
      suggestedPrivacyTopics: ["How the organisation communicates with members", "Any communication tools or providers used"],
      suggestedTermsTopics: ["Operational communications about bookings, memberships, or events where relevant"],
    })
  );

  sections.push(
    createSection({
      key: "admin_actions",
      title: "Admin actions and operational records",
      visibility: "admin-only",
      platformResponsibility:
        "The platform lets admins update records such as memberships, registrations, attendance, and payment status.",
      hubOwnerResponsibility:
        "The hub owner should explain any local decision-making, recordkeeping, or access rules their organisation applies through these admin actions.",
      dataFields: [
        "membership status changes",
        "payment status changes",
        "registration status changes",
        "attendance updates",
      ],
      plainEnglish: [
        "Admins can update records such as membership status, registration state, payment status, and attendance through the admin portal.",
        "If the hub relies on these actions for important decisions, the hub owner should explain that in their own policies where appropriate.",
      ],
      suggestedPrivacyTopics: ["Admin access and operational record handling", "Who can access and update records"],
      suggestedTermsTopics: ["Operational decision rules that affect access or participation"],
    })
  );

  return sections;
}

export function getHubOwnerMustCompleteItems() {
  return [
    "Your organisation's legal name",
    "Your contact details",
    "How long you keep records",
    "Your refund and cancellation policy",
    "Your marketing or contact preferences",
    "Your membership rules",
    "Your event rules",
    "Your course rules",
    "Any data you collect outside this platform",
    "Any third-party tools you use outside this platform",
  ];
}

export function getHubLegalSummaryDisclaimers() {
  return [
    "This summary explains platform behaviour only.",
    "It is not legal advice.",
    "The hub owner is responsible for the public Terms of Service and Privacy Policy.",
  ];
}

export async function buildHubDataUseSummary(hub, options = {}) {
  if (!hub?.id) {
    throw new Error("Hub is required to build the legal data-use summary.");
  }

  const now = options.now || new Date().toISOString();
  const [paymentConfiguration, presence] = await Promise.all([
    getHubPaymentConfigurationByHubId(hub.id),
    buildHubFeaturePresence(hub),
  ]);

  const featureSnapshot = buildCapabilitySnapshot(hub, paymentConfiguration, presence);
  const featureSnapshotHash = createHashFromObject(featureSnapshot);
  const previousFeatureSnapshot = options.previousFeatureSnapshot || null;
  const sections = buildSections(featureSnapshot);
  const capabilityChanges = buildChangeItems(previousFeatureSnapshot, featureSnapshot);

  return {
    generatedAt: now,
    generatorVersion: legalSummaryGeneratorVersion,
    featureSnapshotHash,
    sourceFeatureSnapshot: featureSnapshot,
    sourceModelSnapshot: {
      sectionKeys: sections.map((section) => section.key),
      changeKeys: capabilityChanges.map((change) => change.key),
    },
    summary: {
      sections,
      hubOwnerMustComplete: getHubOwnerMustCompleteItems(),
      disclaimers: getHubLegalSummaryDisclaimers(),
    },
    capabilityChanges,
  };
}

import {
  hasSectionRichTextContent,
  normalizeSectionRichTextContent,
} from "./section-rich-text.js";
import {
  LEGAL_RICH_TEXT_PROFILE,
} from "./../legal/legalSanitizer.js";
import { sessionDurationSeconds } from "./../auth/session.js";

const cookiePreferencesDurationSeconds = 60 * 60 * 24 * 365;

function normalizeString(value) {
  return String(value || "").trim();
}

function paragraph(children) {
  return { type: "paragraph", children };
}

function text(value, marks = {}) {
  return {
    text: normalizeString(value),
    ...(marks.bold ? { bold: true } : {}),
    ...(marks.italic ? { italic: true } : {}),
  };
}

function bulletList(items) {
  return {
    type: "unordered-list",
    items: items.map((item) => ({
      children: [text(item)],
    })),
  };
}

function formatAddress(address = {}) {
  const lines = [
    normalizeString(address.line1),
    normalizeString(address.line2),
    [normalizeString(address.city), normalizeString(address.stateOrProvince), normalizeString(address.postalCode)]
      .filter(Boolean)
      .join(", "),
    normalizeString(address.country),
  ].filter(Boolean);

  return lines.join(", ");
}

function formatCookieDuration(seconds) {
  const normalized = Number.parseInt(String(seconds || ""), 10);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "";
  }

  const days = Math.round(normalized / (60 * 60 * 24));

  if (days === 7) {
    return "up to 7 days";
  }

  if (days >= 365) {
    return "up to 1 year";
  }

  return `up to ${days} days`;
}

function getSiteLabel(siteSettings = {}, hub = {}) {
  return normalizeString(siteSettings.siteName) || normalizeString(hub.name) || "this community";
}

function getContactEmail(siteSettings = {}) {
  return normalizeString(siteSettings.contactEmail) || "the contact address published on this site";
}

function getContactAddress(siteSettings = {}) {
  return formatAddress(siteSettings.address || {}) || "the contact address published on this site";
}

function buildTermsPlatformBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);

  return normalizeSectionRichTextContent([
    paragraph([
      text("Who these terms apply to. ", { bold: true }),
      text(`These terms govern use of the public website and related member-facing features made available by ${siteLabel}. Unless a page, booking flow, invoice or separate agreement states otherwise, any events, courses, memberships or community services promoted through this site are offered by ${siteLabel}, not by Hubforj.`),
    ]),
    paragraph([
      text("How Hubforj fits in. ", { bold: true }),
      text(`Hubforj provides the software platform used to operate this site. Hubforj is not responsible for the day-to-day content published by ${siteLabel}, the running of its events or courses, the setting of its prices, or any local operating policies it chooses to apply, except where Hubforj is expressly identified as the provider of a specific service.`),
    ]),
    paragraph([
      text("Using the site responsibly. ", { bold: true }),
      text("You must not misuse the site, try to gain unauthorised access, interfere with normal operation, upload malicious material, or use the site in a way that infringes the rights of others or breaks applicable law."),
    ]),
    paragraph([
      text("Availability and changes. ", { bold: true }),
      text(`Content, availability, prices, schedules and member-facing features may change from time to time. ${siteLabel} may update, withdraw or replace content where reasonably necessary, and Hubforj may update the underlying platform to maintain security, reliability and service performance.`),
    ]),
  ]);
}

function buildTermsDefaultEditableBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);
  const contactEmail = getContactEmail(siteSettings);

  return normalizeSectionRichTextContent([
    paragraph([
      text("Add your community-specific terms here. ", { bold: true }),
      text(`Use this section to explain any local rules that apply when somebody uses ${siteLabel}, joins as a member, books an event, enrols on a course, or buys a paid offer.`),
    ]),
    bulletList([
      "Set out any eligibility rules, age limits, safeguarding rules or membership requirements.",
      "Explain how bookings, enrolments, waiting lists, cancellations, transfers, refunds or credits are handled.",
      "State any conduct expectations, code-of-conduct rules or circumstances where access may be suspended or refused.",
      "Add any service-specific terms for events, courses, digital materials or recurring memberships offered by the hub.",
    ]),
    paragraph([
      text("Contact route. ", { bold: true }),
      text(`If a visitor has questions about the services or rules described on this site, direct them to ${contactEmail}.`),
    ]),
  ]);
}

function buildTermsPublicFallbackBody(siteSettings = {}, hub = {}) {
  return normalizeSectionRichTextContent([
    paragraph([
      text("Terms of Service have not yet been provided by this community."),
    ]),
  ]);
}

function buildPrivacyPlatformBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);
  const contactEmail = getContactEmail(siteSettings);
  const contactAddress = getContactAddress(siteSettings);

  return normalizeSectionRichTextContent([
    paragraph([
      text("Who is responsible for personal information. ", { bold: true }),
      text(`${siteLabel} is usually the controller for the personal information collected through this site about members, visitors, bookings, registrations, attendance, enquiries and other community activity. Questions about site-specific data handling should normally be directed to ${contactEmail}.`),
    ]),
    paragraph([
      text("How Hubforj fits in. ", { bold: true }),
      text("Hubforj provides the software platform, hosting-related services, authentication flows and support tooling used to operate this site. In most cases Hubforj processes community data on behalf of the hub as a service provider. Hubforj may separately act as a controller for limited information it needs for its own legitimate business purposes, such as platform security, fraud prevention, service monitoring, billing, support and compliance." ),
    ]),
    paragraph([
      text("Information typically handled through the platform. ", { bold: true }),
      text("Depending on which features the hub uses, the platform may process account and identity details, sign-in and session data, role and membership status, booking and registration records, attendance or completion records, payment status and transaction references, uploaded media, and profile information provided by users or administrators."),
    ]),
    paragraph([
      text("How long information is kept. ", { bold: true }),
      text(`${siteLabel} should only keep personal information for as long as it is reasonably needed for the purposes described in this notice, including membership administration, financial records, safeguarding, dispute handling and legal obligations. Hubforj retains supporting platform logs, backups and security records for limited periods where reasonably necessary to operate and protect the service.`),
    ]),
    paragraph([
      text("Your rights and complaints. ", { bold: true }),
      text(`People may have rights to request access to, correction of, deletion of, restriction of, or objection to the use of their personal information, as well as rights around portability where applicable. If a concern cannot be resolved directly with ${siteLabel}, individuals in the UK may also complain to the Information Commissioner's Office.`),
    ]),
    paragraph([
      text("Contact details. ", { bold: true }),
      text(`The hub's published contact email is ${contactEmail}. The published postal address is ${contactAddress}.`),
    ]),
  ]);
}

function buildPrivacyDefaultEditableBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);

  return normalizeSectionRichTextContent([
    paragraph([
      text("Add hub-specific privacy information here. ", { bold: true }),
      text(`Use this section to tailor the notice for the way ${siteLabel} actually runs its membership, events, courses, communications and local operations.`),
    ]),
    bulletList([
      "List any extra categories of personal information the hub collects beyond the platform defaults.",
      "Explain the main reasons the hub uses personal information, such as managing memberships, delivering events or courses, responding to enquiries, sending operational updates, or maintaining safeguarding records.",
      "Describe any third parties the hub shares information with, such as venues, instructors, payment providers, accountants or professional advisers, where relevant.",
      "State any hub-specific retention periods, lawful basis notes, or local safeguarding / compliance obligations that visitors should know about.",
    ]),
    paragraph([
      text("Keep this section accurate. ", { bold: true }),
      text("Only include practices that are actually carried out by the hub. Remove any placeholder wording that does not apply."),
    ]),
  ]);
}

function buildPrivacyPublicFallbackBody(siteSettings = {}, hub = {}) {
  return normalizeSectionRichTextContent([
    paragraph([
      text("Privacy Policy has not yet been provided by this community."),
    ]),
  ]);
}

function buildCookiesPlatformBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);
  const sessionDuration = formatCookieDuration(sessionDurationSeconds);
  const preferencesDuration = formatCookieDuration(cookiePreferencesDurationSeconds);

  return normalizeSectionRichTextContent([
    paragraph([
      text(`We currently use essential cookies only on this site. These help core features work, such as secure sign-in, account access, and remembering your cookie settings.`),
    ]),
    paragraph([
      text("These cookies are used for security and service operation rather than advertising. They may include a secure session cookie for signed-in members or administrators and a cookie-settings cookie so we can remember your choice."),
    ]),
    paragraph([
      text("At the time of writing, we do not use optional analytics, advertising, or social-media tracking cookies on this site."),
    ]),
    bulletList([
      `A secure session cookie may be set when a member or administrator signs in. This supports authenticated account access and lasts ${sessionDuration}.`,
      `A cookie-settings cookie may be set so we can remember your cookie choice. This lasts ${preferencesDuration}.`,
      "These cookies support core functionality and are not used for advertising.",
    ]),
    paragraph([
      text("You can use the cookie settings control available on this site to review how cookies are handled. Most browsers also allow cookies to be blocked or deleted, although doing so may affect sign-in or account features."),
    ]),
  ]);
}

function buildCookiesDefaultEditableBody(siteSettings = {}, hub = {}) {
  const siteLabel = getSiteLabel(siteSettings, hub);

  return normalizeSectionRichTextContent([
    paragraph([
      text("Add hub-specific cookie or tracking details here. ", { bold: true }),
      text(`Use this section only if ${siteLabel} adds tools, embeds or integrations that set cookies or similar technologies beyond the standard Hubforj public-site implementation.`),
    ]),
    bulletList([
      "List any embedded video, map, booking, support or social-media tools that may set cookies on visitors' devices.",
      "Explain whether the hub has enabled any optional analytics or advertising technology.",
      "Remove this scaffold if the hub does not use any additional cookie-setting tools beyond the default platform behaviour.",
    ]),
    paragraph([
      text("Do not overstate usage. ", { bold: true }),
      text("Only describe cookies or technologies that are genuinely in use on the site."),
    ]),
  ]);
}

function buildCookiesPublicFallbackBody() {
  return normalizeSectionRichTextContent([
    paragraph([
      text("No additional optional analytics, advertising, or third-party tracking technologies are currently enabled as part of the standard public-site implementation."),
    ]),
  ]);
}

const legalDocumentDefinitions = {
  terms: {
    header: {
      eyebrow: "Terms",
      title: "Terms of Service",
      description: "",
    },
    platformSectionTitle: "Platform and website terms",
    editableSectionTitle: "Terms of Service",
    buildPlatformBody: buildTermsPlatformBody,
    buildEditableBody: buildTermsDefaultEditableBody,
    buildPublicFallbackBody: buildTermsPublicFallbackBody,
  },
  privacy: {
    header: {
      eyebrow: "Privacy",
      title: "Privacy Policy",
      description: "",
    },
    platformSectionTitle: "How personal information is handled",
    editableSectionTitle: "Privacy Policy",
    buildPlatformBody: buildPrivacyPlatformBody,
    buildEditableBody: buildPrivacyDefaultEditableBody,
    buildPublicFallbackBody: buildPrivacyPublicFallbackBody,
  },
  cookies: {
    header: {
      eyebrow: "Cookies",
      title: "Cookies Policy",
      description: "This page explains how cookies and similar technologies are used on this public site.",
    },
    platformSectionTitle: "How cookies are used",
    editableSectionTitle: "Additional site-specific cookie use",
    buildPlatformBody: buildCookiesPlatformBody,
    buildEditableBody: buildCookiesDefaultEditableBody,
    buildPublicFallbackBody: buildCookiesPublicFallbackBody,
  },
};

export function listEditableLegalDocumentKeys() {
  return Object.keys(legalDocumentDefinitions);
}

export function getLegalDocumentDefinition(key) {
  return legalDocumentDefinitions[normalizeString(key)] || null;
}

export function getDefaultLegalEditableBody(key, siteSettings = {}, hub = {}) {
  const definition = getLegalDocumentDefinition(key);
  if (!definition) {
    return [];
  }

  return definition.buildEditableBody(siteSettings, hub);
}

export function buildPublicLegalPageModel(key, siteSettings = {}, hub = {}, legalSettings = null) {
  const definition = getLegalDocumentDefinition(key);

  if (!definition) {
    return null;
  }

  if (key === "cookies") {
    return {
      ...definition.header,
      sections: [
        {
          title: definition.platformSectionTitle,
          body: definition.buildPlatformBody(siteSettings, hub),
        },
      ],
    };
  }

  const liveDocument = legalSettings?.[key] || null;
  const liveBody = liveDocument?.hasOwnerProvidedContent && hasSectionRichTextContent(liveDocument?.content, {
    profile: LEGAL_RICH_TEXT_PROFILE,
  })
    ? normalizeSectionRichTextContent(liveDocument.content, {
        profile: LEGAL_RICH_TEXT_PROFILE,
      })
    : null;
  const fallbackBody = definition.buildPublicFallbackBody(siteSettings, hub);
  const customBody = liveBody || fallbackBody;

  return {
    ...definition.header,
    sections: [
      {
        title: "",
        body: customBody,
      },
    ],
  };
}

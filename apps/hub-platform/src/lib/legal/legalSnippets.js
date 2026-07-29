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
    items: items.map((item) => ({ children: [text(item)] })),
  };
}

function createTermsMembershipGuidance(siteName = "this community") {
  return [
    paragraph([
      text("Membership rules. ", { bold: true }),
      text(
        `${siteName} may require users to create an account, select a membership plan, keep account details accurate, and follow any membership eligibility, payment, renewal, cancellation, and conduct rules published by the hub. `
      ),
      text("[Hub owner: explain membership eligibility, renewal terms, cancellation rules, refund rules, and any suspension or termination rules.]"),
    ]),
  ];
}

function createTermsEventGuidance() {
  return [
    paragraph([
      text("Event registration. ", { bold: true }),
      text(
        "Some activities may require advance registration. Places may be limited. Registrations may be confirmed, placed on a waitlist, or cancelled according to the hub’s event rules. "
      ),
      text("[Hub owner: explain registration requirements, attendance expectations, waitlist handling, cancellations, and any no-show rules.]"),
    ]),
  ];
}

function createTermsPaymentGuidance() {
  return [
    paragraph([
      text("Payments, cancellations, and refunds. ", { bold: true }),
      text(
        "Paid memberships, events, courses, or other services may be subject to payment, cancellation, transfer, credit, and refund rules set by the hub. "
      ),
      text("[Hub owner: explain payment deadlines, cancellation windows, refund rules, transfer rules, and what happens if payment is not completed.]"),
    ]),
  ];
}

function createPrivacyAccountGuidance(siteName = "this community") {
  return [
    paragraph([
      text("Accounts and sign-in data. ", { bold: true }),
      text(
        `${siteName} uses this platform to create and manage member and admin accounts. This may involve storing names, email addresses, account roles, hub association, and sign-in/session information so users can access the correct parts of the site. `
      ),
      text("[Hub owner: explain why your organisation requires accounts, who can access account information, and how people can contact you about their data.]"),
    ]),
  ];
}

function createPrivacyMembershipGuidance(siteName = "this community") {
  return [
    paragraph([
      text("Membership data. ", { bold: true }),
      text(
        `${siteName} may use this platform to manage membership plans, membership status, payment status, start dates, renewal dates, and cancellation state so the hub can administer membership access and records. `
      ),
      text("[Hub owner: explain your lawful basis, retention period, membership administration rules, and who to contact about membership data.]"),
    ]),
  ];
}

function createPrivacyEventGuidance(siteName = "this community") {
  return [
    paragraph([
      text("Event registration data. ", { bold: true }),
      text(
        `${siteName} may use this platform to manage event registrations, waitlists, cancellations, and payment status where relevant. `
      ),
      text("[Hub owner: explain event administration purposes, retention period, communications about events, and any cancellation rules.]"),
    ]),
  ];
}

function createPrivacyAttendanceGuidance(siteName = "this community") {
  return [
    paragraph([
      text("Attendance and completion records. ", { bold: true }),
      text(
        `${siteName} may record attendance, absence, or completion status for events or courses where those features are used. `
      ),
      text("[Hub owner: explain why these records are needed, how long you keep them, and whether they affect membership or eligibility decisions.]"),
    ]),
  ];
}

function createPrivacyPaymentGuidance() {
  return [
    paragraph([
      text("Payment status information. ", { bold: true }),
      text(
        "The platform may store payment status information such as whether payment is required, unpaid, paid, or refunded for memberships, events, or courses where relevant. "
      ),
      text("[Hub owner: explain whether payments are handled manually or through third-party providers, what records you retain, and who to contact about payment queries.]"),
    ]),
  ];
}

function createPrivacyMediaGuidance() {
  return [
    paragraph([
      text("Media and public assets. ", { bold: true }),
      text(
        "Images or other media uploaded by admins for use on the public website may be publicly visible or accessible by URL. Public asset records may include metadata such as filename, file type, size, alt text, folder, and public URL. "
      ),
      text("[Hub owner: explain any additional media handling practices and avoid uploading sensitive private documents into public media areas.]"),
    ]),
  ];
}

export function getLegalSnippets(siteSettings = {}) {
  const siteName = normalizeString(siteSettings?.siteName) || normalizeString(siteSettings?.hubName) || "this community";

  return {
    terms: {
      membership: createTermsMembershipGuidance(siteName),
      events: createTermsEventGuidance(),
      payments: createTermsPaymentGuidance(),
    },
    privacy: {
      accounts: createPrivacyAccountGuidance(siteName),
      memberships: createPrivacyMembershipGuidance(siteName),
      events: createPrivacyEventGuidance(siteName),
      attendance: createPrivacyAttendanceGuidance(siteName),
      payments: createPrivacyPaymentGuidance(),
      media: createPrivacyMediaGuidance(),
    },
  };
}

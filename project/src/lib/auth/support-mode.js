import "server-only";

const root = globalThis;
if (!root.__communitySupportAudit) {
  root.__communitySupportAudit = [];
}

function logEvent(event) {
  root.__communitySupportAudit.unshift({
    ...event,
    at: new Date().toISOString(),
  });

  if (root.__communitySupportAudit.length > 200) {
    root.__communitySupportAudit.length = 200;
  }
}

export function logSupportModeEntered({ actorUid, hubId, hubSlug }) {
  logEvent({
    action: "support_mode_entered",
    actorUid,
    hubId,
    hubSlug,
  });
}

export function logSupportModeExited({ actorUid, hubId, hubSlug }) {
  logEvent({
    action: "support_mode_exited",
    actorUid,
    hubId,
    hubSlug,
  });
}

export function listSupportModeAuditEvents() {
  return [...root.__communitySupportAudit];
}

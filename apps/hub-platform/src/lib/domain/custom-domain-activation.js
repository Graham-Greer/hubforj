import { isCustomDomainRuntimeEnabled } from "./custom-domain-runtime-config.js";

export { isCustomDomainRuntimeEnabled };

export function getCustomDomainRuntimeBlockedReason() {
  return "DNS verification is complete, but runtime host activation is not enabled in this environment yet.";
}

import dns from "node:dns/promises";
import { getCustomDomainVerificationPrefix } from "./custom-domain-runtime-config.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function buildCustomDomainVerificationHostname(hostname) {
  const normalizedHostname = normalizeString(hostname).toLowerCase();
  const prefix = getCustomDomainVerificationPrefix();

  if (!normalizedHostname) {
    return "";
  }

  return `${prefix}.${normalizedHostname}`;
}

function flattenTxtRecords(records = []) {
  return records.map((entry) => entry.join("")).map((value) => normalizeString(value)).filter(Boolean);
}

export async function verifyCustomDomainDnsTxt({ hostname, token }) {
  const verificationHostname = buildCustomDomainVerificationHostname(hostname);

  if (!verificationHostname || !normalizeString(token)) {
    return {
      verificationHostname,
      matched: false,
      records: [],
      errorCode: "invalid_input",
    };
  }

  try {
    const records = flattenTxtRecords(await dns.resolveTxt(verificationHostname));
    return {
      verificationHostname,
      matched: records.includes(normalizeString(token)),
      records,
      errorCode: "",
    };
  } catch (error) {
    const errorCode = normalizeString(error?.code);

    if (errorCode === "ENODATA" || errorCode === "ENOTFOUND" || errorCode === "ESERVFAIL") {
      return {
        verificationHostname,
        matched: false,
        records: [],
        errorCode,
      };
    }

    throw error;
  }
}

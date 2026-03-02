const SELF = "'self'";
const STORAGE_HOST = "https://storage.googleapis.com";

function joinSources(sources) {
  return sources.filter(Boolean).join(" ");
}

export function buildCspHeader({ nonce, isDev }) {
  const nonceSource = `'nonce-${nonce}'`;

  const directives = [
    ["default-src", [SELF]],
    ["base-uri", [SELF]],
    ["frame-ancestors", ["'none'"]],
    ["object-src", ["'none'"]],
    ["form-action", [SELF]],
    ["script-src", [SELF, nonceSource, isDev ? "'unsafe-eval'" : ""]],
    ["style-src", [SELF, nonceSource, STORAGE_HOST]],
    ["img-src", [SELF, "data:", "blob:", STORAGE_HOST, "https://firebasestorage.googleapis.com"]],
    ["font-src", [SELF, "data:", "https://fonts.gstatic.com"]],
    [
      "connect-src",
      [
        SELF,
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.gstatic.com",
        isDev ? "http://localhost:*" : "",
        isDev ? "http://127.0.0.1:*" : "",
        isDev ? "ws://localhost:*" : "",
        isDev ? "ws://127.0.0.1:*" : "",
      ],
    ],
    ["worker-src", [SELF, "blob:"]],
    ["media-src", [SELF, "blob:", STORAGE_HOST, "https://firebasestorage.googleapis.com"]],
    ["manifest-src", [SELF]],
  ];

  return directives
    .map(([name, values]) => `${name} ${joinSources(values)}`)
    .join("; ");
}

export const providerInstructions = {
  godaddy: {
    label: "GoDaddy",
    path: "Domain Portfolio > DNS > Add New Record",
    nameLabel: "Name",
    valueLabel: "Value",
    steps: [
      "Open your GoDaddy Domain Portfolio.",
      "Select the domain, then open DNS.",
      "Add each record shown below. If a record with the same type and name already exists, edit it instead of creating a duplicate.",
      "Leave TTL as Auto or Default.",
      "Save your changes, return to HubForJ, then select Check DNS if it is available.",
    ],
  },
  cloudflare: {
    label: "Cloudflare",
    path: "Website > DNS > Records > Add record",
    nameLabel: "Name",
    valueLabel: "Content",
    steps: [
      "Open the website in Cloudflare, then go to DNS > Records.",
      "Add each record shown below. If a matching record already exists, edit it.",
      "For HubForJ routing records, use DNS only unless HubForJ support has confirmed proxied mode for this domain.",
      "Leave TTL as Auto.",
      "Save your changes, return to HubForJ, then select Check DNS if it is available.",
    ],
  },
  namecheap: {
    label: "Namecheap",
    path: "Domain List > Manage > Advanced DNS",
    nameLabel: "Host",
    valueLabel: "Value",
    steps: [
      "Open Domain List, choose Manage for the domain, then open Advanced DNS.",
      "Add each record shown below. If a matching host/type already exists, edit it.",
      "Use the Host field for the HubForJ Name/Host value.",
      "Leave TTL as Automatic.",
      "Save your changes, return to HubForJ, then select Check DNS if it is available.",
    ],
  },
  squarespace: {
    label: "Squarespace",
    path: "Domains > DNS settings > Custom records",
    nameLabel: "Host/Name",
    valueLabel: "Data",
    steps: [
      "Open Domains, choose the domain, then open DNS settings.",
      "Add each custom record shown below. If a matching record already exists, edit it.",
      "Use the Host or Name field for the HubForJ Name/Host value.",
      "Leave TTL as the default option.",
      "Save your changes, return to HubForJ, then select Check DNS if it is available.",
    ],
  },
  other: {
    label: "Other DNS provider",
    path: "DNS settings, DNS records, Zone editor, or Advanced DNS",
    nameLabel: "Name, Host, Alias, or Subdomain",
    valueLabel: "Value, Content, Data, Points to, or Target",
    steps: [
      "Sign in to the account where this domain's nameservers are managed.",
      "Find DNS settings, DNS records, Zone editor, or Advanced DNS.",
      "Add each record shown below. If a matching type/name already exists, edit it instead of creating a duplicate.",
      "Leave TTL as Auto or Default unless your provider requires a value.",
      "Save your changes, return to HubForJ, then select Check DNS if it is available.",
    ],
  },
};

export const providerOptions = Object.entries(providerInstructions).map(([value, provider]) => ({
  value,
  label: provider.label,
}));

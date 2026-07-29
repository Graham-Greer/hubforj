import { DEFAULT_TEMPLATE_KEY } from "@/lib/templates/template-registry";

export const initialCreateHubFormState = {
  error: "",
  values: {
    hubName: "",
    hubSlug: "",
    primaryDomain: "",
    template: DEFAULT_TEMPLATE_KEY,
    theme: "light",
    contactEmail: "",
    description: "",
    country: "US",
    timezone: "America/New_York",
    locale: "en-US",
    defaultCurrency: "USD",
    packageTier: "free",
  },
};

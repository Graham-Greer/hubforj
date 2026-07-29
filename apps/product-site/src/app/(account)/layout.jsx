import { requireCommercialAccountSession } from "@/lib/server/account-session";

export default async function CommercialAccountLayout({ children }) {
  await requireCommercialAccountSession();
  return children;
}

import AccountHeader from "@/components/patterns/account-header/AccountHeader";
import { redirect } from "next/navigation";
import { clearCommercialAccountSession, readCommercialAccountSession } from "@/lib/server/account-session";

export default async function AccountRouteShell({
  eyebrow,
  title,
  description,
  identityLabel = "Account",
  children,
}) {
  const session = await readCommercialAccountSession();
  const ownerName = session?.ownerFullName || identityLabel;

  async function signOutAction() {
    "use server";

    await clearCommercialAccountSession();
    redirect("/");
  }

  return (
    <main className="page-shell">
      <header className="marketing-header account-header">
        <section className="page-section page-section--wide">
          <AccountHeader ownerName={ownerName} signOutAction={signOutAction} />
        </section>
      </header>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide content-stack account-page-stack" style={{ paddingBlock: "var(--space-7)" }}>
          <header className="section-heading section-heading--wide">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="headline headline--section">{title}</h1>
            <p className="subcopy">{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

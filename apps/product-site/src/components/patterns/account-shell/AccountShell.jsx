import AccountHeader from "@/components/patterns/account-header/AccountHeader";
import { redirect } from "next/navigation";
import { clearCommercialAccountSession } from "@/lib/server/account-session";

export default async function AccountShell({ eyebrow, title, description, accountContext, children }) {
  const { account } = accountContext;

  async function signOutAction() {
    "use server";

    await clearCommercialAccountSession();
    redirect("/");
  }

  return (
    <main className="page-shell">
      <header className="marketing-header account-header">
        <section className="page-section page-section--wide">
          <AccountHeader ownerName={account.ownerFullName} signOutAction={signOutAction} />
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

import PageHeader from "@/components/patterns/page-header/PageHeader";

export default function HubAdminHomePage({ params }) {
  return (
    <section>
      <PageHeader title="Hub Admin" subtitle={`Hub: ${params.hubSlug}`} />
    </section>
  );
}

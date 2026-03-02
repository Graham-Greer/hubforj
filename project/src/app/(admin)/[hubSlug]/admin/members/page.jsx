import PageHeader from "@/components/patterns/page-header/PageHeader";
import Text from "@/components/primitives/text/Text";

export default function AdminMembersPage() {
  return (
    <section>
      <PageHeader title="Members" subtitle="Hub-admin members surface shell." />
      <Text tone="secondary">Registrations and membership operations are implemented in the next M2 slices.</Text>
    </section>
  );
}


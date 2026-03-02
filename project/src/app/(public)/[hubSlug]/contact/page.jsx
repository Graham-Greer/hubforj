import { redirect } from "next/navigation";

export default function PublicContactAliasPage({ params }) {
  redirect(`/${params.hubSlug}/pages/contact`);
}

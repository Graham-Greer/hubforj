import PaymentDetailWorkspace from "@/components/patterns/hub-payments-workspace/PaymentDetailWorkspace";
import { getHubPaymentItemDetailBySlug } from "@/lib/data/hub-payments";
import { notFound } from "next/navigation";

export default async function PaymentDetailPage({ params }) {
  const { hubSlug, paymentItemId } = await params;
  const { hub, item, detail } = await getHubPaymentItemDetailBySlug(hubSlug, paymentItemId);

  if (!hub || !item || !detail) {
    notFound();
  }

  return <PaymentDetailWorkspace hub={hub} item={item} detail={detail} />;
}

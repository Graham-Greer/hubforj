import SkeletonBox from "@/components/ui/skeleton/SkeletonBox";
import SkeletonText from "@/components/ui/skeleton/SkeletonText";

export default function PublicEventsLoading() {
  return (
    <main>
      <SkeletonText lines={2} />
      <SkeletonBox height="18rem" />
      <SkeletonBox height="18rem" />
    </main>
  );
}

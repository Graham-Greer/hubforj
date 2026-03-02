import ErrorState from "@/components/ui/error-state/ErrorState";

export default function AdminFeaturesNotFound() {
  return (
    <ErrorState
      title="Feature route not found"
      body="The requested feature flag route does not exist for this hub."
      variant="compact"
    />
  );
}

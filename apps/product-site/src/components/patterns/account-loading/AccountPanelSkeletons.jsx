import {
  SkeletonButtonRow,
  SkeletonCard,
  SkeletonMetricStrip,
  SkeletonPackageGrid,
  SkeletonSideList,
  SkeletonStatusRow,
  SkeletonText,
} from "@/components/patterns/skeleton/Skeleton";

export function AccountWorkspacePanelsSkeleton({ sideRows = 3 }) {
  return (
    <section className="account-workspace-layout">
      <div className="account-workspace-main">
        <SkeletonCard className="account-focus-panel" lines={2}>
          <SkeletonStatusRow count={3} className="account-focus-panel__status" />
          <SkeletonMetricStrip count={3} />
          <SkeletonButtonRow count={2} />
        </SkeletonCard>
      </div>
      <aside className="account-workspace-side">
        <SkeletonCard className="account-side-panel" lines={0}>
          <SkeletonSideList rows={sideRows} />
          <SkeletonButtonRow count={1} />
        </SkeletonCard>
      </aside>
    </section>
  );
}

export function AccountOverviewPanelsSkeleton() {
  return (
    <div className="content-stack">
      <SkeletonCard className="account-status-banner" lines={2} actions={1} />
      <AccountWorkspacePanelsSkeleton sideRows={3} />
    </div>
  );
}

export function AccountBillingPanelsSkeleton() {
  return (
    <div className="content-stack">
      <AccountWorkspacePanelsSkeleton sideRows={5} />
    </div>
  );
}

export function AccountPackagePanelsSkeleton() {
  return (
    <div className="content-stack">
      <SkeletonCard className="account-action-panel" lines={2} chips={2} actions={1}>
        <div className="detail-grid">
          <div className="detail-block">
            <SkeletonText lines={6} />
          </div>
          <div className="detail-block detail-block--flow">
            <SkeletonText lines={4} />
          </div>
        </div>
      </SkeletonCard>
      <SkeletonPackageGrid count={3} />
      <SkeletonCard lines={2} actions={1} />
    </div>
  );
}

export function AccountUpgradePanelsSkeleton() {
  return (
    <div className="content-stack">
      <SkeletonCard className="account-action-panel" lines={2} chips={3} actions={1}>
        <div className="detail-grid">
          <div className="detail-block">
            <SkeletonText lines={6} />
          </div>
          <div className="detail-block detail-block--flow">
            <SkeletonText lines={3} />
          </div>
        </div>
      </SkeletonCard>
      <SkeletonCard className="account-action-panel" lines={2} chips={4} />
      <SkeletonPackageGrid count={3} />
    </div>
  );
}

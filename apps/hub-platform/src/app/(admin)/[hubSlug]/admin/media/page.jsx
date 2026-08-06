import MediaLibraryWorkspace from "@/components/patterns/media-library-workspace/MediaLibraryWorkspace";
import Surface from "@/components/primitives/surface/Surface";
import FormMessage from "@/components/ui/form-message/FormMessage";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getMediaAssetMetadataById, listMediaAssetPageByHubId, listMediaFoldersByHubId } from "@/lib/data/media";
import { getHubMediaUsageReconciliationReport } from "@/lib/data/media-usage-projection";
import { syncHubMediaUsageProjectionsAction } from "./actions";
import styles from "./page.module.css";

function normalizeSearchParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getMediaFeedback(searchParams = {}) {
  const success = normalizeSearchParam(searchParams?.success);
  const error = normalizeSearchParam(searchParams?.error);

  if (error) {
    return { tone: "danger", message: error };
  }

  if (success === "mediaUsageSynced") {
    return { tone: "success", message: "Media usage projections synced." };
  }

  return null;
}

function MediaSupportDiagnostics({ hubSlug, report }) {
  return (
    <Surface tone="muted" padding="md" className={styles.supportPanel}>
      <div className={styles.supportContent}>
        <div className={styles.supportCopy}>
          <h2 className={styles.supportTitle}>Media usage diagnostics</h2>
          <p className={styles.supportText}>
            Projection diagnostics compare active media assets and source content references with the optimized
            mediaUsage read model used by the selected-asset usage panel.
          </p>
          <div className={styles.supportGrid}>
            <span>Generated: {report?.generatedAt || "Not run"}</span>
            <span>Open issues: {Number(report?.totalIssues || 0)}</span>
            <span>Active assets: {Number(report?.expectedRows || 0)}</span>
            <span>Projection rows: {Number(report?.actualRows || 0)}</span>
            <span>Source references: {Number(report?.sourceReferenceCount || 0)}</span>
            <span>Missing referenced assets: {Number(report?.missingReferencedAssetCount || 0)}</span>
          </div>
          {report?.summary?.length ? (
            <>
              <ul className={styles.issueList}>
                {report.summary.map((item) => (
                  <li key={item.code}>
                    {item.title}: {item.count}
                  </li>
                ))}
              </ul>
              <ul className={styles.issueList}>
                {report.issues.slice(0, 8).map((issue, index) => (
                  <li key={`${issue.code}:${issue.assetId || index}`}>
                    {issue.title}: {issue.detail}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.supportText}>No media usage projection issues are currently flagged.</p>
          )}
        </div>

        <form action={syncHubMediaUsageProjectionsAction} className={styles.supportActions}>
          <input type="hidden" name="hubSlug" value={hubSlug} />
          <SubmitButton idleLabel="Sync media usage" pendingLabel="Syncing media usage" variant="secondary" />
        </form>
      </div>
    </Surface>
  );
}

export default async function MediaPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubCoreBySlug(hubSlug);

  const pickerContext = normalizeSearchParam(resolvedSearchParams?.mode) === "pick"
    ? {
        returnTo: normalizeSearchParam(resolvedSearchParams?.returnTo),
        field: normalizeSearchParam(resolvedSearchParams?.field),
        altField: normalizeSearchParam(resolvedSearchParams?.altField),
        label: normalizeSearchParam(resolvedSearchParams?.label),
        selectedAssetId: normalizeSearchParam(resolvedSearchParams?.selectedAssetId),
      }
    : null;
  const accessPromise = getCurrentHubOperatorAccess(hub);
  const assetPagePromise = listMediaAssetPageByHubId(hub.id);
  const foldersPromise = listMediaFoldersByHubId(hub.id);
  const access = await accessPromise;
  const showSupportDiagnostics = access?.mode === "support" && !pickerContext;

  const [assetPage, folders, reconciliationReport] = await Promise.all([
    assetPagePromise,
    foldersPromise,
    showSupportDiagnostics ? getHubMediaUsageReconciliationReport(hub.id) : Promise.resolve(null),
  ]);
  const feedback = getMediaFeedback(resolvedSearchParams || {});

  let assets = assetPage.assets;

  if (pickerContext?.selectedAssetId && !assets.some((asset) => asset.id === pickerContext.selectedAssetId)) {
    const selectedAsset = await getMediaAssetMetadataById(hub.id, pickerContext.selectedAssetId);

    if (selectedAsset) {
      assets = [selectedAsset, ...assets];
    }
  }

  return (
    <div className={styles.layout}>
      {feedback ? (
        <FormMessage tone={feedback.tone}>{feedback.message}</FormMessage>
      ) : null}
      {showSupportDiagnostics ? (
        <MediaSupportDiagnostics hubSlug={hub.slug} report={reconciliationReport} />
      ) : null}
      <MediaLibraryWorkspace
        hub={hub}
        assets={assets}
        folders={folders}
        initialAssetCursor={assetPage.nextCursor}
        initialHasMoreAssets={assetPage.hasMore}
        initialSelectedAssetId={pickerContext?.selectedAssetId || ""}
        pickerContext={pickerContext}
      />
    </div>
  );
}

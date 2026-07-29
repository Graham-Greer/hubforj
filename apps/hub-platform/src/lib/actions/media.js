"use server";

import { revalidatePath } from "next/cache";
import { requireHubBySlug } from "@/lib/data/hubs";
import {
  createMediaFolderForHub,
  deleteMediaAssetForHub,
  deleteMediaFolderForHub,
  updateMediaAssetForHub,
  updateMediaFolderForHub,
} from "@/lib/data/media";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";

async function requireMediaAccess(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  const access = await getCurrentHubOperatorAccess(hub);

  if (!access) {
    throw new Error("You are not authorized to manage media for this hub.");
  }

  return { hub, access };
}

function revalidateMediaPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin/media`);
  revalidatePath(`/${hubSlug}/admin/settings/branding`);
  revalidatePath(`/${hubSlug}/admin/testimonials`);
  revalidatePath(`/${hubSlug}/testimonials`);
  revalidatePath(`/${hubSlug}`);
  revalidatePath(`/${hubSlug}/about`);
  revalidatePath(`/${hubSlug}/join`);
  revalidatePath(`/${hubSlug}/sign-in`);
}

export async function createMediaFolderAction({ hubSlug, name }) {
  const { hub, access } = await requireMediaAccess(hubSlug);
  const folder = await createMediaFolderForHub(hub.id, { name }, access.actorId);
  revalidateMediaPaths(hub.slug);
  return folder;
}

export async function updateMediaFolderAction({ hubSlug, folderId, name }) {
  const { hub, access } = await requireMediaAccess(hubSlug);
  const folder = await updateMediaFolderForHub(hub.id, folderId, { name }, access.actorId);
  revalidateMediaPaths(hub.slug);
  return folder;
}

export async function deleteMediaFolderAction({ hubSlug, folderId }) {
  const { hub } = await requireMediaAccess(hubSlug);
  await deleteMediaFolderForHub(hub.id, folderId);
  revalidateMediaPaths(hub.slug);
}

export async function updateMediaAssetAction({ hubSlug, assetId, displayName, alt, folderId }) {
  const { hub, access } = await requireMediaAccess(hubSlug);
  const asset = await updateMediaAssetForHub(hub.id, assetId, { displayName, alt, folderId }, access.actorId);
  revalidateMediaPaths(hub.slug);
  return asset;
}

export async function deleteMediaAssetAction({ hubSlug, assetId }) {
  const { hub } = await requireMediaAccess(hubSlug);
  await deleteMediaAssetForHub(hub.id, assetId);
  revalidateMediaPaths(hub.slug);
}

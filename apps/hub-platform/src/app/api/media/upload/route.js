import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { requireHubOperatorRouteAccessForHub } from "@/lib/auth/action-access";
import { requireHubById } from "@/lib/data/hubs";
import { uploadMediaAssetForHub } from "@/lib/data/media";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const hubId = normalizeString(formData.get("hubId"));
  const folderId = normalizeString(formData.get("folderId"));
  const alt = normalizeString(formData.get("alt"));
  const file = formData.get("file");

  if (!hubId) {
    return NextResponse.json({ error: "Hub id is required." }, { status: 400 });
  }

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  let hub;
  try {
    hub = await requireHubById(hubId);
  } catch {
    return NextResponse.json({ error: "Hub not found." }, { status: 404 });
  }

  const { access, errorResponse } = await requireHubOperatorRouteAccessForHub(request, hub, {
    unauthorizedMessage: "You are not authorized to upload media for this hub.",
  });
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadMediaAssetForHub(
      hub.id,
      {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folderId,
        alt,
        buffer,
      },
      access.actorId
    );

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || "Unable to upload media.") }, { status: 400 });
  }
}

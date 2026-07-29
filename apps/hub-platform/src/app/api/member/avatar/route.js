import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { getCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubById } from "@/lib/data/hubs";
import { uploadMediaAssetForHub } from "@/lib/data/media";
import { updateMemberAvatarById } from "@/lib/data/users";

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
  const file = formData.get("file");

  if (!hubId) {
    return NextResponse.json({ error: "Hub id is required." }, { status: 400 });
  }

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (!String(file.type || "").startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
  }

  let hub;
  try {
    hub = await requireHubById(hubId);
  } catch {
    return NextResponse.json({ error: "Hub not found." }, { status: 404 });
  }

  const session = await getCurrentMemberSessionForHub(hub);

  if (!session?.user) {
    return NextResponse.json({ error: "You are not authorized to update this profile." }, { status: 403 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const alt = normalizeString(session.user.name || session.user.email || "Profile avatar");
    const asset = await uploadMediaAssetForHub(
      hub.id,
      {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folderId: "",
        alt,
        buffer,
      },
      session.user.id
    );

    await updateMemberAvatarById(
      hub.id,
      session.user.id,
      {
        avatarAssetId: asset.id,
        avatarAlt: alt,
      },
      session.user.id
    );

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || "Unable to upload avatar.") }, { status: 400 });
  }
}

export async function DELETE(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const hubId = normalizeString(body.hubId);

  if (!hubId) {
    return NextResponse.json({ error: "Hub id is required." }, { status: 400 });
  }

  let hub;
  try {
    hub = await requireHubById(hubId);
  } catch {
    return NextResponse.json({ error: "Hub not found." }, { status: 404 });
  }

  const session = await getCurrentMemberSessionForHub(hub);

  if (!session?.user) {
    return NextResponse.json({ error: "You are not authorized to update this profile." }, { status: 403 });
  }

  try {
    await updateMemberAvatarById(
      hub.id,
      session.user.id,
      {
        avatarAssetId: "",
        avatarAlt: "",
      },
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || "Unable to remove avatar.") }, { status: 400 });
  }
}

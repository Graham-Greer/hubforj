"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/avatar/Avatar";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import styles from "./page.module.css";

function createInitials(member) {
  const label = String(member?.name || member?.email || "User").trim();

  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

export default function MemberAvatarEditor({ hubId, member }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState({ error: "", success: "" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message.success) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage((current) => ({ ...current, success: "" }));
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [message.success]);

  function handleUpload(file) {
    if (!file) {
      return;
    }

    startTransition(async () => {
      setMessage({ error: "", success: "" });
      const formData = new FormData();
      formData.set("hubId", hubId);
      formData.set("file", file);

      try {
        const response = await fetch("/api/member/avatar", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to upload avatar.");
        }

        setMessage({ error: "", success: "Avatar updated." });
        router.refresh();
      } catch (error) {
        setMessage({ error: String(error?.message || "Unable to upload avatar."), success: "" });
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      setMessage({ error: "", success: "" });

      try {
        const response = await fetch("/api/member/avatar", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hubId }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to remove avatar.");
        }

        setMessage({ error: "", success: "Avatar removed." });
        router.refresh();
      } catch (error) {
        setMessage({ error: String(error?.message || "Unable to remove avatar."), success: "" });
      }
    });
  }

  return (
    <div className={styles.avatarEditor}>
      <div className={styles.avatarEditorRow}>
        <div className={styles.avatarEditorPreview}>
          <Avatar
            initials={createInitials(member)}
            imageUrl={member.avatarAsset?.publicUrl || ""}
            alt={member.name || member.email || "Member profile"}
            size="xl"
            tone="accent"
            className={styles.avatar}
          />
        </div>

        <div className={styles.avatarEditorActions}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.visuallyHidden}
            onChange={(event) => {
              const file = event.target.files?.[0];
              handleUpload(file);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
            <Icon name="upload" size="sm" decorative />
            {member.avatarAsset?.publicUrl ? "Replace avatar" : "Upload avatar"}
          </Button>
          {member.avatarAsset?.publicUrl ? (
            <Button type="button" variant="secondary" onClick={handleRemove} disabled={isPending}>
              <Icon name="delete" size="sm" decorative />
              Remove avatar
            </Button>
          ) : null}
        </div>
      </div>

      {message.error ? <FormMessage tone="danger">{message.error}</FormMessage> : null}
      {message.success ? <FormMessage tone="success">{message.success}</FormMessage> : null}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import StatCard from "@/components/ui/stat-card/StatCard";
import Surface from "@/components/primitives/surface/Surface";
import {
  getTestimonialStatusLabel,
  getTestimonialStatusTone,
  summarizeTestimonials,
} from "@/lib/domain/testimonials";
import styles from "./TestimonialAdminList.module.css";

const initialDeleteTestimonialActionState = {
  error: "",
  testimonialId: "",
  authorName: "",
};

function DeleteTestimonialModal({ hub, testimonial, deleteTestimonialAction, onClose }) {
  const [state, formAction] = useActionState(deleteTestimonialAction, initialDeleteTestimonialActionState);

  return (
    <Modal
      title="Delete testimonial"
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <form action={formAction}>
            <input type="hidden" name="hubId" value={hub.id} />
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <input type="hidden" name="testimonialId" value={testimonial.id} />
            <input type="hidden" name="authorName" value={testimonial.authorName} />
            <Button type="submit" variant="secondary">
              Delete testimonial
            </Button>
          </form>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.modalText}>
          Delete the testimonial from <strong>{testimonial.authorName}</strong>? This removes it from your trust content and cannot be undone.
        </p>
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      </div>
    </Modal>
  );
}

export default function TestimonialAdminList({ hub, testimonials, deleteTestimonialAction }) {
  const summary = summarizeTestimonials(testimonials);
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState(null);

  return (
    <>
      <div className={styles.root} data-onboarding="testimonials-list">
        <PageHeader
          eyebrow={!testimonials.length ? "No testimonials yet" : "Testimonials"}
          title={!testimonials.length ? "Create the first testimonial" : "Manage your testimonials"}
          description={
            !testimonials.length
              ? "Add the first testimonial when you are ready to publish social proof on the website."
              : "Review testimonial quality, control publication, and keep social proof ready for the website."
          }
          actions={<Button href={`/${hub.slug}/admin/testimonials/create`}>Create testimonial</Button>}
        />

        <div className={styles.stats}>
          <StatCard label="Total" value={String(summary.total)} detail="Structured testimonial records." />
          <StatCard label="Published" value={String(summary.published)} detail="Visible on public testimonial surfaces." />
          <StatCard label="Featured" value={String(summary.featured)} detail="Prioritized for highlighted sections." />
        </div>

        {testimonials.length ? (
          <div className={styles.list}>
            {testimonials.map((testimonial) => (
              <Surface key={testimonial.id} className={styles.card} padding="md">
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    {testimonial.authorImageAsset?.publicUrl ? (
                      <div className={styles.avatarWrap}>
                        <Image
                          src={testimonial.authorImageAsset.publicUrl}
                          alt={testimonial.authorImageAlt || testimonial.authorImageAsset.alt || testimonial.authorName}
                          className={styles.avatar}
                          fill
                          sizes="3.5rem"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div>
                      <h2 className={styles.cardTitle}>{testimonial.authorName}</h2>
                      <p className={styles.cardMeta}>
                        {[testimonial.authorRole, testimonial.authorOrganization].filter(Boolean).join(" • ") || "Attribution pending"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cardControls}>
                    <div className={styles.badges}>
                      <Badge tone={getTestimonialStatusTone(testimonial.status)}>{getTestimonialStatusLabel(testimonial.status)}</Badge>
                      {testimonial.featured ? <Badge tone="accent">Featured</Badge> : null}
                    </div>
                    <CompactMenu
                      items={[
                        {
                          label: "Edit",
                          value: "edit",
                          onSelect: () => router.push(`/${hub.slug}/admin/testimonials/${testimonial.id}`),
                        },
                        {
                          label: "Delete",
                          value: "delete",
                          onSelect: () => setPendingDelete(testimonial),
                        },
                      ]}
                      triggerAriaLabel={`Manage testimonial from ${testimonial.authorName}`}
                      triggerTooltip="Testimonial actions"
                      triggerVariant="ghost"
                      triggerSize="sm"
                      align="end"
                    >
                      <Icon name="more_vert" size="sm" decorative />
                    </CompactMenu>
                  </div>
                </div>
                <p className={styles.quote}>“{testimonial.quote}”</p>
              </Surface>
            ))}
          </div>
        ) : null}
      </div>

      {pendingDelete ? (
        <DeleteTestimonialModal
          hub={hub}
          testimonial={pendingDelete}
          deleteTestimonialAction={deleteTestimonialAction}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </>
  );
}

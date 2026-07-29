"use client";

import { useState } from "react";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import SectionRichTextField from "@/components/patterns/section-rich-text-field/SectionRichTextField";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SwitchField from "@/components/ui/switch-field/SwitchField";
import Textarea from "@/components/ui/textarea/Textarea";
import useAutoSlugField from "@/hooks/use-auto-slug-field";
import {
  getHubCurrencySelectOptions,
  resolveHubCurrencyValue,
} from "@/lib/domain/currency-options";
import { normalizeCourseSlug } from "@/lib/domain/courses";
import {
  courseFormSections,
  courseFormatOptions,
  courseLevelFieldOptions,
  coursePricingOptions,
  courseRefundPolicyOptions,
  courseStatusOptions,
  courseTypeFieldOptions,
  courseVisibilityOptions,
} from "./course-form-config";
import styles from "./CourseFormFields.module.css";

export default function CourseFormFields({
  hub,
  mediaAssets = [],
  mediaFolders = [],
  values,
  activeSectionId,
  onMediaAssetChange,
  onMediaAltChange,
  canUsePaidCourses = false,
  paymentProcessingMode = "none",
}) {
  const isLockedPaidCourse = !canUsePaidCourses && values.pricingMode === "paid";
  const initialPricingMode = initialPricingModeOrFallback(values.pricingMode, canUsePaidCourses, isLockedPaidCourse);
  const [pricingMode, setPricingMode] = useState(initialPricingMode);
  const [format, setFormat] = useState(values.format || "in-person");
  const [requiresDeposit, setRequiresDeposit] = useState(values.requiresDeposit === true || values.requiresDeposit === "true");
  const [courseLevel, setCourseLevel] = useState(values.courseLevel || "");
  const {
    titleValue,
    slugValue,
    handleTitleChange,
    handleSlugChange,
    handleSlugBlur,
  } = useAutoSlugField({
    title: values.title,
    slug: values.slug,
    normalizeSlug: normalizeCourseSlug,
  });
  const timezonePlaceholder = hub?.timezone || "America/New_York";
  const currencyValue = resolveHubCurrencyValue(hub, values.currency);
  const currencyOptions = getHubCurrencySelectOptions(hub, values.currency);

  function handlePricingModeChange(nextPricingMode) {
    setPricingMode(nextPricingMode);

    if (nextPricingMode !== "paid") {
      setRequiresDeposit(false);
    }
  }

  return (
    <div className={styles.root}>
      {courseFormSections.map((section) => {
        const isActive = section.id === activeSectionId;

        return (
          <section
            key={section.id}
            id={`form-section-panel-${section.id}`}
            role="tabpanel"
            aria-labelledby={`form-section-tab-${section.id}`}
            hidden={!isActive}
            className={[styles.panel, !isActive ? styles.panelHidden : ""].filter(Boolean).join(" ")}
          >
            {section.id === "core" ? (
              <CoreDetailsSection
                hub={hub}
                mediaAssets={mediaAssets}
                mediaFolders={mediaFolders}
                values={values}
                isActive={isActive}
                onMediaAssetChange={onMediaAssetChange}
                onMediaAltChange={onMediaAltChange}
                courseLevel={courseLevel}
                onCourseLevelChange={setCourseLevel}
                titleValue={titleValue}
                slugValue={slugValue}
                onTitleChange={handleTitleChange}
                onSlugChange={handleSlugChange}
                onSlugBlur={handleSlugBlur}
              />
            ) : null}
            {section.id === "delivery" ? (
              <DeliverySection
                values={values}
                format={format}
                isActive={isActive}
                onFormatChange={setFormat}
                timezonePlaceholder={timezonePlaceholder}
              />
            ) : null}
            {section.id === "schedule-enrolment" ? <ScheduleEnrolmentSection values={values} isActive={isActive} /> : null}
            {section.id === "pricing" ? (
              <PricingSection
                values={values}
                pricingMode={pricingMode}
                requiresDeposit={requiresDeposit}
                isActive={isActive}
                onPricingModeChange={handlePricingModeChange}
                onRequiresDepositChange={setRequiresDeposit}
                canUsePaidCourses={canUsePaidCourses}
                isLockedPaidCourse={isLockedPaidCourse}
                paymentProcessingMode={paymentProcessingMode}
                currencyOptions={currencyOptions}
                currencyValue={currencyValue}
              />
            ) : null}
            {section.id === "publishing" ? <PublishingSection values={values} isActive={isActive} /> : null}
          </section>
        );
      })}
    </div>
  );
}

function CoreDetailsSection({
  hub,
  mediaAssets,
  mediaFolders,
  values,
  isActive,
  onMediaAssetChange,
  onMediaAltChange,
  courseLevel,
  onCourseLevelChange,
  titleValue,
  slugValue,
  onTitleChange,
  onSlugChange,
  onSlugBlur,
}) {
  const needsCustomLevelLabel = courseLevel === "custom";

  return (
    <AdminFormSection
      title="Core details"
      description="Give the course a clear public identity before learners see delivery, timing, pricing, or suitability."
    >
      <MediaAssetField
        key={`${values.imageAssetId}:${values.imageAlt}`}
        label="Course image"
        hint="Select media via upload or using existing media."
        hubId={hub.id}
        hubSlug={hub.slug}
        libraryHref={`/${hub.slug}/admin/media`}
        assets={mediaAssets}
        folders={mediaFolders}
        assetId={values.imageAssetId}
        assetAlt={values.imageAlt}
        assetFieldName="imageAssetId"
        altFieldName="imageAlt"
        onAssetChange={onMediaAssetChange}
        onAltChange={onMediaAltChange}
        uploadLabel="Upload course image"
        emptyTitle="Select media"
      />
      <div className={styles.grid}>
        <Input
          name="title"
          label="Course title"
          placeholder="Community leadership programme"
          value={titleValue}
          onChange={onTitleChange}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="slug"
          label="Course slug"
          placeholder="community-leadership-programme"
          value={slugValue}
          onChange={onSlugChange}
          onBlur={onSlugBlur}
          required={isActive}
          requiredIndicator
        />
        <AdminSelect
          name="courseType"
          label="Course type"
          options={courseTypeFieldOptions}
          defaultValue={values.courseType}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="subtypeLabel"
          label="Subtype label"
          placeholder="Leadership cohort"
          hint="Optional custom public label when the course type needs more context."
          defaultValue={values.subtypeLabel}
        />
        <AdminSelect
          name="courseLevel"
          label="Course level"
          options={courseLevelFieldOptions}
          defaultValue={values.courseLevel}
          onChange={(event) => onCourseLevelChange(event.target.value)}
          required={isActive}
          requiredIndicator
        />
        {needsCustomLevelLabel ? (
          <Input
            name="customLevelLabel"
            label="Custom level label"
            placeholder="Black belt"
            hint="Use a community-specific level label when the standard options do not fit."
            defaultValue={values.customLevelLabel}
            required={isActive}
            requiredIndicator
          />
        ) : null}
        <Input
          name="summary"
          label="Summary"
          placeholder="A short public-facing summary of the course."
          hint="Used in course listing cards and overview surfaces."
          defaultValue={values.summary}
          className={styles.fullWidth}
          required={isActive}
          requiredIndicator
        />
      </div>
      <SectionRichTextField
        name="description"
        label="Description"
        hint="Main course body for the course details page. Use paragraphs and bullet lists for clearer structure."
        defaultValue={values.description}
        requiredIndicator
        className={styles.sectionRichText}
      />
    </AdminFormSection>
  );
}

function DeliverySection({ values, format, isActive, onFormatChange, timezonePlaceholder }) {
  const needsLocation = format === "in-person" || format === "hybrid";
  const needsOnlineLink = format === "online" || format === "hybrid";

  return (
    <AdminFormSection
      title="Delivery"
      description="Clarify how the course is delivered and what learners need before they can attend."
    >
      <div className={styles.grid}>
        <AdminSelect
          name="format"
          label="Format"
          options={courseFormatOptions}
          defaultValue={values.format}
          onChange={(event) => onFormatChange(event.target.value)}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="timezone"
          label="Timezone"
          placeholder={timezonePlaceholder}
          defaultValue={values.timezone}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="location"
          label="Location"
          placeholder="Padworth Village Hall, Reading"
          hint="Required for in-person and hybrid delivery."
          defaultValue={values.location}
          required={isActive && needsLocation}
          requiredIndicator={needsLocation}
        />
        <Input
          name="onlineMeetingLink"
          label="Online meeting link"
          placeholder="https://zoom.us/j/..."
          hint="Required for online and hybrid delivery."
          defaultValue={values.onlineMeetingLink}
          required={isActive && needsOnlineLink}
          requiredIndicator={needsOnlineLink}
        />
      </div>
      <SectionRichTextField
        name="accessInstructions"
        label="Access instructions"
        hint="Share parking details, what to bring, arrival instructions, or joining guidance."
        defaultValue={values.accessInstructions}
        className={styles.sectionRichText}
      />
    </AdminFormSection>
  );
}

function ScheduleEnrolmentSection({ values, isActive }) {
  return (
    <AdminFormSection
      title="Schedule and enrolment"
      description="Set when the course runs and the rules for who can register, when, and under what capacity."
    >
      <div className={styles.grid}>
        <Input name="startDate" label="Start date" type="date" defaultValue={values.startDate} required={isActive} requiredIndicator />
        <Input name="endDate" label="End date" type="date" defaultValue={values.endDate} />
        <Input
          name="startTime"
          label="Start time"
          type="time"
          defaultValue={values.startTime}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="endTime"
          label="End time"
          type="time"
          defaultValue={values.endTime}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="sessionCount"
          label="Session count"
          type="number"
          min="0"
          placeholder="6"
          hint="Optional for now. Keep it aligned with the actual delivery plan."
          defaultValue={values.sessionCount}
        />
        <Input
          name="capacity"
          label="Capacity"
          type="number"
          min="0"
          placeholder="20"
          hint="Leave blank or zero for open enrolment."
          defaultValue={values.capacity}
        />
        <Input
          name="registrationOpenDate"
          label="Registration open date"
          type="date"
          defaultValue={values.registrationOpenDate}
          required={isActive}
          requiredIndicator
        />
        <Input
          name="registrationCloseDate"
          label="Registration close date"
          type="date"
          defaultValue={values.registrationCloseDate}
          required={isActive}
          requiredIndicator
        />
        <AdminSelect
          name="visibility"
          label="Visibility"
          options={courseVisibilityOptions}
          defaultValue={values.visibility}
          required={isActive}
          requiredIndicator
        />
        <SwitchField
          name="allowWaitlist"
          label="Allow waitlist"
          hint="If capacity is reached, new enrolments should join the waitlist instead of seeing the course as sold out."
          defaultChecked={values.allowWaitlist === true || values.allowWaitlist === "true"}
        />
      </div>
    </AdminFormSection>
  );
}

function PricingSection({
  values,
  pricingMode,
  requiresDeposit,
  isActive,
  onPricingModeChange,
  onRequiresDepositChange,
  canUsePaidCourses = false,
  isLockedPaidCourse = false,
  paymentProcessingMode = "none",
  currencyOptions = [],
  currencyValue = "USD",
}) {
  const isPaid = pricingMode === "paid";
  const isExternalPayments = paymentProcessingMode === "external";
  const pricingOptions = canUsePaidCourses
    ? coursePricingOptions
    : coursePricingOptions.filter((option) => (isLockedPaidCourse ? option.value === "paid" : option.value === "free"));

  return (
    <AdminFormSection
      title="Payment"
      description="Set the commercial rules so enrolment and payment expectations stay clear."
    >
      <div className={styles.grid}>
        <AdminSelect
          name="pricingMode"
          label="Pricing"
          options={pricingOptions}
          defaultValue={initialPricingModeOrFallback(values.pricingMode, canUsePaidCourses, isLockedPaidCourse)}
          onChange={isLockedPaidCourse ? undefined : (event) => onPricingModeChange(event.target.value)}
          disabled={isLockedPaidCourse}
          hint={isLockedPaidCourse ? "This course stays paid, but pricing is locked until the hub is back on Starter or above." : undefined}
          required={isActive}
          requiredIndicator
        />
        {isLockedPaidCourse ? <input type="hidden" name="pricingMode" value="paid" /> : null}
        {isPaid ? (
          <>
            <Input
              name={isLockedPaidCourse ? "price_display" : "price"}
              label="Price"
              type="number"
              min="0"
              step="0.01"
              placeholder="49.00"
              hint={isLockedPaidCourse ? "Upgrade to Starter to change paid course pricing." : "Required when the course is paid."}
              defaultValue={values.price}
              disabled={isLockedPaidCourse}
              required={isActive}
              requiredIndicator
            />
            <AdminSelect
              name={isLockedPaidCourse ? "currency_display" : "currency"}
              label="Currency"
              defaultValue={currencyValue}
              options={currencyOptions}
              hint={isLockedPaidCourse ? "Paid-course currency is preserved while this hub is below Starter." : "Defaults to your hub regional settings."}
              disabled={isLockedPaidCourse}
              required={isActive}
              requiredIndicator
            />
            {isLockedPaidCourse ? <input type="hidden" name="price" value={values.price} /> : null}
            {isLockedPaidCourse ? <input type="hidden" name="currency" value={currencyValue} /> : null}
            {isExternalPayments && !isLockedPaidCourse ? (
              <>
                <Input
                  name="externalPaymentUrl"
                  label="External payment link"
                  type="url"
                  placeholder="https://payments.example.com/course"
                  hint="Optional if you are collecting payment by bank transfer or manual reference instead. Use a checkout link, payment instructions, or both."
                  defaultValue={values.externalPaymentUrl}
                  className={styles.fullWidth}
                />
                <Textarea
                  name="paymentInstructions"
                  label="Payment instructions"
                  placeholder="Explain how to pay, for example with bank transfer details, a payment reference, or what happens after checkout."
                  hint="Required only if you do not provide an external payment link. Use this for manual payment steps, approval timing, or support guidance."
                  defaultValue={values.paymentInstructions}
                  rows={3}
                  className={styles.fullWidth}
                />
              </>
            ) : null}
            {paymentProcessingMode === "internal" ? (
              <p className={styles.fullWidth}>
                Built-in payments are active on Growth. Learners will complete payment inside the platform when they enrol.
              </p>
            ) : null}
            {!isExternalPayments ? (
              <>
                <input type="hidden" name="refundWindowMode" value="custom" />
                <Input
                  name="refundWindowHours"
                  label="Refund cutoff hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="48"
                  hint="Full refunds are available until this many hours before the course starts."
                  defaultValue={values.refundWindowHours}
                  required={isActive}
                  requiredIndicator
                />
                <AdminSelect
                  name="refundPolicy"
                  label="Refund policy"
                  options={courseRefundPolicyOptions}
                  defaultValue={values.refundPolicy}
                  required={isActive}
                  requiredIndicator
                />
                <Input
                  name="paymentDeadline"
                  label="Payment deadline"
                  type="date"
                  hint="Required for paid courses so learners know when payment must be completed."
                  defaultValue={values.paymentDeadline}
                  required={isActive}
                  requiredIndicator
                />
                <SwitchField
                  name="requiresDeposit"
                  label="Requires deposit"
                  hint="Enable if learners can reserve a place with a deposit before full payment."
                  defaultChecked={values.requiresDeposit === true || values.requiresDeposit === "true"}
                  onChange={onRequiresDepositChange}
                />
                {requiresDeposit ? (
                  <Input
                    name="depositAmount"
                    label="Deposit amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10.00"
                    defaultValue={values.depositAmount}
                    required={isActive}
                    requiredIndicator
                  />
                ) : null}
              </>
            ) : null}
            {isExternalPayments ? <input type="hidden" name="paymentDeadline" value="" /> : null}
            {isExternalPayments ? <input type="hidden" name="requiresDeposit" value="false" /> : null}
            {isExternalPayments ? <input type="hidden" name="depositAmount" value="" /> : null}
            {isExternalPayments ? <input type="hidden" name="refundWindowMode" value="custom" /> : null}
            {isExternalPayments ? <input type="hidden" name="refundWindowHours" value={String(values.refundWindowHours || 48)} /> : null}
            {isExternalPayments ? <input type="hidden" name="refundPolicy" value={values.refundPolicy || "full_refund_before_window"} /> : null}
          </>
        ) : (
          <>
            <input type="hidden" name="price" value="" />
            <input type="hidden" name="currency" value={currencyValue} />
            <input type="hidden" name="externalPaymentUrl" value="" />
            <input type="hidden" name="paymentInstructions" value="" />
            <input type="hidden" name="paymentDeadline" value="" />
            <input type="hidden" name="requiresDeposit" value="false" />
            <input type="hidden" name="depositAmount" value="" />
            <input type="hidden" name="refundWindowMode" value="custom" />
            <input type="hidden" name="refundWindowHours" value="48" />
            <input type="hidden" name="refundPolicy" value="full_refund_before_window" />
          </>
        )}
      </div>
    </AdminFormSection>
  );
}

function initialPricingModeOrFallback(pricingMode, canUsePaidCourses, isLockedPaidCourse) {
  if (isLockedPaidCourse) {
    return "paid";
  }

  return canUsePaidCourses || pricingMode === "free" ? pricingMode : "free";
}

function PublishingSection({ values, isActive }) {
  return (
    <AdminFormSection
      title="Publishing"
      description="Choose whether the course remains in draft, becomes visible to learners, or is cancelled."
    >
      <div className={styles.grid}>
        <AdminSelect
          name="status"
          label="Status"
          options={courseStatusOptions}
          defaultValue={values.status}
          required={isActive}
          requiredIndicator
        />
      </div>
    </AdminFormSection>
  );
}

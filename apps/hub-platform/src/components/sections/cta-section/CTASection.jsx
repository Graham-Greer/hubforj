import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionHeader from "@/components/sections/primitives/section-header/SectionHeader";
import SectionActions from "@/components/sections/primitives/section-actions/SectionActions";
import styles from "./CTASection.module.css";

const variantClassNames = {
  band: styles.variantBand,
  split: styles.variantSplit,
  editorial: styles.variantEditorial,
  block: styles.variantBlock,
};

const variantHeaderAlign = {
  band: "center",
  split: "start",
  editorial: "start",
  block: "start",
};

const variantHeaderWidth = {
  band: "wide",
  split: "default",
  editorial: "default",
  block: "wide",
};

const variantActionSize = {
  band: "lg",
  split: "lg",
  editorial: "lg",
  block: "lg",
};

export default function CTASection({
  id,
  eyebrow,
  title,
  description,
  actions = [],
  variant = "band",
  surface = "subtle",
  containerWidth = "default",
  headingLevel = 2,
  className = "",
}) {
  const resolvedVariant = variantClassNames[variant] ? variant : "band";
  const resolvedAlign = variantHeaderAlign[resolvedVariant];
  const actionSize = variantActionSize[resolvedVariant];
  const isInverse = surface === "inverse";

  return (
    <SectionShell
      id={id}
      spacing="spacious"
      surface={surface}
      className={[styles.root, variantClassNames[resolvedVariant], className].filter(Boolean).join(" ")}
    >
      <SectionContainer width={containerWidth}>
        <div className={styles.inner}>
          <div className={styles.copy}>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              align={resolvedAlign}
              width={variantHeaderWidth[resolvedVariant]}
              headingLevel={headingLevel}
              className={[styles.header, isInverse ? styles.inverseHeader : ""].filter(Boolean).join(" ")}
              eyebrowClassName={isInverse ? styles.inverseEyebrow : ""}
              titleClassName={isInverse ? styles.inverseTitle : ""}
              descriptionClassName={isInverse ? styles.inverseDescription : ""}
            />
          </div>
          <SectionActions
            actions={actions}
            size={actionSize}
            align={
              resolvedVariant === "band"
                ? "center"
                : resolvedVariant === "block" || resolvedVariant === "editorial"
                  ? "start"
                  : "end"
            }
            className={styles.actions}
          />
        </div>
      </SectionContainer>
    </SectionShell>
  );
}

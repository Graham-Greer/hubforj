import Text from "@/components/primitives/text/Text";
import SectionHeader from "@/components/patterns/section-header/SectionHeader";
import Section from "@/components/patterns/section/Section";
import Button from "@/components/ui/button/Button";
import styles from "./ContactSection.module.css";

export default function ContactSection({ variant = "card", address, email, phone, mapLink }) {
  return (
    <Section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <SectionHeader title="Contact" />
      {address ? <Text>{address}</Text> : null}
      {email ? <Text><a href={`mailto:${email}`}>{email}</a></Text> : null}
      {phone ? <Text><a href={`tel:${phone}`}>{phone}</a></Text> : null}
      {mapLink ? <Button href={mapLink} variant="secondary">View map</Button> : null}
    </Section>
  );
}

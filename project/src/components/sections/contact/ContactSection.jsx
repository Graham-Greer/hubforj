import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import styles from "./ContactSection.module.css";

export default function ContactSection({ variant = "card", address, email, phone, mapLink }) {
  return (
    <section className={[styles.root, styles[`variant_${variant}`] || ""].join(" ")}>
      <Heading as="h2" size="md">Contact</Heading>
      {address ? <Text>{address}</Text> : null}
      {email ? <Text><a href={`mailto:${email}`}>{email}</a></Text> : null}
      {phone ? <Text><a href={`tel:${phone}`}>{phone}</a></Text> : null}
      {mapLink ? <Button href={mapLink} variant="secondary">View map</Button> : null}
    </section>
  );
}

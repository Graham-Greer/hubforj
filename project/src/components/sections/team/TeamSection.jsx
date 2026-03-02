import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import styles from "./TeamSection.module.css";

function parseMembers(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, role, bio] = line.split("|");
      return {
        id: `member-${index}`,
        name: String(name || "").trim() || `Member ${index + 1}`,
        role: String(role || "").trim(),
        bio: String(bio || "").trim(),
      };
    });
}

export default function TeamSection({ title, membersText, variant = "grid" }) {
  const members = parseMembers(membersText);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <div className={[styles.grid, styles[`variant_${variant}`] || ""].join(" ")}>
        {members.map((member) => (
          <Card key={member.id} className={styles.card}>
            <Heading as="h3" size="sm">{member.name}</Heading>
            {member.role ? <Text weight="semibold">{member.role}</Text> : null}
            {member.bio ? <Text tone="secondary">{member.bio}</Text> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

import {
  hasSectionRichTextContent,
  normalizeSectionRichTextContent,
} from "@/lib/domain/section-rich-text";
import styles from "./SectionRichText.module.css";

function renderInlineChildren(children = []) {
  return children.map((child, index) => {
    let node = child.text;

    if (child.href) {
      node = (
        <a key={`link-${index}`} href={child.href} className={styles.link}>
          {node}
        </a>
      );
    }

    if (child.italic) {
      node = <em key={`italic-${index}`}>{node}</em>;
    }

    if (child.bold) {
      node = <strong key={`bold-${index}`}>{node}</strong>;
    }

    if (!child.bold && !child.italic) {
      node = <span key={`plain-${index}`}>{node}</span>;
    }

    return node;
  });
}

export default function SectionRichText({ content, className = "", profile = "basic" }) {
  const blocks = normalizeSectionRichTextContent(content, { profile });

  if (!hasSectionRichTextContent(blocks, { profile })) {
    return null;
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => {
        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const ListTag = block.type === "ordered-list" ? "ol" : "ul";
          return (
            <ListTag key={`list-${index}`} className={styles.list}>
              {block.items.map((item, itemIndex) => (
                <li key={`list-item-${itemIndex}`} className={styles.listItem}>
                  {renderInlineChildren(item.children)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "heading") {
          const HeadingTag = block.level === 3 ? "h3" : "h2";

          return (
            <HeadingTag key={`heading-${index}`} className={styles.heading}>
              {renderInlineChildren(block.children)}
            </HeadingTag>
          );
        }

        return (
          <p key={`paragraph-${index}`} className={styles.paragraph}>
            {renderInlineChildren(block.children)}
          </p>
        );
      })}
    </div>
  );
}

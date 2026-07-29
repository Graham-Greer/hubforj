"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import {
  normalizeSectionRichTextContent,
  parseSectionRichTextInput,
} from "@/lib/domain/section-rich-text";
import styles from "./SectionRichTextField.module.css";

const BASIC_PROFILE = "basic";
const LEGAL_PROFILE = "legal";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineChildren(children = []) {
  return children
    .map((child) => {
      let text = escapeHtml(child.text);

      if (child.href) {
        text = `<a href="${escapeHtml(child.href)}">${text}</a>`;
      }

      if (child.italic) {
        text = `<em>${text}</em>`;
      }

      if (child.bold) {
        text = `<strong>${text}</strong>`;
      }

      return text;
    })
    .join("");
}

function renderContentToHtml(content, profile = BASIC_PROFILE) {
  const blocks = normalizeSectionRichTextContent(content, { profile });

  if (!blocks.length) {
    return "<p><br></p>";
  }

  return blocks
    .map((block) => {
      if (block.type === "unordered-list" || block.type === "ordered-list") {
        const items = block.items.map((item) => `<li>${renderInlineChildren(item.children)}</li>`).join("");
        return block.type === "ordered-list" ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      }

      if (block.type === "heading") {
        const tagName = block.level === 3 ? "h3" : "h2";
        return `<${tagName}>${renderInlineChildren(block.children) || "<br>"}</${tagName}>`;
      }

      return `<p>${renderInlineChildren(block.children) || "<br>"}</p>`;
    })
    .join("");
}

function normalizeTextNode(text, marks = {}) {
  if (!String(text || "").trim()) {
    return [];
  }

  return [{
    text: String(text),
    ...(marks.bold ? { bold: true } : {}),
    ...(marks.italic ? { italic: true } : {}),
    ...(marks.href ? { href: marks.href } : {}),
  }];
}

function haveMatchingInlineFormatting(left = {}, right = {}) {
  return (
    Boolean(left.bold) === Boolean(right.bold) &&
    Boolean(left.italic) === Boolean(right.italic) &&
    String(left.href || "") === String(right.href || "")
  );
}

function mergeInlineChildren(children = []) {
  return children.reduce((result, child) => {
    if (!child?.text || !child.text.trim()) {
      return result;
    }

    const previous = result[result.length - 1];
    if (previous && haveMatchingInlineFormatting(previous, child)) {
      previous.text += child.text;
      return result;
    }

    result.push({ ...child });
    return result;
  }, []);
}

function normalizeLinkHref(value) {
  const href = String(value || "").trim();

  if (!href) {
    return "";
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  return "";
}

function extractInlineChildren(node, marks = {}, profile = BASIC_PROFILE) {
  if (!node) {
    return [];
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeTextNode(node.textContent, marks);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const nextMarks = {
    bold: marks.bold || ["B", "STRONG"].includes(node.tagName),
    italic: marks.italic || ["I", "EM"].includes(node.tagName),
    href:
      profile === LEGAL_PROFILE && node.tagName === "A"
        ? normalizeLinkHref(node.getAttribute("href"))
        : marks.href || "",
  };

  return Array.from(node.childNodes).flatMap((child) => extractInlineChildren(child, nextMarks, profile));
}

function serializeHtmlToContent(html, profile = BASIC_PROFILE) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const blocks = Array.from(template.content.childNodes).flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const children = mergeInlineChildren(normalizeTextNode(node.textContent));
      return children.length ? [{ type: "paragraph", children }] : [];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    if (node.tagName === "UL" || (profile === LEGAL_PROFILE && node.tagName === "OL")) {
      const items = Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .map((item) => {
          const children = mergeInlineChildren(extractInlineChildren(item, {}, profile));
          return children.length ? { children } : null;
        })
        .filter(Boolean);

      return items.length ? [{
        type: node.tagName === "OL" ? "ordered-list" : "unordered-list",
        items,
      }] : [];
    }

    if (profile === LEGAL_PROFILE && ["H2", "H3"].includes(node.tagName)) {
      const children = mergeInlineChildren(extractInlineChildren(node, {}, profile));

      return children.length
        ? [{
            type: "heading",
            level: node.tagName === "H3" ? 3 : 2,
            children,
          }]
        : [];
    }

    const children = mergeInlineChildren(extractInlineChildren(node, {}, profile));
    return children.length ? [{ type: "paragraph", children }] : [];
  });

  return normalizeSectionRichTextContent(blocks, { profile });
}

function sanitizeClipboardHtml(html, plainText, profile = BASIC_PROFILE) {
  try {
    const parsed = serializeHtmlToContent(html, profile);
    return renderContentToHtml(parsed, profile);
  } catch {
    const fallbackBlocks = String(plainText || "")
      .split(/\n{2,}/)
      .map((paragraph) => ({
        type: "paragraph",
        children: [{ text: paragraph.trim() }],
      }))
      .filter((block) => block.children[0].text);

    return renderContentToHtml(fallbackBlocks, profile);
  }
}

export default function SectionRichTextField({
  name,
  label,
  hint,
  defaultValue,
  requiredIndicator = false,
  className = "",
  profile = BASIC_PROFILE,
}) {
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const editorRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const formattingResetFrameRef = useRef(null);
  const skipNextFocusResetRef = useRef(false);
  const initialSerializedValue = JSON.stringify(parseSectionRichTextInput(defaultValue, { profile }));
  const isLegalProfile = profile === LEGAL_PROFILE;
  const [commandState, setCommandState] = useState({
    bold: false,
    italic: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    heading: "",
    link: false,
  });

  const readBrowserCommandState = useCallback((command) => {
    try {
      return Boolean(document.queryCommandState(command));
    } catch {
      return false;
    }
  }, []);

  const updateCommandState = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const selection = window.getSelection();
    const isInEditor = Boolean(selection?.anchorNode && editorRef.current.contains(selection.anchorNode));

    if (!isInEditor) {
      setCommandState({
        bold: false,
        italic: false,
        insertUnorderedList: false,
        insertOrderedList: false,
        heading: "",
        link: false,
      });
      return;
    }

    let heading = "";
    let link = false;
    let currentNode = selection?.anchorNode;

    while (currentNode && currentNode !== editorRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.tagName;
        if (!heading && ["H2", "H3"].includes(tagName)) {
          heading = tagName.toLowerCase();
        }

        if (!link && tagName === "A") {
          link = true;
        }
      }

      currentNode = currentNode.parentNode;
    }

    const nextState = {
      bold: readBrowserCommandState("bold"),
      italic: readBrowserCommandState("italic"),
      insertUnorderedList: readBrowserCommandState("insertUnorderedList"),
      insertOrderedList: isLegalProfile ? readBrowserCommandState("insertOrderedList") : false,
      heading,
      link,
    };

    setCommandState(nextState);
  }, [isLegalProfile, readBrowserCommandState]);

  const syncSerializedValue = useCallback((nextValue, { notify = false } = {}) => {
    if (!hiddenInputRef.current) {
      return;
    }

    if (hiddenInputRef.current.value === nextValue) {
      return;
    }

    hiddenInputRef.current.value = nextValue;

    if (!notify) {
      return;
    }

    hiddenInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    hiddenInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
  }, []);

  const resetActiveFormatting = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const selection = window.getSelection();
    if (!selection?.anchorNode || !editorRef.current.contains(selection.anchorNode)) {
      return;
    }

    ["bold", "italic"].forEach((command) => {
      try {
        if (document.queryCommandState(command)) {
          document.execCommand(command, false);
        }
      } catch {
        // Ignore browser-level command-state quirks and keep the editor usable.
      }
    });

    updateCommandState();
  }, [updateCommandState]);

  const scheduleFormattingReset = useCallback(() => {
    if (formattingResetFrameRef.current) {
      cancelAnimationFrame(formattingResetFrameRef.current);
    }

    formattingResetFrameRef.current = requestAnimationFrame(() => {
      formattingResetFrameRef.current = null;
      resetActiveFormatting();
    });
  }, [resetActiveFormatting]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const normalized = parseSectionRichTextInput(defaultValue, { profile });
    const serialized = JSON.stringify(normalized);
    editorRef.current.innerHTML = renderContentToHtml(normalized, profile);
    syncSerializedValue(serialized);

    try {
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // Some browsers may not support these commands consistently.
    }
    requestAnimationFrame(() => {
      updateCommandState();
    });
  }, [defaultValue, profile, syncSerializedValue, updateCommandState]);

  useEffect(() => {
    function handleSelectionChange() {
      updateCommandState();
    }

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);

      if (formattingResetFrameRef.current) {
        cancelAnimationFrame(formattingResetFrameRef.current);
      }
    };
  }, [updateCommandState]);

  useEffect(() => {
    const form = hiddenInputRef.current?.form;

    if (!form) {
      return undefined;
    }

    function handleFormSubmit() {
      if (!editorRef.current) {
        return;
      }

      syncSerializedValue(JSON.stringify(serializeHtmlToContent(editorRef.current.innerHTML, profile)));
    }

    form.addEventListener("submit", handleFormSubmit, true);

    return () => {
      form.removeEventListener("submit", handleFormSubmit, true);
    };
  }, [profile, syncSerializedValue]);

  const syncFromEditor = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    syncSerializedValue(
      JSON.stringify(serializeHtmlToContent(editorRef.current.innerHTML, profile)),
      { notify: true }
    );
    updateCommandState();
  }, [profile, syncSerializedValue, updateCommandState]);

  const applyCommand = useCallback((command, value = null) => {
    if (!editorRef.current) {
      return;
    }

    skipNextFocusResetRef.current = true;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateCommandState();
    syncFromEditor();
  }, [syncFromEditor, updateCommandState]);

  const handleLinkToggle = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    if (commandState.link) {
      applyCommand("unlink");
      return;
    }

    const href = window.prompt("Enter a full URL, mailto: link, or tel: link");
    const normalizedHref = normalizeLinkHref(href);

    if (!normalizedHref) {
      return;
    }

    applyCommand("createLink", normalizedHref);
  }, [applyCommand, commandState.link]);

  const handleHeadingToggle = useCallback((tagName) => {
    const nextTag = commandState.heading === tagName.toLowerCase() ? "p" : tagName;
    applyCommand("formatBlock", nextTag);
  }, [applyCommand, commandState.heading]);

  const handlePaste = useCallback((event) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, sanitizeClipboardHtml(html, text, profile));
    syncFromEditor();
  }, [profile, syncFromEditor]);

  return (
    <div className={[fieldStyles.root, className].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={fieldId} className={fieldStyles.label}>
          {label}
          {requiredIndicator ? <span className={fieldStyles.requiredIndicator}> *</span> : null}
        </label>
      ) : null}

      {hint ? (
        <p id={hintId} className={fieldStyles.hint}>
          {hint}
        </p>
      ) : null}

      <div className={styles.root}>
        <div className={styles.toolbar}>
          <Button
            type="button"
            variant={commandState.bold ? "primary" : "secondary"}
            size="sm"
            className={styles.toolButton}
            onClick={() => applyCommand("bold")}
            aria-pressed={commandState.bold}
            title="Bold"
          >
            <span className={[styles.textIcon, styles.boldIcon].join(" ")}>B</span>
          </Button>
          <Button
            type="button"
            variant={commandState.italic ? "primary" : "secondary"}
            size="sm"
            className={styles.toolButton}
            onClick={() => applyCommand("italic")}
            aria-pressed={commandState.italic}
            title="Italic"
          >
            <span className={[styles.textIcon, styles.italicIcon].join(" ")}>I</span>
          </Button>
          <Button
            type="button"
            variant={commandState.insertUnorderedList ? "primary" : "secondary"}
            size="sm"
            className={styles.toolButton}
            onClick={() => applyCommand("insertUnorderedList")}
            aria-pressed={commandState.insertUnorderedList}
            title="Bullet list"
          >
            <Icon name="format_list_bulleted" decorative />
          </Button>
          {isLegalProfile ? (
            <>
              <Button
                type="button"
                variant={commandState.insertOrderedList ? "primary" : "secondary"}
                size="sm"
                className={styles.toolButton}
                onClick={() => applyCommand("insertOrderedList")}
                aria-pressed={commandState.insertOrderedList}
                title="Numbered list"
              >
                <Icon name="format_list_numbered" decorative />
              </Button>
              <Button
                type="button"
                variant={commandState.heading === "h2" ? "primary" : "secondary"}
                size="sm"
                className={styles.toolButton}
                onClick={() => handleHeadingToggle("h2")}
                aria-pressed={commandState.heading === "h2"}
                title="Section heading"
              >
                <span className={styles.textIcon}>H2</span>
              </Button>
              <Button
                type="button"
                variant={commandState.heading === "h3" ? "primary" : "secondary"}
                size="sm"
                className={styles.toolButton}
                onClick={() => handleHeadingToggle("h3")}
                aria-pressed={commandState.heading === "h3"}
                title="Subheading"
              >
                <span className={styles.textIcon}>H3</span>
              </Button>
              <Button
                type="button"
                variant={commandState.link ? "primary" : "secondary"}
                size="sm"
                className={styles.toolButton}
                onClick={handleLinkToggle}
                aria-pressed={commandState.link}
                title={commandState.link ? "Remove link" : "Add link"}
              >
                <Icon name="link" decorative />
              </Button>
            </>
          ) : null}
        </div>

        <div
          id={fieldId}
          ref={editorRef}
          className={[fieldStyles.control, styles.editor].join(" ")}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-describedby={hintId}
          data-profile={profile}
          onPaste={handlePaste}
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          onFocus={() => {
            if (skipNextFocusResetRef.current) {
              skipNextFocusResetRef.current = false;
              return;
            }

            scheduleFormattingReset();
          }}
        />

        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          defaultValue={initialSerializedValue}
        />
      </div>
    </div>
  );
}

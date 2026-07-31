import React, { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";

/* Toolbar buttons must be type="button" — the editor is used inside <form>s
   (BlogsTab), where a bare <button> submits the form instead of styling text. */
const TOOLBAR_BTN =
  "p-1.5 rounded-md text-app-fg-muted transition-colors hover:bg-app-accent-soft hover:text-app-accent";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  style,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync initial value or external updates
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      if (value === "" && contentRef.current.innerHTML === "<br>") return;
      contentRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, val: string = "") => {
    document.execCommand(command, false, val);
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
    contentRef.current?.focus();
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (!url) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand("createLink", false, url);
      if (selection.anchorNode?.parentElement?.tagName === "A") {
        selection.anchorNode.parentElement.setAttribute("target", "_blank");
      }
    } else {
      const linkHtml = `<a href="${url}" target="_blank">${url}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    }

    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const handleUpperCase = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand("insertText", false, selection.toString().toUpperCase());
    }
  };

  const handleCapitalize = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection
        .toString()
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
      document.execCommand("insertText", false, text);
    }
  };

  // Open links in new tab on click
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A") {
      window.open((target as HTMLAnchorElement).href, "_blank");
    }
  };

  return (
    <div
      className={`border border-app-border rounded-xl overflow-hidden bg-app-surface ${className}`}
      style={style}
    >
      <style>{`
        .rich-text-content a {
          color: inherit !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .rich-text-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .rich-text-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        /* The editor is a contentEditable div, so the placeholder has to be drawn
           from data-placeholder rather than the (invalid here) attribute. */
        .rich-text-content:empty::before {
          content: attr(data-placeholder);
          color: var(--surface-fg-muted);
          opacity: 0.7;
          pointer-events: none;
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="flex items-center gap-1 p-2 bg-app-surface-2 border-b border-app-border flex-wrap">
        <button onClick={() => exec("bold")} type="button" className={TOOLBAR_BTN} title="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => exec("italic")} type="button" className={TOOLBAR_BTN} title="Italic">
          <Italic size={16} />
        </button>
        <button
          onClick={() => exec("underline")}
          type="button"
          className={TOOLBAR_BTN}
          title="Underline"
        >
          <Underline size={16} />
        </button>

        <div className="w-px h-5 bg-app-border mx-1" />

        <button
          onClick={() => exec("justifyLeft")}
          type="button"
          className={TOOLBAR_BTN}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => exec("justifyCenter")}
          type="button"
          className={TOOLBAR_BTN}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => exec("justifyRight")}
          type="button"
          className={TOOLBAR_BTN}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>

        <div className="w-px h-5 bg-app-border mx-1" />

        {/* BULLET & NUMBER LIST */}
        <button
          onClick={() => exec("insertUnorderedList")}
          type="button"
          className={TOOLBAR_BTN}
          title="Bullet List"
        >
          <List size={16} />
        </button>

        <button
          onClick={() => exec("insertOrderedList")}
          type="button"
          className={TOOLBAR_BTN}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-5 bg-app-border mx-1" />

        <button onClick={handleLink} type="button" className={TOOLBAR_BTN} title="Insert Link">
          <LinkIcon size={16} />
        </button>

        <div className="w-px h-5 bg-app-border mx-1" />

        <button
          onClick={handleUpperCase}
          type="button"
          className={`${TOOLBAR_BTN} text-xs font-bold border border-app-border`}
          title="Uppercase"
        >
          AA
        </button>

        <button
          onClick={handleCapitalize}
          type="button"
          className={`${TOOLBAR_BTN} text-xs font-bold border border-app-border`}
          title="Capitalize"
        >
          Aa
        </button>
      </div>

      {/* EDITOR */}
      <div
        ref={contentRef}
        contentEditable
        onClick={handleContentClick}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="rich-text-content p-3.5 min-h-[150px] outline-none text-[13.5px] leading-6 text-app-fg"
        // `placeholder` isn't a valid HTML attribute on contentEditable divs;
        // use data-placeholder + CSS (`[data-placeholder]:empty::before`).
        data-placeholder={placeholder}
        onBlur={() => {
          if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;

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
      document.execCommand(
        "insertText",
        false,
        selection.toString().toUpperCase()
      );
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
      className={`border border-gray-400 rounded-lg overflow-hidden bg-white ${className}`}
      style={style}
    >
      <style>{`
        .rich-text-content a {
          color: #1f2937 !important;
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
      `}</style>

      {/* TOOLBAR */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button onClick={() => exec("bold")} className="p-1.5 hover:bg-gray-200 rounded" title="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => exec("italic")} className="p-1.5 hover:bg-gray-200 rounded" title="Italic">
          <Italic size={16} />
        </button>
        <button onClick={() => exec("underline")} className="p-1.5 hover:bg-gray-200 rounded" title="Underline">
          <Underline size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button onClick={() => exec("justifyLeft")} className="p-1.5 hover:bg-gray-200 rounded" title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button onClick={() => exec("justifyCenter")} className="p-1.5 hover:bg-gray-200 rounded" title="Align Center">
          <AlignCenter size={16} />
        </button>
        <button onClick={() => exec("justifyRight")} className="p-1.5 hover:bg-gray-200 rounded" title="Align Right">
          <AlignRight size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* BULLET & NUMBER LIST */}
        <button
          onClick={() => exec("insertUnorderedList")}
          className="p-1.5 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <List size={16} />
        </button>

        <button
          onClick={() => exec("insertOrderedList")}
          className="p-1.5 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button onClick={handleLink} className="p-1.5 hover:bg-gray-200 rounded" title="Insert Link">
          <LinkIcon size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          onClick={handleUpperCase}
          className="p-1.5 hover:bg-gray-200 rounded text-xs font-bold border border-gray-300"
          title="Uppercase"
        >
          AA
        </button>

        <button
          onClick={handleCapitalize}
          className="p-1.5 hover:bg-gray-200 rounded text-xs font-bold border border-gray-300"
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
        className="rich-text-content p-3 min-h-[150px] outline-none text-sm text-gray-800"
        placeholder={placeholder}
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

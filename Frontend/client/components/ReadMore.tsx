import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* HTML Renderer */
function RenderHTML({ html }) {
  return (
    <span
      className="inline text-sm font-normal "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const ReadMore = ({
  children,
  maxCharacters = 100,
  textSize = "text-base",
  dialogTitle = "Full Description",
}) => {
  const [openDesc, setOpenDesc] = useState(false);
  const text = children || "";

  // If text is short, show directly
  if (text.length <= maxCharacters) {
    return (
      <span className={`${textSize} inline `}>
        <RenderHTML html={text} />
      </span>
    );
  }

  const shortText = text.slice(0, maxCharacters);

  return (
    <>
      {/* INLINE TEXT + SEE ALL */}
      <span className={`inline ${textSize}`}>
        <RenderHTML html={shortText} />
        <span className="inline">…</span>

        <button
          type="button"
          onClick={() => setOpenDesc(true)}
          className="inline-flex whitespace-nowrap ml-1 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          See all
        </button>
      </span>

      {/* DIALOG */}
      <Dialog open={openDesc} onOpenChange={setOpenDesc}>
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          {/* SCROLLABLE CONTENT */}
          <div className="max-h-[60vh] overflow-y-auto text-[14px] font-normal text-gray-700 dark:text-white">
            <RenderHTML html={text} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReadMore;

// html2pdf.js + html2canvas weigh ~944kB combined and are only invoked on
// user action (e.g. "Download PDF" buttons). We lazy-import them inside
// each function so neither lib lands in any route's initial chunk.

import { logoSrc as brandLogoSrc } from "@/lib/brand";

export interface PDFOptions {
  filename: string;
  title?: string;
  orientation?: "portrait" | "landscape";
  compress?: boolean;
}

/**
 * Width a full-bleed PDF source node must be, exactly.
 *
 * html2pdf renders into a container sized to `pageSize.inner.width` (page width
 * minus the left/right margins) inside an overlay with `overflow: hidden`. It
 * does NOT scale a node down to fit — anything wider is simply cut off at the
 * right edge. `downloadElementAsPDF` uses zero horizontal margin so the inner
 * width is the full A4 sheet, and the document draws its own gutters.
 */
export const PDF_PAGE_WIDTH = "210mm";

/** Bottom band (mm) kept clear on every page for the stamped footer. */
const FOOTER_BAND_MM = 14;

export interface ElementPDFOptions {
  filename: string;
  /** Printed bottom-left on every page — usually the listing's public URL. */
  footerLeft?: string;
}

/**
 * Render an off-screen node to A4 and save it.
 *
 * The node is expected to be `PDF_PAGE_WIDTH` wide and to sit inside a
 * `display: none` wrapper, which is why it is cloned and unhidden first: an
 * un-rendered node measures 0x0 and html2canvas captures nothing.
 */
export const downloadElementAsPDF = async (source: HTMLElement, options: ElementPDFOptions) => {
  const { default: html2pdf } = await import("html2pdf.js");

  const element = source.cloneNode(true) as HTMLElement;
  element.style.display = "block";

  const opt = {
    // [top, left, bottom, right]. No horizontal margin — the masthead, hero and
    // host band run to the paper edge, and the body pads itself.
    margin: [0, 0, FOOTER_BAND_MM, 0] as [number, number, number, number],
    filename: options.filename,
    image: { type: "jpeg" as const, quality: 0.96 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm" as const,
      format: "a4",
      orientation: "portrait" as const,
      compress: true,
    },
    /* "avoid-all" was refusing to split anything at all, which pushed the
       trailing block onto a page of its own. Break on explicit opt-in instead. */
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: [".pdf-avoid"],
      before: [".pdf-break-before"],
    },
  };

  const worker = html2pdf().set(opt).from(element).toPdf();

  await worker.get("pdf").then((pdf: any) => {
    const total = pdf.internal.getNumberOfPages();
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    for (let page = 1; page <= total; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(216, 228, 228);
      pdf.setLineWidth(0.2);
      pdf.line(16, h - 10, w - 16, h - 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(122, 138, 139);
      if (options.footerLeft) {
        // Long URLs would otherwise run under the page number.
        pdf.text(pdf.splitTextToSize(options.footerLeft, w - 60)[0], 16, h - 5.5);
      }
      pdf.text(`${page} / ${total}`, w - 16, h - 5.5, { align: "right" });
    }
  });

  await worker.save();
};

export const generatePDF = async (elementId: string, options: PDFOptions) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const { default: html2pdf } = await import("html2pdf.js");

  const opt = {
    margin: 10,
    filename: options.filename || "document.pdf",
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: {
      orientation: options.orientation || "portrait",
      unit: "mm",
      format: "a4",
      compress: options.compress !== false,
    },
  };

  html2pdf().set(opt).from(element).save();
};

export const downloadDetailsAsPDF = async (
  data: Record<string, any>,
  filename: string,
  title: string,
) => {
  const { default: html2pdf } = await import("html2pdf.js");

  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.backgroundColor = "#fff";
  element.style.color = "#000";

  // html2pdf rasterises the node, so the logo has to be an absolute URL it can fetch.
  const logoUrl = new URL(brandLogoSrc("horizontal", "black"), window.location.origin).href;

  element.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 10px;">
      <h1 style="margin: 0; color: #1c2939; font-size: 24px;">${title}</h1>
      <p style="color: #888; margin: 5px 0 0 0;">Downloaded on ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="border-top: 2px solid #e0e0e0; padding-top: 20px;">
      ${Object.entries(data)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `
              <div style="margin-bottom: 15px;">
                <h3 style="color: #333; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">${formatKey(key)}</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${value.map((item) => `<li style="margin: 4px 0; font-size: 12px;">${item}</li>`).join("")}
                </ul>
              </div>
            `;
          }
          return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px;">
              <span style="font-weight: 500; color: #555;">${formatKey(key)}</span>
              <span style="color: #333;">${value || "N/A"}</span>
            </div>
          `;
        })
        .join("")}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #999; font-size: 10px;">
      <p style="margin: 0;">This is an official document from Travel Homes</p>
      <p style="margin: 5px 0 0 0;">For inquiries, visit our website or contact support</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: {
      orientation: "portrait" as const,
      unit: "mm",
      format: "a4",
      compress: true,
    },
  };

  html2pdf().set(opt).from(element).save();
};

const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

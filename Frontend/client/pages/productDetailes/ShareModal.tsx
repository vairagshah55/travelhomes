import React, { useState } from "react";
import { Copy, Download, Share2, Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  contentRef?: React.RefObject<HTMLDivElement>;
  isDarkMode?: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  contentRef,
  isDarkMode = false,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const generateShareUrl = () => {
    return url;
  };

  const handleDownloadPDF = async () => {
    if (!contentRef?.current) {
      console.error("Content ref not available");
      return;
    }

    try {
      setDownloading(true);

      const element = contentRef.current.cloneNode(true) as HTMLElement;
      element.style.display = "block";
      // Allow element to take its natural width/height (especially for fixed width PDF views)
      element.style.width = ""; 
      element.style.height = "auto";
      element.style.overflow = "visible";
      element.style.maxHeight = "none";
      
      // Remove any fixed positioning or transforms that might mess up PDF
      const fixedElements = element.querySelectorAll('[className*="fixed"], [className*="sticky"]');
      fixedElements.forEach(el => {
          (el as HTMLElement).style.position = 'static';
      });

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `${title.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            scrollY: 0,
            // Removed fixed windowWidth to let element determine its own layout
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:text-blue-600 dark:hover:text-blue-400",
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank"
        );
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "hover:text-blue-400 dark:hover:text-blue-300",
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "hover:text-blue-700 dark:hover:text-blue-500",
      onClick: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "_blank"
        );
      },
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "hover:text-green-500 dark:hover:text-green-400",
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
          "_blank"
        );
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:text-red-500 dark:hover:text-red-400",
      onClick: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
        );
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-md ${
          isDarkMode
            ? "bg-gray-900 text-gray-100 border-gray-700"
            : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share This
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold opacity-75">
              Share on Social Media
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {shareOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={option.onClick}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-gray-100 hover:bg-gray-200"
                    } ${option.color}`}
                    title={option.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate URL Section */}
          <div className="space-y-3 border-t border-gray-300 dark:border-gray-600 pt-4">
            <h3 className="text-sm font-semibold opacity-75">
              Share Link
            </h3>
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <input
                type="text"
                value={generateShareUrl()}
                readOnly
                className={`flex-1 bg-transparent outline-none text-sm truncate ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              />
              <button
                onClick={handleCopyUrl}
                className={`p-2 rounded transition-all ${
                  copied
                    ? "text-green-500"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                }`}
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-500">URL copied to clipboard!</p>
            )}
          </div>

          {/* Download PDF Section */}
          <div className="space-y-3 border-t border-gray-300 dark:border-gray-600 pt-4">
            <h3 className="text-sm font-semibold opacity-75">
              Download Details
            </h3>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={`w-full flex items-center justify-center gap-2 ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              } border border-gray-300 dark:border-gray-600`}
              variant="outline"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating PDF..." : "Download as PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

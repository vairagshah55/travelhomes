import html2pdf from 'html2pdf.js';

export interface PDFOptions {
  filename: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  compress?: boolean;
}

export const generatePDF = (elementId: string, options: PDFOptions) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const opt = {
    margin: 10,
    filename: options.filename || 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: {
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: options.compress !== false,
    },
  };

  html2pdf().set(opt).from(element).save();
};

export const downloadDetailsAsPDF = (
  data: Record<string, any>,
  filename: string,
  title: string
) => {
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.backgroundColor = '#fff';
  element.style.color = '#000';

  const logoUrl = 'https://api.builder.io/api/v1/image/assets/TEMP/ef12e49186360c5f295a30497de96e3fcb05f7d8?width=160';

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
                  ${value.map((item) => `<li style="margin: 4px 0; font-size: 12px;">${item}</li>`).join('')}
                </ul>
              </div>
            `;
          }
          return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px;">
              <span style="font-weight: 500; color: #555;">${formatKey(key)}</span>
              <span style="color: #333;">${value || 'N/A'}</span>
            </div>
          `;
        })
        .join('')}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #999; font-size: 10px;">
      <p style="margin: 0;">This is an official document from Travel Homes</p>
      <p style="margin: 5px 0 0 0;">For inquiries, visit our website or contact support</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: {
      orientation: 'portrait' as const,
      unit: 'mm',
      format: 'a4',
      compress: true,
    },
  };

  html2pdf().set(opt).from(element).save();
};

const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

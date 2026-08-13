// Onboarding photo uploads go straight from <input type="file"> to a base64
// data URL embedded in a JSON body (see submitCaravanOnboarding.ts and
// friends) — there's no size cap on the client, so a handful of uncompressed
// phone-camera photos can blow past the server's 25MB /api/onboarding limit
// once base64 adds its ~33% overhead. Downscaling + re-encoding here fixes
// the payload at the source instead of just raising the ceiling again.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not load image: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

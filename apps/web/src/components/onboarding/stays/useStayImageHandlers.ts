import React from "react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

interface UseStayImageHandlersInput {
  setCoverImage: React.Dispatch<React.SetStateAction<string | null>>;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  images: (string | null)[];
  setImages: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  entireStayImages: string[];
  setEntireStayImages: React.Dispatch<React.SetStateAction<string[]>>;
  setIdProofImage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: (v: string) => void;
  setFileName: (v: string) => void;
}

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Image-upload handlers for the Stay Details step:
 * - cover photo (single)
 * - per-room photos (multi, base64 data URLs)
 * - entire-stay gallery (slot-based)
 * - individual-stay gallery (slot-based)
 * - ID proof upload (JPG/PNG/PDF + size cap, used on Personal Details step)
 *
 * Returns the full bundle so the page just destructures.
 */
export function useStayImageHandlers({
  setCoverImage,
  setRooms,
  images,
  setImages,
  entireStayImages,
  setEntireStayImages,
  setIdProofImage,
  setError,
  setFileName,
}: UseStayImageHandlersInput) {
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG/PNG)");
      return;
    }
    readFileAsDataUrl(file).then((url) => setCoverImage(url));
  };

  const removeCoverImage = () => setCoverImage(null);

  const removeRoomImage = (roomId: string, index: number) =>
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, photos: (room.photos || []).filter((_, i) => i !== index) }
          : room,
      ),
    );

  const handleRoomImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    roomId: string,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (IMAGE_TYPES.includes(files[i].type)) validFiles.push(files[i]);
    }
    if (validFiles.length === 0) return;

    Promise.all(validFiles.map(readFileAsDataUrl)).then((base64Images) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === roomId
            ? { ...room, photos: [...(room.photos || []), ...base64Images] }
            : room,
        ),
      );
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }
    readFileAsDataUrl(file).then((url) => {
      const newImages = [...images];
      newImages[index] = url;
      setImages(newImages);
    });
  };

  const handleEntireStayImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }
    readFileAsDataUrl(file).then((url) => {
      const newImages = [...entireStayImages];
      newImages[index] = url;
      setEntireStayImages(newImages);
    });
  };

  const removeEntireStayImage = (index: number) =>
    setEntireStayImages((prev) => prev.filter((_, i) => i !== index));

  const handleUploadIDProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    setFileName("");
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }

    readFileAsDataUrl(file).then((url) => setIdProofImage(url));
    setFileName(file.name);
  };

  return {
    handleCoverImageUpload,
    removeCoverImage,
    removeRoomImage,
    handleRoomImageUpload,
    handleImageUpload,
    handleEntireStayImageUpload,
    removeEntireStayImage,
    handleUploadIDProof,
  };
}

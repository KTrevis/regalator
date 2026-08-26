import { useState } from "react";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const MAX_IMAGE_ATTACHMENTS = 5;

export type AttachedImage = {
  id: string;
  name: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
  previewUrl: string;
};

export function useImageAttachments() {
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [error, setError] = useState<string>();

  const addFiles = async (files: File[]) => {
    setError(undefined);
    const imageFiles = files.filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type));
    const availableSlots = MAX_IMAGE_ATTACHMENTS - images.length;

    if (imageFiles.length !== files.length) {
      setError("Only JPEG, PNG, GIF, and WebP images are supported.");
    } else if (imageFiles.length > availableSlots) {
      setError(`You can attach up to ${MAX_IMAGE_ATTACHMENTS} images.`);
    }

    const attachments = await Promise.all(
      imageFiles.slice(0, availableSlots).map(readImage),
    );
    setImages((current) => [...current, ...attachments]);
  };

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const removedImage = current.find(({ id }) => id === imageId);
      if (removedImage) URL.revokeObjectURL(removedImage.previewUrl);
      return current.filter(({ id }) => id !== imageId);
    });
  };

  const clear = () => {
    images.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setImages([]);
    setError(undefined);
  };

  return { images, error, addFiles, removeImage, clear };
}

async function readImage(file: File): Promise<AttachedImage> {
  const dataUrl = await fileToDataUrl(file);
  return {
    id: crypto.randomUUID(),
    name: file.name || "Pasted image",
    mediaType: file.type as AttachedImage["mediaType"],
    data: dataUrl.slice(dataUrl.indexOf(",") + 1),
    previewUrl: URL.createObjectURL(file),
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

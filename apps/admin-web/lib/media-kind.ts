export type MediaKind = "image" | "video";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/webm"]);

export function mediaKindFromMime(mime?: string | null): MediaKind {
  const value = (mime ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (VIDEO_MIMES.has(value) || value.startsWith("video/")) return "video";
  return "image";
}

export function mediaKindFromFile(file: File): MediaKind {
  return mediaKindFromMime(file.type);
}

export function isAllowedGalleryMime(mime: string): boolean {
  const value = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  return IMAGE_MIMES.has(value) || VIDEO_MIMES.has(value);
}

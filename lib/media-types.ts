export type MediaKind = "image" | "video";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  url: string;
  mime: string;
  width?: number;
  height?: number;
  duration?: number;
  posterUrl?: string;
  size?: number;
};

export const MAX_MEDIA_ITEMS = 9;
export const MAX_VIDEO_SECONDS = 60;

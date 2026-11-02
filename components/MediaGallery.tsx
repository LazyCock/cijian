import type { MediaItem } from "@/lib/media-types";

export function MediaGallery({ items, compact = false }: { items: MediaItem[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={`media-gallery ${compact ? "compact" : ""}`}>
      {items.map((item, index) => (
        <figure className="media-gallery-item" key={item.id}>
          {item.kind === "video" ? (
            <video
              src={item.url}
              poster={item.posterUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={`视频 ${index + 1}`}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={`作品图片 ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
          )}
        </figure>
      ))}
    </div>
  );
}

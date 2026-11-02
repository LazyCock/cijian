const tones = [
  ["#dbe5ff", "#2f4a8a"],
  ["#f5dfd2", "#8a4f2d"],
  ["#d9eee1", "#2f6b4f"],
  ["#e7dcff", "#5b3d9a"],
  ["#f8e6bd", "#7a5a1f"],
  ["#d9e9f5", "#2f5b78"],
];

function toneFor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return tones[hash % tones.length];
}

type AvatarProps = {
  name: string;
  handle?: string;
  url?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, handle, url, size = 40, className = "" }: AvatarProps) {
  const [background, foreground] = toneFor(handle || name);
  if (url && (url.startsWith("http") || url.startsWith("/"))) {
    return (
      <img
        className={`avatar ${className}`.trim()}
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`avatar avatar-initial ${className}`.trim()}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${background}, ${background}dd)`,
        color: foreground,
        fontSize: Math.max(10, Math.round(size * 0.36)),
      }}
      aria-label={name}
      title={name}
    >
      {name.slice(0, 1)}
    </span>
  );
}
